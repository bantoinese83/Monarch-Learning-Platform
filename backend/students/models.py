from django.contrib.auth.models import AbstractUser
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from .managers import (
    AssessmentManager,
    KnowledgeGapManager,
    LearningPathItemManager,
    LearningPathManager,
    StudentManager,
)
from .mixins import TimeStampedModel


class User(AbstractUser):
    ROLE_CHOICES = [
        ('student', 'Student'),
        ('tutor', 'Tutor'),
        ('admin', 'Administrator'),
    ]

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='student', db_index=True)
    email = models.EmailField(unique=True, db_index=True)
    date_of_birth = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True, db_index=True)

    objects = StudentManager()

    class Meta:
        db_table = 'users'
        indexes = [
            models.Index(fields=['role', 'is_active']),
            models.Index(fields=['email']),
        ]


class StudentProfile(TimeStampedModel):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='student_profile')
    learning_style = models.CharField(max_length=50, blank=True, db_index=True)  # visual, auditory, kinesthetic, reading
    preferred_language = models.CharField(max_length=10, default='en', db_index=True)
    grade_level = models.CharField(max_length=20, blank=True, db_index=True)
    learning_goals = models.TextField(blank=True)

    class Meta:
        db_table = 'student_profiles'
        indexes = [
            models.Index(fields=['learning_style', 'grade_level']),
        ]


class KnowledgeGap(TimeStampedModel):
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='knowledge_gaps', db_index=True)
    subject = models.CharField(max_length=100, db_index=True)
    topic = models.CharField(max_length=200, db_index=True)
    severity = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(10)],
        help_text="1-10 scale indicating gap severity",
        db_index=True
    )
    identified_at = models.DateTimeField(auto_now_add=True, db_index=True)
    resolved = models.BooleanField(default=False, db_index=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    objects = KnowledgeGapManager()

    class Meta:
        db_table = 'knowledge_gaps'
        ordering = ['-severity', '-identified_at']
        indexes = [
            models.Index(fields=['student', 'resolved']),
            models.Index(fields=['subject', 'resolved', '-severity']),
        ]


class Assessment(TimeStampedModel):
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='assessments', db_index=True)
    subject = models.CharField(max_length=100, db_index=True)
    topic = models.CharField(max_length=200, db_index=True)
    score = models.FloatField(validators=[MinValueValidator(0), MaxValueValidator(100)], db_index=True)
    max_score = models.FloatField(default=100)
    completed_at = models.DateTimeField(auto_now_add=True, db_index=True)
    metadata = models.JSONField(default=dict, blank=True)  # Store question-level details

    objects = AssessmentManager()

    class Meta:
        db_table = 'assessments'
        ordering = ['-completed_at']
        indexes = [
            models.Index(fields=['student', '-completed_at']),
            models.Index(fields=['subject', '-completed_at']),
            models.Index(fields=['score']),
        ]


class LearningPath(TimeStampedModel):
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='learning_paths', db_index=True)
    name = models.CharField(max_length=200)
    subject = models.CharField(max_length=100, db_index=True)
    current_position = models.IntegerField(default=0)
    completed = models.BooleanField(default=False, db_index=True)

    objects = LearningPathManager()

    class Meta:
        db_table = 'learning_paths'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['student', 'completed']),
            models.Index(fields=['subject', 'completed']),
        ]


class LearningPathItem(models.Model):
    learning_path = models.ForeignKey(LearningPath, on_delete=models.CASCADE, related_name='items', db_index=True)
    content = models.ForeignKey('content.EducationalContent', on_delete=models.CASCADE, null=True, blank=True, db_index=True)
    order = models.IntegerField(db_index=True)
    completed = models.BooleanField(default=False, db_index=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    score = models.FloatField(null=True, blank=True)

    objects = LearningPathItemManager()

    class Meta:
        db_table = 'learning_path_items'
        ordering = ['order']
        unique_together = ['learning_path', 'order']
        indexes = [
            models.Index(fields=['learning_path', 'order']),
            models.Index(fields=['learning_path', 'completed']),
        ]

