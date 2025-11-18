"""
Assessment generation service using AI
"""

from content.services import GeminiFileSearchService
from students.models import Assessment, KnowledgeGap, StudentProfile


class AssessmentGenerator:
    """Service for generating personalized assessments using AI"""

    def __init__(self):
        self.file_search_service = GeminiFileSearchService()

    def generate_assessment(
        self, student_id: int, subject: str, topic: str = None, num_questions: int = 5
    ) -> dict:
        """
        Generate a personalized assessment for a student using Gemini File Search.
        Returns assessment with questions, options, and correct answers.
        Raises exception if generation fails (no fallback).
        """
        # Get student context
        student_context = self._get_student_context(student_id)

        # Get student's file search stores
        from content.models import EducationalContent, FileSearchStore

        file_stores = FileSearchStore.objects.by_user(student_id)
        if not file_stores:
            raise Exception(
                "No educational content available. Please upload content first to generate assessments."
            )

        # If subject is "General", check if user has content and require specific subject
        if subject == "General":
            # Get all indexed content for this user
            indexed_content = (
                EducationalContent.objects.filter(uploaded_by_id=student_id, indexed=True)
                .values_list("subject", flat=True)
                .distinct()
            )

            if not indexed_content:
                raise Exception(
                    "No indexed educational content available. Please upload and index content first."
                )

            # Suggest using one of the available subjects
            available_subjects = list(indexed_content)
            raise Exception(
                f"Cannot generate 'General' assessments. Please specify a subject. "
                f"Available subjects in your content: {', '.join(available_subjects)}"
            )

        # Determine assessment focus areas
        focus_areas = self._determine_focus_areas(student_id, subject, topic)

        # Generate questions using AI with File Search
        questions = self._generate_questions_with_ai(
            student_context,
            subject,
            topic,
            focus_areas,
            num_questions,
            [store.name for store in file_stores],
        )

        if not questions or len(questions) == 0:
            raise Exception(
                "Failed to generate assessment questions. This may happen if: "
                "1) No educational content is available for this subject, "
                "2) The content doesn't match the requested topic, or "
                "3) There was an issue parsing the AI response. "
                "Please try uploading content for this subject or try a different subject/topic."
            )

        return {
            "id": f"assessment-{student_id}-{subject.lower().replace(' ', '-')}",
            "subject": subject,
            "topic": topic or "Mixed Topics",
            "questions": questions,
            "total_questions": len(questions),
        }

    def _get_student_context(self, student_id: int) -> dict:
        """Get comprehensive student context for personalization"""
        try:
            profile = StudentProfile.objects.select_related("user").get(user_id=student_id)
            return {
                "learning_style": profile.learning_style,
                "grade_level": profile.grade_level,
                "preferred_language": profile.preferred_language,
                "username": profile.user.username,
                "email": profile.user.email,
            }
        except StudentProfile.DoesNotExist:
            return {}

    def _determine_focus_areas(self, student_id: int, subject: str, topic: str = None) -> list[str]:
        """Determine what topics to focus on for the assessment"""
        focus_areas = []

        # If specific topic provided, use it
        if topic:
            focus_areas.append(topic)

        # Get knowledge gaps for this subject
        gaps = KnowledgeGap.objects.by_student(student_id).by_subject(subject).unresolved()
        gap_topics = [gap.topic for gap in gaps if gap.topic][:3]  # Top 3 gaps
        focus_areas.extend(gap_topics)

        # Get topics from recent low-scoring assessments
        recent_assessments = (
            Assessment.objects.by_student(student_id).by_subject(subject).filter(score__lt=70)
        )
        assessment_topics = [
            assessment.topic for assessment in recent_assessments if assessment.topic
        ][:2]
        focus_areas.extend(assessment_topics)

        # Remove duplicates while preserving order
        seen = set()
        unique_focus = []
        for area in focus_areas:
            if area not in seen:
                seen.add(area)
                unique_focus.append(area)

        # If no specific areas found, use general subject knowledge
        if not unique_focus:
            unique_focus = [
                f"Core concepts in {subject}",
                f"Problem solving in {subject}",
                f"Applications of {subject}",
            ]

        return unique_focus[:5]  # Limit to 5 focus areas

    def _generate_questions_with_ai(
        self,
        student_context: dict,
        subject: str,
        topic: str | None,
        focus_areas: list[str],
        num_questions: int,
        file_search_store_names: list[str],
    ) -> list[dict]:
        """Generate questions using AI with Gemini File Search"""
        import logging

        logger = logging.getLogger(__name__)

        # Build personalized prompt
        prompt = self._build_question_generation_prompt(
            student_context, subject, topic, focus_areas, num_questions
        )

        # Build metadata filter for subject
        # STRICT: Only search content matching the requested subject
        # If subject is "General", we should still filter or require specific subject content
        if subject and subject != "General":
            metadata_filter = f'subject="{subject}"'
        else:
            # For "General", don't use metadata filter but ensure questions come from uploaded content
            # The prompt will enforce this
            metadata_filter = None

        # Query Gemini with File Search (like tutor bot)
        try:
            result = self.file_search_service.query_with_file_search(
                query=prompt,
                file_search_store_names=file_search_store_names,
                metadata_filter=metadata_filter,
                student_context=student_context,
            )

            questions_text = result.get("text", "")

            if not questions_text or not questions_text.strip():
                logger.error(
                    f"Gemini returned empty text response. "
                    f"Result keys: {list(result.keys())}, "
                    f"Text length: {len(questions_text) if questions_text else 0}"
                )
                # Try one more time without metadata filter if we had one
                if metadata_filter:
                    logger.info("Retrying without metadata filter...")
                    try:
                        result = self.file_search_service.query_with_file_search(
                            query=prompt,
                            file_search_store_names=file_search_store_names,
                            metadata_filter=None,  # Remove filter
                            student_context=student_context,
                        )
                        questions_text = result.get("text", "")
                        if questions_text and questions_text.strip():
                            logger.info("Retry successful - got response without metadata filter")
                        else:
                            logger.error("Retry also returned empty response")
                            return []
                    except Exception as retry_error:
                        logger.error(f"Retry failed: {retry_error}")
                        return []
                else:
                    return []

            # Parse the AI response into structured questions
            questions = self._parse_ai_questions_response(questions_text, num_questions)

            if not questions:
                logger.error(
                    f"Failed to parse questions from response. Response length: {len(questions_text)}"
                )

            return questions
        except Exception as e:
            logger.error(f"Error generating questions with AI: {e}", exc_info=True)
            return []

    def _build_question_generation_prompt(
        self,
        student_context: dict,
        subject: str,
        topic: str | None,
        focus_areas: list[str],
        num_questions: int,
    ) -> str:
        """Build a comprehensive prompt for question generation using Gemini best practices"""

        # Build context section
        context_parts = []
        if student_context.get("grade_level"):
            context_parts.append(f"Grade level: {student_context['grade_level']}")
        if student_context.get("learning_style"):
            context_parts.append(f"Learning style: {student_context['learning_style']}")
        if student_context.get("username"):
            context_parts.append(f"Student: {student_context['username']}")

        context_str = (
            "\n".join(f"- {part}" for part in context_parts) if context_parts else "- Not specified"
        )

        # Build focus areas
        focus_str = (
            "\n".join(f"- {area}" for area in focus_areas)
            if focus_areas
            else "- Content from uploaded files"
        )

        # Build topic line
        topic_line = f"Topic: {topic}" if topic else "Topic: Mixed Topics"

        # Few-shot examples showing the exact format
        examples = """Example 1:
Input: Educational content about software development methodologies
Output:
[
  {
    "question": "According to the content, which methodology emphasizes iterative development and customer collaboration?",
    "options": ["Waterfall", "Agile", "V-Model", "Big Bang"],
    "correct_answer": "Agile",
    "explanation": "The content states that Agile methodology focuses on iterative development cycles and continuous customer collaboration throughout the project."
  }
]

Example 2:
Input: Technical documentation about database systems
Output:
[
  {
    "question": "What is the primary advantage of using a relational database as described in the documentation?",
    "options": ["Faster performance", "Data integrity through relationships", "Lower storage costs", "Easier to learn"],
    "correct_answer": "Data integrity through relationships",
    "explanation": "The documentation explains that relational databases maintain data integrity by enforcing relationships between tables through foreign keys and constraints."
  }
]"""

        prompt_parts = [
            "Task: Generate assessment questions from uploaded educational content files.",
            "",
            "Context:",
            context_str,
            "",
            f"Subject: {subject}",
            topic_line,
            "",
            "Focus Areas (from uploaded content only):",
            focus_str,
            "",
            "Instructions:",
            "1. Use ONLY information from the uploaded educational content files provided through file search",
            "2. Base ALL questions exclusively on facts, concepts, and details found in the uploaded content",
            "3. DO NOT use general knowledge, common knowledge, or information outside the provided content",
            "4. If the content lacks sufficient information for this subject/topic, return an error JSON object",
            "",
            "Constraints:",
            f"- Generate exactly {num_questions} multiple-choice questions",
            "- Each question must have exactly 4 answer options",
            "- One option must be clearly correct based on the content",
            "- Include a brief explanation citing the content",
            "- Questions should test understanding, not just memorization",
            "",
            "Response Format:",
            "Return ONLY a valid JSON array. No explanatory text before or after.",
            "",
            "Examples:",
            examples,
            "",
            "Now generate questions based on the uploaded content:",
            "",
            "Output:",
        ]

        return "\n".join(prompt_parts)

    def _parse_ai_questions_response(self, response_text: str, expected_count: int) -> list[dict]:
        """Parse AI-generated questions from text response"""
        import json
        import logging
        import re

        logger = logging.getLogger(__name__)

        if not response_text or not response_text.strip():
            logger.warning("Empty response text from Gemini")
            return []

        # Check if Gemini is saying it can't find content or is using general knowledge
        response_lower = response_text.lower()
        no_content_indicators = [
            "unable to generate",
            "no educational content",
            "no content was provided",
            "no content found",
            "content was not found",
            "unable to find",
            "no files found",
            "no matching content",
            "no relevant content found",
        ]

        # Check if response contains error about no content
        if any(indicator in response_lower for indicator in no_content_indicators):
            logger.warning(f"Gemini indicates no content found: {response_text[:500]}")
            # Check if it's a JSON error response
            try:
                error_data = json.loads(response_text.strip())
                if isinstance(error_data, dict) and "error" in error_data:
                    raise Exception(error_data["error"])
            except (json.JSONDecodeError, KeyError):
                pass
            # If not JSON error, raise exception
            raise Exception(
                "No relevant content found for this subject/topic in the uploaded materials. Please upload content for this subject first."
            )

        # Check if Gemini is using general knowledge (not allowed)
        general_knowledge_indicators = [
            "based on general knowledge",
            "using general knowledge",
            "from general knowledge",
            "general understanding",
            "common knowledge",
            "widely known",
            "not found in the provided content",
            "not in the uploaded",
            "not in the provided",
        ]

        if any(indicator in response_lower for indicator in general_knowledge_indicators):
            logger.error(f"Gemini attempted to use general knowledge: {response_text[:500]}")
            raise Exception(
                "Assessment questions must be based only on uploaded content. The AI attempted to use general knowledge, which is not allowed."
            )

        # Log first 500 chars of response for debugging
        logger.info(f"Parsing Gemini response (first 500 chars): {response_text[:500]}")

        try:
            # Try multiple strategies to extract JSON
            questions_data = None

            # Strategy 1: Look for JSON array in the response (most common)
            # Use a more robust pattern that handles nested brackets
            json_match = re.search(r"\[(?:[^\[\]]+|\[[^\]]*\])*\]", response_text, re.DOTALL)
            if json_match:
                try:
                    questions_data = json.loads(json_match.group())
                    logger.info("Successfully extracted JSON array using regex")
                except json.JSONDecodeError as e:
                    logger.warning(f"Failed to parse JSON from regex match: {e}")
                    # Try a simpler approach - find the first [ and last ]
                    start_idx = response_text.find("[")
                    end_idx = response_text.rfind("]")
                    if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
                        try:
                            questions_data = json.loads(response_text[start_idx : end_idx + 1])
                            logger.info("Successfully extracted JSON using bracket positions")
                        except json.JSONDecodeError:
                            pass

            # Strategy 2: Look for JSON wrapped in code blocks
            if not questions_data:
                code_block_match = re.search(
                    r"```(?:json)?\s*(\[.*?\])\s*```", response_text, re.DOTALL
                )
                if code_block_match:
                    try:
                        questions_data = json.loads(code_block_match.group(1))
                        logger.info("Successfully extracted JSON from code block")
                    except json.JSONDecodeError as e:
                        logger.warning(f"Failed to parse JSON from code block: {e}")

            # Strategy 3: Try parsing the entire response as JSON
            if not questions_data:
                try:
                    questions_data = json.loads(response_text.strip())
                    logger.info("Successfully parsed entire response as JSON")
                except json.JSONDecodeError as e:
                    logger.warning(f"Failed to parse entire response as JSON: {e}")

            # Strategy 4: Try to find JSON object with 'questions' key
            if not questions_data:
                questions_match = re.search(
                    r'"questions"\s*:\s*(\[.*?\])', response_text, re.DOTALL
                )
                if questions_match:
                    try:
                        questions_data = json.loads(questions_match.group(1))
                        logger.info("Successfully extracted questions array from object")
                    except json.JSONDecodeError as e:
                        logger.warning(f"Failed to parse questions from object: {e}")

            if not questions_data:
                logger.error(
                    f"Could not extract JSON from response. Full response: {response_text[:1000]}"
                )
                return []

            # Ensure it's a list
            if not isinstance(questions_data, list):
                if isinstance(questions_data, dict) and "questions" in questions_data:
                    questions_data = questions_data["questions"]
                else:
                    logger.error(f"Expected list but got {type(questions_data)}")
                    return []

            # Validate and format the questions
            validated_questions = []
            for i, q_data in enumerate(questions_data):
                if i >= expected_count:
                    break

                # Ensure required fields exist
                if not isinstance(q_data, dict):
                    logger.warning(f"Question {i} is not a dict: {q_data}")
                    continue

                if not all(key in q_data for key in ["question", "options", "correct_answer"]):
                    logger.warning(f"Question {i} missing required fields: {q_data.keys()}")
                    continue

                # Convert options to list if it's not already
                options = q_data["options"]
                if isinstance(options, str):
                    # Try to parse as comma-separated or JSON
                    try:
                        options = json.loads(options)
                    except (json.JSONDecodeError, TypeError):
                        options = [opt.strip() for opt in options.split(",")]

                # Ensure exactly 4 options
                if not isinstance(options, list) or len(options) != 4:
                    logger.warning(
                        f"Question {i} has {len(options) if isinstance(options, list) else 'invalid'} options, expected 4"
                    )
                    continue

                validated_questions.append(
                    {
                        "id": f"q{i + 1}",
                        "question": str(q_data["question"]).strip(),
                        "options": [str(opt).strip() for opt in options],
                        "correct_answer": str(q_data["correct_answer"]).strip(),
                        "explanation": str(
                            q_data.get("explanation", "This is the correct answer.")
                        ).strip(),
                    }
                )

            logger.info(
                f"Successfully parsed {len(validated_questions)} questions from {len(questions_data)} total"
            )
            return validated_questions

        except Exception as e:  # noqa: E722
            logger.error(f"Error parsing AI questions response: {e}", exc_info=True)
            return []
