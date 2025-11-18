from rest_framework import serializers

from .models import ContentMetadata, EducationalContent, FileSearchStore


class ContentMetadataSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContentMetadata
        fields = ["id", "key", "string_value", "numeric_value"]


class EducationalContentSerializer(serializers.ModelSerializer):
    uploaded_by_username = serializers.CharField(source="uploaded_by.username", read_only=True)
    file_search_store_name = serializers.CharField(
        source="file_search_store.display_name", read_only=True
    )
    custom_metadata = ContentMetadataSerializer(many=True, read_only=True)
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = EducationalContent
        fields = [
            "id",
            "title",
            "description",
            "file",
            "file_url",
            "file_name",
            "file_type",
            "file_size",
            "subject",
            "difficulty",
            "author",
            "publication_year",
            "tags",
            "file_search_store",
            "file_search_store_name",
            "gemini_file_name",
            "indexed",
            "indexing_error",
            "version",
            "parent_content",
            "uploaded_by",
            "uploaded_by_username",
            "created_at",
            "updated_at",
            "custom_metadata",
        ]
        read_only_fields = [
            "id",
            "file_name",
            "file_type",
            "file_size",
            "gemini_file_name",
            "indexed",
            "indexing_error",
            "uploaded_by",
            "created_at",
            "updated_at",
        ]
        extra_kwargs = {
            "file": {"required": True},
            "title": {"required": True},
            "subject": {"required": True},
            "difficulty": {"required": True},
        }

    def get_file_url(self, obj):
        if obj.file:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.file.url)
        return None

    def validate_file(self, value):
        # Check file size (100MB limit)
        if value.size > 100 * 1024 * 1024:
            raise serializers.ValidationError("File size cannot exceed 100MB")
        return value

    def create(self, validated_data):
        """Override create to extract file metadata before saving"""
        file = validated_data.get("file")

        # Extract file metadata before creating the instance
        if file:
            # Extract filename - handle various file object types
            file_name = "unknown"
            if hasattr(file, "name"):
                file_name = str(file.name)
                # Remove path if present (Django stores as path after save)
                if "/" in file_name or "\\" in file_name:
                    file_name = file_name.replace("\\", "/").split("/")[-1]
            validated_data["file_name"] = file_name

            # Extract content type
            file_type = "application/octet-stream"
            if hasattr(file, "content_type") and file.content_type:
                file_type = file.content_type
            else:
                # Infer from filename extension
                file_name_lower = file_name.lower()
                if file_name_lower.endswith(".pdf"):
                    file_type = "application/pdf"
                elif file_name_lower.endswith(".docx"):
                    file_type = (
                        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    )
                elif file_name_lower.endswith(".doc"):
                    file_type = "application/msword"
                elif file_name_lower.endswith(".txt"):
                    file_type = "text/plain"
            validated_data["file_type"] = file_type

            # Extract file size - CRITICAL: must always be set (not null)
            file_size = 0
            try:
                # Method 1: Direct size attribute (most common)
                if hasattr(file, "size"):
                    file_size = int(file.size) if file.size else 0
                # Method 2: Through file.file.size (for some upload types)
                elif hasattr(file, "file") and hasattr(file.file, "size"):
                    file_size = int(file.file.size) if file.file.size else 0
                # Method 3: Seek to end and get position
                else:
                    try:
                        current_pos = file.tell()
                        file.seek(0, 2)  # Seek to end
                        file_size = int(file.tell())
                        file.seek(current_pos)  # Reset to original position
                    except (AttributeError, OSError):
                        file_size = 0
            except (AttributeError, ValueError, TypeError) as e:
                # Log but don't fail - set to 0 as fallback
                import logging

                logger = logging.getLogger(__name__)
                logger.warning(f"Could not extract file size: {str(e)}")
                file_size = 0

            # Ensure file_size is never None
            validated_data["file_size"] = max(0, int(file_size))
        else:
            # No file provided - set defaults (shouldn't happen due to validation)
            validated_data.setdefault("file_name", "unknown")
            validated_data.setdefault("file_type", "application/octet-stream")
            validated_data.setdefault("file_size", 0)

        # Create the instance with all metadata
        return super().create(validated_data)


class FileSearchStoreSerializer(serializers.ModelSerializer):
    contents_count = serializers.IntegerField(source="contents.count", read_only=True)

    class Meta:
        model = FileSearchStore
        fields = [
            "id",
            "name",
            "display_name",
            "created_by",
            "created_at",
            "updated_at",
            "contents_count",
        ]
        read_only_fields = ["id", "name", "created_at", "updated_at"]
