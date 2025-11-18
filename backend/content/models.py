from django.conf import settings
from django.db import models

from students.mixins import TimeStampedModel

from .managers import EducationalContentManager, FileSearchStoreManager


class FileSearchStore(TimeStampedModel):
    """Represents a Gemini File Search store"""

    name = models.CharField(max_length=200, unique=True, db_index=True)
    display_name = models.CharField(max_length=200)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="file_stores",
        db_index=True,
    )

    objects = FileSearchStoreManager()

    class Meta:
        db_table = "file_search_stores"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["created_by", "-created_at"]),
        ]


class EducationalContent(TimeStampedModel):
    DIFFICULTY_CHOICES = [
        ("beginner", "Beginner"),
        ("intermediate", "Intermediate"),
        ("advanced", "Advanced"),
    ]

    title = models.CharField(max_length=500, db_index=True)
    description = models.TextField(blank=True)
    file = models.FileField(upload_to="educational_content/")
    file_name = models.CharField(max_length=500)  # Original filename
    file_type = models.CharField(max_length=100)  # MIME type
    file_size = models.BigIntegerField()  # Size in bytes

    # Metadata for filtering
    subject = models.CharField(max_length=100, db_index=True)
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES, db_index=True)
    author = models.CharField(max_length=200, blank=True, db_index=True)
    publication_year = models.IntegerField(null=True, blank=True, db_index=True)
    tags = models.JSONField(default=list, blank=True)

    # Gemini File Search integration
    file_search_store = models.ForeignKey(
        FileSearchStore,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="contents",
        db_index=True,
    )
    gemini_file_name = models.CharField(max_length=500, blank=True)  # Gemini file resource name
    indexed = models.BooleanField(default=False, db_index=True)
    indexing_error = models.TextField(blank=True)

    # Versioning
    version = models.IntegerField(default=1)
    parent_content = models.ForeignKey(
        "self", on_delete=models.SET_NULL, null=True, blank=True, related_name="versions"
    )

    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="uploaded_content",
        db_index=True,
    )

    objects = EducationalContentManager()

    class Meta:
        db_table = "educational_content"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["subject", "difficulty"]),
            models.Index(fields=["uploaded_by", "-created_at"]),
            models.Index(fields=["indexed", "-created_at"]),
            models.Index(fields=["subject", "difficulty", "indexed"]),
        ]


class ContentMetadata(models.Model):
    """Additional metadata key-value pairs for content"""

    content = models.ForeignKey(
        EducationalContent, on_delete=models.CASCADE, related_name="custom_metadata", db_index=True
    )
    key = models.CharField(max_length=100, db_index=True)
    string_value = models.CharField(max_length=500, blank=True)
    numeric_value = models.FloatField(null=True, blank=True)

    class Meta:
        db_table = "content_metadata"
        unique_together = ["content", "key"]
        indexes = [
            models.Index(fields=["content", "key"]),
        ]
