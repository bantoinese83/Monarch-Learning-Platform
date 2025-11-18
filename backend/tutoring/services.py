"""
Tutor bot service with RAG using Gemini File Search
"""

from content.services import GeminiFileSearchService
from students.models import StudentProfile


class TutorBotService:
    """Service for tutor bot interactions with RAG"""

    def __init__(self):
        self.file_search_service = GeminiFileSearchService()

    def generate_response(
        self,
        query: str,
        student_id: int,
        conversation_history: list[dict] | None = None,
        subject_filter: str | None = None,
        difficulty_filter: str | None = None,
    ) -> dict:
        """
        Generate tutor bot response using RAG.
        Returns response with text and citations.
        """
        try:
            # Get student profile for context
            student_context = self._get_student_context(student_id)

            # Get file search stores for this student
            file_stores = self._get_student_file_stores(student_id)
            if not file_stores:
                return {
                    "text": "I don't have access to any educational content yet. Please upload some materials first!",
                    "citations": [],
                }

            # Build metadata filter if needed
            metadata_filter = self._build_metadata_filter(subject_filter, difficulty_filter)

            # Build query with conversation context
            enhanced_query = self._build_enhanced_query(query, conversation_history)

            # Query with File Search
            result = self.file_search_service.query_with_file_search(
                query=enhanced_query,
                file_search_store_names=[store.name for store in file_stores],
                metadata_filter=metadata_filter,
                student_context=student_context,
            )

            return result

        except Exception as e:
            return {
                "text": f"I encountered an error: {str(e)}. Please try again or contact support.",
                "citations": [],
            }

    def _get_student_context(self, student_id: int) -> dict | None:
        """Get student profile context for personalized responses"""
        try:
            profile = StudentProfile.objects.select_related("user").get(user_id=student_id)
            return {
                "learning_style": profile.learning_style,
                "grade_level": profile.grade_level,
                "preferred_language": profile.preferred_language,
            }
        except StudentProfile.DoesNotExist:
            return None

    def _get_student_file_stores(self, student_id: int) -> list:
        """Get file search stores accessible to student"""
        from content.models import FileSearchStore

        return list(FileSearchStore.objects.by_user(student_id))

    def _build_metadata_filter(self, subject: str | None, difficulty: str | None) -> str | None:
        """Build metadata filter string for Gemini File Search"""
        filters = []

        if subject:
            filters.append(f'subject="{subject}"')

        if difficulty:
            filters.append(f'difficulty="{difficulty}"')

        if not filters:
            return None

        return " AND ".join(filters)

    def _build_enhanced_query(self, query: str, history: list[dict] | None) -> str:
        """Enhance query with conversation context"""
        if not history or len(history) == 0:
            return query

        # Include recent context (last 3 exchanges)
        context_parts = []
        for msg in history[-6:]:  # Last 3 exchanges (6 messages)
            role_prefix = "Student" if msg["role"] == "user" else "Tutor"
            context_parts.append(f"{role_prefix}: {msg['content']}")

        context = "\n".join(context_parts)
        enhanced = f"""Previous conversation context:
{context}

Current question: {query}

Please provide a helpful answer considering the conversation context."""

        return enhanced
