"""
Custom managers and querysets for tutoring app
"""

from django.db import models


class ConversationQuerySet(models.QuerySet):
    """Custom queryset for conversations"""

    def by_student(self, student_id):
        """Filter by student"""
        return self.filter(student_id=student_id)

    def with_student(self):
        """Select related student"""
        return self.select_related("student")

    def with_messages(self, limit=50):
        """Prefetch messages with limit"""
        # Import here to avoid circular import
        from .models import Message

        return self.prefetch_related(
            models.Prefetch(
                "messages",
                queryset=Message.objects.order_by("created_at")[:limit],
                to_attr="recent_messages",
            )
        )

    def optimized(self):
        """Fully optimized queryset"""
        return self.with_student().with_messages()


class ConversationManager(models.Manager):
    """Custom manager for Conversation model"""

    def get_queryset(self):
        return ConversationQuerySet(self.model, using=self._db)

    def by_student(self, student_id):
        return self.get_queryset().by_student(student_id).optimized()

    def optimized(self):
        return self.get_queryset().optimized()


class MessageQuerySet(models.QuerySet):
    """Custom queryset for messages"""

    def by_conversation(self, conversation_id):
        """Filter by conversation"""
        return self.filter(conversation_id=conversation_id)

    def by_student(self, student_id):
        """Filter by student (through conversation)"""
        return self.filter(conversation__student_id=student_id)

    def with_conversation(self):
        """Select related conversation"""
        return self.select_related("conversation", "conversation__student")

    def recent(self, limit=50):
        """Get recent messages"""
        return self.order_by("created_at")[:limit]

    def optimized(self):
        """Fully optimized queryset"""
        return self.with_conversation()


class MessageManager(models.Manager):
    """Custom manager for Message model"""

    def get_queryset(self):
        return MessageQuerySet(self.model, using=self._db)

    def by_conversation(self, conversation_id):
        return self.get_queryset().by_conversation(conversation_id).with_conversation()

    def by_student(self, student_id):
        return self.get_queryset().by_student(student_id).with_conversation()

    def optimized(self):
        return self.get_queryset().optimized()
