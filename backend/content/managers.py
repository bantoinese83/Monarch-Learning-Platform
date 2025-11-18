"""
Custom managers and querysets for content app
"""

from django.db import models


class FileSearchStoreQuerySet(models.QuerySet):
    """Custom queryset for file search stores"""

    def by_user(self, user_id):
        """Filter by user"""
        return self.filter(created_by_id=user_id)

    def with_creator(self):
        """Select related creator"""
        return self.select_related("created_by")

    def optimized(self):
        """Fully optimized queryset"""
        return self.with_creator()


class FileSearchStoreManager(models.Manager):
    """Custom manager for FileSearchStore model"""

    def get_queryset(self):
        return FileSearchStoreQuerySet(self.model, using=self._db)

    def by_user(self, user_id):
        return self.get_queryset().by_user(user_id).with_creator()

    def optimized(self):
        return self.get_queryset().optimized()


class EducationalContentQuerySet(models.QuerySet):
    """Custom queryset for educational content"""

    def indexed(self):
        """Get indexed content"""
        return self.filter(indexed=True)

    def by_subject(self, subject):
        """Filter by subject"""
        return self.filter(subject=subject)

    def by_difficulty(self, difficulty):
        """Filter by difficulty"""
        return self.filter(difficulty=difficulty)

    def by_author(self, author):
        """Filter by author"""
        return self.filter(author=author)

    def by_uploader(self, user_id):
        """Filter by uploader"""
        return self.filter(uploaded_by_id=user_id)

    def with_uploader(self):
        """Select related uploader"""
        return self.select_related("uploaded_by")

    def with_store(self):
        """Select related file search store"""
        return self.select_related("file_search_store", "file_search_store__created_by")

    def with_metadata(self):
        """Prefetch custom metadata"""
        return self.prefetch_related("custom_metadata")

    def optimized(self):
        """Fully optimized queryset"""
        return self.with_uploader().with_store().with_metadata()

    def only_essential(self):
        """Load only essential fields for list views"""
        return self.only(
            "id",
            "title",
            "subject",
            "difficulty",
            "author",
            "indexed",
            "created_at",
            "uploaded_by_id",
        )


class EducationalContentManager(models.Manager):
    """Custom manager for EducationalContent model"""

    def get_queryset(self):
        return EducationalContentQuerySet(self.model, using=self._db)

    def indexed(self):
        return self.get_queryset().indexed()

    def by_subject(self, subject):
        return self.get_queryset().by_subject(subject).optimized()

    def by_difficulty(self, difficulty):
        return self.get_queryset().by_difficulty(difficulty).optimized()

    def by_uploader(self, user_id):
        return self.get_queryset().by_uploader(user_id).optimized()

    def optimized(self):
        return self.get_queryset().optimized()

    def only_essential(self):
        return self.get_queryset().only_essential().with_uploader()
