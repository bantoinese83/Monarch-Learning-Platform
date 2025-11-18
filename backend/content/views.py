import logging

from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response

from .metadata_extractor import MetadataExtractor
from .models import EducationalContent, FileSearchStore
from .serializers import EducationalContentSerializer, FileSearchStoreSerializer
from .services import GeminiFileSearchService
from .tasks import index_educational_content

logger = logging.getLogger(__name__)


class EducationalContentViewSet(viewsets.ModelViewSet):
    serializer_class = EducationalContentSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]  # Required for file uploads
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["subject", "difficulty", "author", "indexed"]
    search_fields = ["title", "description", "subject"]
    ordering_fields = ["created_at", "title", "subject"]
    ordering = ["-created_at"]

    def get_queryset(self):
        if self.request.user.role == "admin":
            return EducationalContent.objects.optimized()
        return EducationalContent.objects.by_uploader(self.request.user.id)

    def create(self, request, *args, **kwargs):
        """Override create to add better error handling"""
        try:
            return super().create(request, *args, **kwargs)
        except Exception as e:
            logger.error(f"Error creating content: {str(e)}", exc_info=True)
            # Return detailed error for debugging
            return Response(
                {
                    "error": "Failed to create content",
                    "detail": str(e),
                    "message": "Please check that all required fields are provided and the file is valid.",
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def perform_create(self, serializer):
        """Create content with proper file handling and error management"""
        try:
            # Serializer.create() already extracts file metadata, so we just save
            content = serializer.save(uploaded_by=self.request.user)

            # Ensure file_size is set (fallback safety check)
            if content.file_size is None or content.file_size == 0:
                if content.file:
                    try:
                        if hasattr(content.file, "size") and content.file.size:
                            content.file_size = content.file.size
                        elif hasattr(content.file, "file") and hasattr(content.file.file, "size"):
                            content.file_size = content.file.file.size
                        else:
                            # Try to get size from file path
                            try:
                                content.file_size = (
                                    content.file.size if hasattr(content.file, "size") else 0
                                )
                            except Exception:
                                content.file_size = 0
                        content.save(update_fields=["file_size"])
                    except Exception as e:
                        logger.warning(f"Could not determine file size: {str(e)}")
                        content.file_size = 0
                        content.save(update_fields=["file_size"])

            # Trigger async indexing (non-blocking) - don't fail upload if this fails
            try:
                index_educational_content.delay(content.id)
            except Exception as e:
                # Log but don't fail if Celery is unavailable
                logger.warning(f"Failed to queue indexing task: {str(e)}")
                # Mark as not indexed but don't fail the upload
                content.indexed = False
                content.indexing_error = f"Failed to queue indexing: {str(e)}"
                content.save(update_fields=["indexed", "indexing_error"])

        except Exception as e:
            # Re-raise with more context
            logger.error(f"Error creating content: {str(e)}", exc_info=True)
            raise

    @action(detail=True, methods=["post"])
    def reindex(self, request, pk=None):
        """Reindex content after updates"""
        content = self.get_object()
        content.indexed = False
        content.indexing_error = ""
        content.save()
        index_educational_content.delay(content.id)
        return Response({"status": "Reindexing started"})

    @action(detail=False, methods=["get"])
    def by_subject(self, request):
        """
        Get content grouped by subject.
        Optimized: Single query with prefetch instead of N+1 queries.
        """
        queryset = self.get_queryset().optimized()

        # Use values_list with distinct for efficient subject extraction
        subjects = queryset.values_list("subject", flat=True).distinct()

        # Single query to get all content, then group in memory (more efficient for small-medium datasets)
        all_content = list(queryset)
        serializer = EducationalContentSerializer(
            all_content, many=True, context={"request": request}
        )

        # Group by subject using dictionary (O(n) instead of O(n*m))
        result = {}
        for item in serializer.data:
            subject = item.get("subject")
            if subject:
                if subject not in result:
                    result[subject] = []
                result[subject].append(item)

        return Response(result)

    @action(detail=False, methods=["post"], parser_classes=[MultiPartParser, FormParser])
    def extract_metadata(self, request):
        """Extract metadata from uploaded file using AI"""
        if "file" not in request.FILES:
            return Response({"error": "No file provided"}, status=status.HTTP_400_BAD_REQUEST)

        file = request.FILES["file"]

        # Validate file type
        allowed_types = [
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "text/plain",
        ]
        if file.content_type not in allowed_types and not any(
            file.name.endswith(ext) for ext in [".pdf", ".docx", ".txt"]
        ):
            return Response(
                {"error": "Unsupported file type. Please upload PDF, DOCX, or TXT files."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate file size (max 20MB for metadata extraction)
        max_size = 20 * 1024 * 1024  # 20MB
        if file.size > max_size:
            return Response(
                {
                    "error": f"File too large. Maximum size for metadata extraction is {max_size // (1024 * 1024)}MB."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            extractor = MetadataExtractor()
            metadata = extractor.extract_metadata(file)
            return Response(metadata, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": f"Failed to extract metadata: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class FileSearchStoreViewSet(viewsets.ModelViewSet):
    serializer_class = FileSearchStoreSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return FileSearchStore.objects.by_user(self.request.user.id)

    def perform_create(self, serializer):
        service = GeminiFileSearchService()
        store = service.create_file_search_store(
            display_name=serializer.validated_data["display_name"], user_id=self.request.user.id
        )
        serializer.instance = store

    def perform_destroy(self, instance):
        service = GeminiFileSearchService()
        service.delete_file_search_store(instance)
