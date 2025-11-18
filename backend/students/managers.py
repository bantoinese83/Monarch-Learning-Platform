"""
Custom managers and querysets for students app
"""

from django.contrib.auth.models import UserManager
from django.db import models


class StudentQuerySet(models.QuerySet):
    """Custom queryset for student-related queries"""

    def with_profiles(self):
        """Prefetch student profiles"""
        return self.select_related("student_profile")

    def active(self):
        """Get active students"""
        return self.filter(is_active=True)

    def by_role(self, role):
        """Filter by role"""
        return self.filter(role=role)

    def with_recent_assessments(self, limit=10):
        """Prefetch recent assessments"""
        return self.prefetch_related(
            models.Prefetch(
                "assessments",
                queryset=self.model.assessments.model.objects.order_by("-completed_at")[:limit],
                to_attr="recent_assessments",
            )
        )


class StudentManager(UserManager):
    """Custom manager for User model that extends UserManager"""

    def get_queryset(self):
        return StudentQuerySet(self.model, using=self._db)

    def with_profiles(self):
        return self.get_queryset().with_profiles()

    def active(self):
        return self.get_queryset().active()

    def by_role(self, role):
        return self.get_queryset().by_role(role)

    def get_optimized(self, pk):
        """Get user with all related data"""
        return self.get_queryset().with_profiles().get(pk=pk)


class AssessmentQuerySet(models.QuerySet):
    """Custom queryset for assessments"""

    def by_student(self, student_id):
        """Filter by student"""
        return self.filter(student_id=student_id)

    def by_subject(self, subject):
        """Filter by subject"""
        return self.filter(subject=subject)

    def recent(self, days=30):
        """Get recent assessments"""
        from datetime import timedelta

        from django.utils import timezone

        cutoff = timezone.now() - timedelta(days=days)
        return self.filter(completed_at__gte=cutoff)

    def low_scores(self, threshold=70):
        """Get assessments below threshold"""
        return self.filter(score__lt=threshold)

    def with_student(self):
        """Select related student"""
        return self.select_related("student")

    def optimized(self):
        """Fully optimized queryset"""
        return self.with_student()


class AssessmentManager(models.Manager):
    """Custom manager for Assessment model"""

    def get_queryset(self):
        return AssessmentQuerySet(self.model, using=self._db)

    def by_student(self, student_id):
        return self.get_queryset().by_student(student_id).optimized()

    def by_subject(self, subject):
        return self.get_queryset().by_subject(subject).optimized()

    def recent(self, days=30):
        return self.get_queryset().recent(days).optimized()

    def low_scores(self, threshold=70):
        return self.get_queryset().low_scores(threshold).optimized()


class KnowledgeGapQuerySet(models.QuerySet):
    """Custom queryset for knowledge gaps"""

    def unresolved(self):
        """Get unresolved gaps"""
        return self.filter(resolved=False)

    def by_severity(self, min_severity=1):
        """Filter by minimum severity"""
        return self.filter(severity__gte=min_severity)

    def by_subject(self, subject):
        """Filter by subject"""
        return self.filter(subject=subject)

    def by_student(self, student_id):
        """Filter by student"""
        return self.filter(student_id=student_id)

    def with_student(self):
        """Select related student"""
        return self.select_related("student")

    def optimized(self):
        """Fully optimized queryset"""
        return self.with_student()


class KnowledgeGapManager(models.Manager):
    """Custom manager for KnowledgeGap model"""

    def get_queryset(self):
        return KnowledgeGapQuerySet(self.model, using=self._db)

    def unresolved(self):
        return self.get_queryset().unresolved().optimized()

    def by_severity(self, min_severity=1):
        return self.get_queryset().by_severity(min_severity).optimized()

    def by_subject(self, subject):
        return self.get_queryset().by_subject(subject).optimized()

    def by_student(self, student_id):
        return self.get_queryset().by_student(student_id).optimized()


class LearningPathQuerySet(models.QuerySet):
    """Custom queryset for learning paths"""

    def active(self):
        """Get active (incomplete) paths"""
        return self.filter(completed=False)

    def completed(self):
        """Get completed paths"""
        return self.filter(completed=True)

    def by_subject(self, subject):
        """Filter by subject"""
        return self.filter(subject=subject)

    def by_student(self, student_id):
        """Filter by student"""
        return self.filter(student_id=student_id)

    def with_items(self):
        """Prefetch path items with content"""
        return self.prefetch_related("items__content", "items__content__uploaded_by")

    def with_student(self):
        """Select related student"""
        return self.select_related("student")

    def optimized(self):
        """Fully optimized queryset"""
        return self.with_student().with_items()


class LearningPathManager(models.Manager):
    """Custom manager for LearningPath model"""

    def get_queryset(self):
        return LearningPathQuerySet(self.model, using=self._db)

    def active(self):
        return self.get_queryset().active().optimized()

    def completed(self):
        return self.get_queryset().completed().optimized()

    def by_subject(self, subject):
        return self.get_queryset().by_subject(subject).optimized()

    def by_student(self, student_id):
        return self.get_queryset().by_student(student_id).optimized()

    def with_items(self):
        return self.get_queryset().with_items().with_student()


class LearningPathItemQuerySet(models.QuerySet):
    """Custom queryset for learning path items"""

    def by_path(self, path_id):
        """Filter by learning path"""
        return self.filter(learning_path_id=path_id)

    def completed(self):
        """Get completed items"""
        return self.filter(completed=True)

    def with_path(self):
        """Select related learning path"""
        return self.select_related("learning_path", "learning_path__student")

    def with_content(self):
        """Select related content"""
        return self.select_related("content", "content__uploaded_by")

    def optimized(self):
        """Fully optimized queryset"""
        return self.with_path().with_content()


class LearningPathItemManager(models.Manager):
    """Custom manager for LearningPathItem model"""

    def get_queryset(self):
        return LearningPathItemQuerySet(self.model, using=self._db)

    def by_path(self, path_id):
        return self.get_queryset().by_path(path_id).optimized()

    def optimized(self):
        return self.get_queryset().optimized()
