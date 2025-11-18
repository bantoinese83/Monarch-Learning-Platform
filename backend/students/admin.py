"""
Enhanced admin interface with 2025 Django features
"""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.db.models import QuerySet
from django.http import HttpRequest
from django.utils.html import format_html

from .models import Assessment, KnowledgeGap, LearningPath, LearningPathItem, StudentProfile, User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Enhanced user admin with facet filters"""

    list_display = ["username", "email", "role", "is_staff", "is_active", "date_joined"]
    list_filter = ["role", "is_staff", "is_active", "date_joined"]
    search_fields = ["username", "email", "first_name", "last_name"]
    readonly_fields = ["date_joined", "last_login"]
    fieldsets = BaseUserAdmin.fieldsets + (
        ("Additional Info", {"fields": ("role", "date_of_birth")}),
    )

    def get_queryset(self, request: HttpRequest) -> QuerySet[User]:
        """Optimize queryset with select_related"""
        qs = super().get_queryset(request)
        return qs.select_related("student_profile")


@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):
    """Enhanced student profile admin"""

    list_display = ["user", "learning_style", "grade_level", "preferred_language", "created_at"]
    list_filter = ["learning_style", "grade_level", "preferred_language", "created_at"]
    search_fields = ["user__username", "user__email", "learning_goals"]
    readonly_fields = ["created_at", "updated_at"]
    autocomplete_fields = ["user"]

    def get_queryset(self, request: HttpRequest) -> QuerySet[StudentProfile]:
        """Optimize queryset"""
        return super().get_queryset(request).select_related("user")


@admin.register(KnowledgeGap)
class KnowledgeGapAdmin(admin.ModelAdmin):
    """Enhanced knowledge gap admin with facet filters"""

    list_display = ["student", "subject", "topic", "severity_badge", "resolved", "identified_at"]
    list_filter = ["resolved", "subject", "severity", "identified_at"]
    search_fields = ["student__username", "subject", "topic"]
    readonly_fields = ["identified_at", "created_at", "updated_at"]
    autocomplete_fields = ["student"]
    date_hierarchy = "identified_at"

    def severity_badge(self, obj: KnowledgeGap) -> str:
        """Display severity with color coding"""
        colors = {
            (1, 3): "green",
            (4, 6): "orange",
            (7, 10): "red",
        }
        color = next(
            (c for (low, high), c in colors.items() if low <= obj.severity <= high), "gray"
        )
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 3px;">{}</span>',
            color,
            obj.severity,
        )

    severity_badge.short_description = "Severity"

    def get_queryset(self, request: HttpRequest) -> QuerySet[KnowledgeGap]:
        """Optimize queryset"""
        return super().get_queryset(request).select_related("student")


@admin.register(Assessment)
class AssessmentAdmin(admin.ModelAdmin):
    """Enhanced assessment admin with analytics"""

    list_display = ["student", "subject", "topic", "score_display", "max_score", "completed_at"]
    list_filter = ["subject", "completed_at", "score"]
    search_fields = ["student__username", "subject", "topic"]
    readonly_fields = ["completed_at", "created_at", "updated_at"]
    autocomplete_fields = ["student"]
    date_hierarchy = "completed_at"

    def score_display(self, obj: Assessment) -> str:
        """Display score with percentage and color"""
        percentage = (obj.score / obj.max_score * 100) if obj.max_score > 0 else 0
        color = "green" if percentage >= 70 else "orange" if percentage >= 50 else "red"
        return format_html(
            '<span style="color: {}; font-weight: bold;">{} / {} ({:.1f}%)</span>',
            color,
            obj.score,
            obj.max_score,
            percentage,
        )

    score_display.short_description = "Score"

    def get_queryset(self, request: HttpRequest) -> QuerySet[Assessment]:
        """Optimize queryset"""
        return super().get_queryset(request).select_related("student")


@admin.register(LearningPath)
class LearningPathAdmin(admin.ModelAdmin):
    """Enhanced learning path admin"""

    list_display = ["student", "name", "subject", "progress_display", "completed", "created_at"]
    list_filter = ["subject", "completed", "created_at"]
    search_fields = ["student__username", "name", "subject"]
    readonly_fields = ["created_at", "updated_at"]
    autocomplete_fields = ["student"]
    date_hierarchy = "created_at"

    def progress_display(self, obj: LearningPath) -> str:
        """Display progress with visual indicator"""
        items = obj.items.all()
        total = len(items)
        completed = sum(1 for item in items if item.completed)
        progress = (completed / total * 100) if total > 0 else 0
        return format_html(
            '<div style="width: 100px; background-color: #f0f0f0; border-radius: 3px;">'
            '<div style="width: {}%; background-color: #4CAF50; height: 20px; border-radius: 3px; text-align: center; color: white; font-size: 11px; line-height: 20px;">{:.0f}%</div>'
            "</div>",
            progress,
            progress,
        )

    progress_display.short_description = "Progress"

    def get_queryset(self, request: HttpRequest) -> QuerySet[LearningPath]:
        """Optimize queryset with prefetch"""
        return super().get_queryset(request).select_related("student").prefetch_related("items")


@admin.register(LearningPathItem)
class LearningPathItemAdmin(admin.ModelAdmin):
    """Enhanced learning path item admin"""

    list_display = ["learning_path", "content", "order", "completed", "score", "completed_at"]
    list_filter = ["completed", "learning_path__subject"]
    search_fields = ["learning_path__name", "content__title"]
    autocomplete_fields = ["learning_path", "content"]

    def get_queryset(self, request: HttpRequest) -> QuerySet[LearningPathItem]:
        """Optimize queryset"""
        return super().get_queryset(request).select_related("learning_path", "content")
