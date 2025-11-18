"""
Gemini File Search integration service
"""

import time

from django.conf import settings
from google import genai
from google.genai import types

from .models import EducationalContent, FileSearchStore


class GeminiFileSearchService:
    """Service for managing Gemini File Search operations"""

    def __init__(self):
        if not settings.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY not configured")
        self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
        self.model = settings.GEMINI_MODEL

    def create_file_search_store(self, display_name: str, user_id: int) -> FileSearchStore:
        """Create a new File Search store (matches official API)"""
        try:
            # Create File Search store using official API
            gemini_store = self.client.file_search_stores.create(
                config={"display_name": display_name}
            )

            # Store in our database
            store = FileSearchStore.objects.create(
                name=gemini_store.name, display_name=display_name, created_by_id=user_id
            )
            return store
        except Exception as e:
            raise Exception(f"Failed to create file search store: {str(e)}")

    def upload_and_index_file(
        self, content: EducationalContent, chunking_config: dict | None = None
    ) -> str:
        """
        Upload file directly to File Search store and index it.
        Returns the Gemini file name.
        Matches official Gemini File Search API documentation.
        """
        try:
            if not content.file_search_store:
                # Create a default store for this user if none exists
                store = self._get_or_create_user_store(content.uploaded_by)
                content.file_search_store = store
                content.save()

            # Build config according to official API docs
            config = {
                "display_name": content.file_name,
            }

            # Add custom metadata for filtering (if available)
            custom_metadata = self._build_metadata(content)
            if custom_metadata:
                config["custom_metadata"] = custom_metadata

            # Add chunking config if provided (matches official API structure)
            if chunking_config:
                config["chunking_config"] = chunking_config

            # Upload and import to File Search store (official API method)
            operation = self.client.file_search_stores.upload_to_file_search_store(
                file=content.file.path,
                file_search_store_name=content.file_search_store.name,
                config=config,
            )

            # Wait for indexing to complete (matches official API pattern)
            # Official docs recommend checking every 5 seconds
            poll_interval = 5.0  # Match official docs recommendation
            max_attempts = 120  # Maximum 10 minutes (120 * 5s)
            attempts = 0

            while not operation.done and attempts < max_attempts:
                time.sleep(poll_interval)
                operation = self.client.operations.get(operation)
                attempts += 1

            if not operation.done:
                raise Exception(
                    f"Indexing operation timed out after {max_attempts * poll_interval}s"
                )

            # Indexing complete - mark as indexed
            # Note: The file gets deleted after 48h, but indexing is complete
            content.indexed = True
            content.save()

            # Return empty string (file name not needed after indexing)
            return ""

        except Exception as e:
            # Save error to content for debugging
            error_msg = str(e)
            content.indexing_error = error_msg[:1000]  # Limit length
            content.indexed = False
            content.save(update_fields=["indexed", "indexing_error"])
            raise Exception(f"Failed to index file: {error_msg}")

    def query_with_file_search(
        self,
        query: str,
        file_search_store_names: list[str],
        metadata_filter: str | None = None,
        student_context: dict | None = None,
    ) -> dict:
        """
        Query Gemini with File Search tool enabled.
        Returns response with citations.
        Matches official API documentation structure.
        """
        try:
            # Build system context based on student profile if provided
            system_instruction = self._build_system_instruction(student_context)

            # Build tool config according to official API docs
            tool_config = types.Tool(
                file_search=types.FileSearch(
                    file_search_store_names=file_search_store_names, metadata_filter=metadata_filter
                )
            )

            config = types.GenerateContentConfig(
                tools=[tool_config],
                system_instruction=system_instruction if system_instruction else None,
            )

            # Use official API method
            response = self.client.models.generate_content(
                model=self.model, contents=query, config=config
            )

            # Extract response text and citations
            text_output = ""

            # Strategy 1: Try direct text attribute
            if hasattr(response, "text") and response.text:
                text_output = response.text
            # Strategy 2: Extract from candidates
            elif hasattr(response, "candidates") and response.candidates:
                parts_text: list[str] = []
                for candidate in response.candidates:
                    # Check for finish_reason - if blocked, log it
                    if hasattr(candidate, "finish_reason"):
                        finish_reason = candidate.finish_reason
                        if finish_reason and finish_reason != "STOP":
                            import logging

                            logger = logging.getLogger(__name__)
                            logger.warning(f"Gemini finish_reason: {finish_reason}")
                            # If RECITATION or SAFETY, the response was blocked
                            if str(finish_reason) in ["RECITATION", "SAFETY"]:
                                raise Exception(
                                    f"Gemini blocked the response (finish_reason: {finish_reason}). "
                                    "This may happen if the prompt triggers safety filters. "
                                    "Please try rephrasing your request or check the content."
                                )

                    # Each candidate may have multiple parts (Text, FunctionCalls, etc.)
                    content = getattr(candidate, "content", None)
                    if content:
                        # Try direct parts attribute
                        if hasattr(content, "parts") and content.parts:
                            for part in content.parts:
                                part_text = getattr(part, "text", None)
                                if part_text:
                                    parts_text.append(part_text)
                        # Try direct text attribute on content
                        elif hasattr(content, "text") and content.text:
                            parts_text.append(content.text)

                if parts_text:
                    text_output = "\n".join(parts_text)

            # Strategy 3: Try to get text from response directly using str() if all else fails
            if not text_output and hasattr(response, "__str__"):
                try:
                    response_str = str(response)
                    # Only use if it looks like actual content (not just object representation)
                    if response_str and len(response_str) > 50 and not response_str.startswith("<"):
                        text_output = response_str
                except Exception:
                    pass

            # Log if we got empty response for debugging
            if not text_output.strip():
                import logging

                logger = logging.getLogger(__name__)
                logger.warning(
                    f"Gemini returned empty text. Response type: {type(response)}, "
                    f"Has text attr: {hasattr(response, 'text')}, "
                    f"Has candidates: {hasattr(response, 'candidates')}, "
                    f"Candidates count: {len(response.candidates) if hasattr(response, 'candidates') and response.candidates else 0}"
                )
                # Try to log response structure for debugging
                if hasattr(response, "candidates") and response.candidates:
                    for i, candidate in enumerate(response.candidates):
                        logger.warning(
                            f"Candidate {i}: finish_reason={getattr(candidate, 'finish_reason', 'N/A')}"
                        )
                        if hasattr(candidate, "content"):
                            logger.warning(f"  Content type: {type(candidate.content)}")

            result = {
                "text": text_output.strip(),
                "citations": [],
            }

            # Extract grounding metadata (citations)
            if hasattr(response, "candidates") and response.candidates:
                candidate = response.candidates[0]
                if hasattr(candidate, "grounding_metadata") and candidate.grounding_metadata:
                    grounding = candidate.grounding_metadata
                    if (
                        hasattr(grounding, "retrieval_metadata")
                        and grounding.retrieval_metadata
                        and hasattr(grounding.retrieval_metadata, "retrieved_context")
                    ):
                        retrieved_context = grounding.retrieval_metadata.retrieved_context
                        if retrieved_context:
                            for chunk in retrieved_context:
                                if hasattr(chunk, "file") and chunk.file:
                                    result["citations"].append(
                                        {
                                            "file": chunk.file.uri
                                            if hasattr(chunk.file, "uri")
                                            else "",
                                            "display_name": getattr(chunk.file, "display_name", ""),
                                        }
                                    )

            return result

        except Exception as e:
            raise Exception(f"Query failed: {str(e)}")

    def _get_or_create_user_store(self, user) -> FileSearchStore:
        """Get or create a default file search store for user"""
        from django.db import transaction

        with transaction.atomic():
            store, created = FileSearchStore.objects.get_or_create(
                created_by=user,
                defaults={
                    "name": f"store-{user.id}",
                    "display_name": f"{user.username}'s Content Store",
                },
            )

            # If created, also create in Gemini using official API
            if created:
                try:
                    gemini_store = self.client.file_search_stores.create(
                        config={"display_name": store.display_name}
                    )
                    store.name = gemini_store.name
                    store.save()
                except Exception as e:
                    store.delete()
                    raise Exception(f"Failed to create Gemini store: {str(e)}")

        return store

    def _build_metadata(self, content: EducationalContent) -> list[dict]:
        """Build custom metadata for Gemini File Search"""
        metadata = []

        if content.subject:
            metadata.append({"key": "subject", "string_value": content.subject})

        if content.difficulty:
            metadata.append({"key": "difficulty", "string_value": content.difficulty})

        if content.author:
            metadata.append({"key": "author", "string_value": content.author})

        if content.publication_year:
            metadata.append({"key": "year", "numeric_value": float(content.publication_year)})

        # Add custom metadata from ContentMetadata model
        for meta in content.custom_metadata.all():
            meta_dict = {"key": meta.key}
            if meta.string_value:
                meta_dict["string_value"] = meta.string_value
            elif meta.numeric_value is not None:
                meta_dict["numeric_value"] = meta.numeric_value
            metadata.append(meta_dict)

        return metadata

    def _build_system_instruction(self, student_context: dict | None) -> str | None:
        """Build system instruction based on student profile"""
        if not student_context:
            return None

        instruction_parts = [
            "You are an educational tutor bot. Provide clear, helpful explanations."
        ]

        if student_context.get("grade_level"):
            instruction_parts.append(
                f"Adapt explanations for {student_context['grade_level']} level."
            )

        if student_context.get("learning_style"):
            style = student_context["learning_style"]
            if style == "visual":
                instruction_parts.append("Use visual analogies and examples when possible.")
            elif style == "auditory":
                instruction_parts.append(
                    "Explain concepts verbally with clear step-by-step instructions."
                )
            elif style == "reading":
                instruction_parts.append("Provide detailed written explanations with examples.")

        if (
            student_context.get("preferred_language")
            and student_context["preferred_language"] != "en"
        ):
            instruction_parts.append(
                f"Respond in {student_context['preferred_language']} when appropriate."
            )

        return " ".join(instruction_parts)

    def list_file_search_stores(self, user_id: int) -> list[FileSearchStore]:
        """List all file search stores for a user"""
        return FileSearchStore.objects.by_user(user_id)

    def delete_file_search_store(self, store: FileSearchStore) -> None:
        """Delete a file search store from Gemini and database (matches official API)"""
        try:
            # Use official API method with force=True
            self.client.file_search_stores.delete(name=store.name, config={"force": True})
            store.delete()
        except Exception as e:
            raise Exception(f"Failed to delete store: {str(e)}")
