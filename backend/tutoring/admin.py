"""
Enhanced admin interface for tutoring app
"""
from django.contrib import admin
from django.db.models import QuerySet
from django.http import HttpRequest
from django.utils.html import format_html

from .models import Conversation, Message


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    """Enhanced conversation admin with message count"""
    list_display = ['title', 'student', 'subject', 'message_count', 'last_activity', 'created_at']
    list_filter = ['subject', 'created_at', 'updated_at']
    search_fields = ['title', 'student__username', 'subject']
    readonly_fields = ['created_at', 'updated_at']
    autocomplete_fields = ['student']
    date_hierarchy = 'created_at'

    def message_count(self, obj: Conversation) -> int:
        """Display number of messages"""
        return obj.messages.count()
    message_count.short_description = 'Messages'

    def last_activity(self, obj: Conversation) -> str:
        """Display last activity time"""
        return obj.updated_at.strftime('%Y-%m-%d %H:%M')
    last_activity.short_description = 'Last Activity'

    def get_queryset(self, request: HttpRequest) -> QuerySet[Conversation]:
        """Optimize queryset"""
        return super().get_queryset(request).select_related('student').prefetch_related('messages')


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    """Enhanced message admin with role badges"""
    list_display = ['conversation', 'role_badge', 'content_preview', 'citation_count', 'created_at']
    list_filter = ['role', 'created_at', 'conversation__subject']
    search_fields = ['content', 'conversation__title', 'conversation__student__username']
    readonly_fields = ['created_at']
    autocomplete_fields = ['conversation']
    date_hierarchy = 'created_at'

    def role_badge(self, obj: Message) -> str:
        """Display role with color coding"""
        color = 'blue' if obj.role == 'user' else 'green'
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 3px; text-transform: capitalize;">{}</span>',
            color, obj.role
        )
    role_badge.short_description = 'Role'

    def content_preview(self, obj: Message) -> str:
        """Display content preview"""
        preview = obj.content[:100] + '...' if len(obj.content) > 100 else obj.content
        return format_html('<span title="{}">{}</span>', obj.content, preview)
    content_preview.short_description = 'Content'

    def citation_count(self, obj: Message) -> int:
        """Display number of citations"""
        return len(obj.citations) if obj.citations else 0
    citation_count.short_description = 'Citations'

    def get_queryset(self, request: HttpRequest) -> QuerySet[Message]:
        """Optimize queryset"""
        return super().get_queryset(request).select_related('conversation', 'conversation__student')

