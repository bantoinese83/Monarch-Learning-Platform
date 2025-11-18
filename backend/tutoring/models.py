from django.conf import settings
from django.db import models

from students.mixins import TimeStampedModel

from .managers import ConversationManager, MessageManager


class Conversation(TimeStampedModel):
    """Represents a tutoring conversation session"""

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="conversations",
        db_index=True,
    )
    title = models.CharField(max_length=200, blank=True)  # Auto-generated from first message
    subject = models.CharField(
        max_length=100, blank=True, db_index=True
    )  # Detected from conversation

    objects = ConversationManager()

    class Meta:
        db_table = "conversations"
        ordering = ["-updated_at"]
        indexes = [
            models.Index(fields=["student", "-updated_at"]),
            models.Index(fields=["subject", "-updated_at"]),
        ]


class Message(models.Model):
    """Individual messages in a conversation"""

    ROLE_CHOICES = [
        ("user", "User"),
        ("assistant", "Assistant"),
    ]

    conversation = models.ForeignKey(
        Conversation, on_delete=models.CASCADE, related_name="messages", db_index=True
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, db_index=True)
    content = models.TextField()
    citations = models.JSONField(default=list, blank=True)  # Store file citations
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    objects = MessageManager()

    class Meta:
        db_table = "messages"
        ordering = ["created_at"]
        indexes = [
            models.Index(fields=["conversation", "created_at"]),
            models.Index(fields=["conversation", "role"]),
        ]
