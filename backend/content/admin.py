"""
Enhanced admin interface for content app
"""
from django.contrib import admin
from django.db.models import QuerySet
from django.http import HttpRequest
from django.utils.html import format_html

from .models import ContentMetadata, EducationalContent, FileSearchStore


@admin.register(FileSearchStore)
class FileSearchStoreAdmin(admin.ModelAdmin):
    """Enhanced file search store admin"""
    list_display = ['display_name', 'name', 'created_by', 'content_count', 'created_at']
    list_filter = ['created_at']
    search_fields = ['display_name', 'name', 'created_by__username']
    readonly_fields = ['name', 'created_at', 'updated_at']
    autocomplete_fields = ['created_by']
    date_hierarchy = 'created_at'

    def content_count(self, obj: FileSearchStore) -> int:
        """Display number of content items in store"""
        return obj.contents.count()
    content_count.short_description = 'Content Items'

    def get_queryset(self, request: HttpRequest) -> QuerySet[FileSearchStore]:
        """Optimize queryset"""
        return super().get_queryset(request).select_related('created_by').prefetch_related('contents')


@admin.register(EducationalContent)
class EducationalContentAdmin(admin.ModelAdmin):
    """Enhanced educational content admin with facet filters"""
    list_display = ['title', 'subject', 'difficulty_badge', 'uploaded_by', 'indexed_status', 'file_size_display', 'created_at']
    list_filter = ['subject', 'difficulty', 'indexed', 'created_at', 'uploaded_by']
    search_fields = ['title', 'description', 'subject', 'author', 'uploaded_by__username']
    readonly_fields = ['file_name', 'file_type', 'file_size', 'gemini_file_name', 'indexed', 'indexing_error', 'created_at', 'updated_at']
    autocomplete_fields = ['uploaded_by', 'file_search_store', 'parent_content']
    date_hierarchy = 'created_at'
    filter_horizontal = []  # For future many-to-many fields

    def difficulty_badge(self, obj: EducationalContent) -> str:
        """Display difficulty with color coding"""
        colors = {
            'beginner': 'green',
            'intermediate': 'orange',
            'advanced': 'red',
        }
        color = colors.get(obj.difficulty, 'gray')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 3px; text-transform: capitalize;">{}</span>',
            color, obj.difficulty
        )
    difficulty_badge.short_description = 'Difficulty'

    def indexed_status(self, obj: EducationalContent) -> str:
        """Display indexing status"""
        if obj.indexed:
            return format_html('<span style="color: green;">✓ Indexed</span>')
        elif obj.indexing_error:
            return format_html('<span style="color: red;">✗ Error</span>')
        else:
            return format_html('<span style="color: orange;">⏳ Pending</span>')
    indexed_status.short_description = 'Status'

    def file_size_display(self, obj: EducationalContent) -> str:
        """Display file size in human-readable format"""
        size = obj.file_size
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size < 1024.0:
                return f"{size:.1f} {unit}"
            size /= 1024.0
        return f"{size:.1f} TB"
    file_size_display.short_description = 'Size'

    def get_queryset(self, request: HttpRequest) -> QuerySet[EducationalContent]:
        """Optimize queryset"""
        return super().get_queryset(request).select_related('uploaded_by', 'file_search_store').prefetch_related('custom_metadata')


@admin.register(ContentMetadata)
class ContentMetadataAdmin(admin.ModelAdmin):
    """Enhanced content metadata admin"""
    list_display = ['content', 'key', 'value_display']
    list_filter = ['key', 'content__subject']
    search_fields = ['content__title', 'key', 'string_value']
    autocomplete_fields = ['content']

    def value_display(self, obj: ContentMetadata) -> str:
        """Display value (string or numeric)"""
        return obj.string_value if obj.string_value else str(obj.numeric_value) if obj.numeric_value is not None else '-'
    value_display.short_description = 'Value'

    def get_queryset(self, request: HttpRequest) -> QuerySet[ContentMetadata]:
        """Optimize queryset"""
        return super().get_queryset(request).select_related('content')

