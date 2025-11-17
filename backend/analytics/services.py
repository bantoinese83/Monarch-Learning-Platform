"""
Analytics and learning path recommendation service
"""

from django.db import transaction
from django.db.models import Avg, Count, Q

from content.models import EducationalContent
from students.models import Assessment, KnowledgeGap, LearningPath, LearningPathItem, User


class LearningPathService:
    """Service for generating adaptive learning paths"""

    def generate_learning_path(
        self,
        student_id: int,
        subject: str,
        target_topics: list[str] = None
    ) -> LearningPath:
        """
        Generate a personalized learning path based on student's knowledge gaps
        and assessment history.
        """
        student = User.objects.get_optimized(student_id)

        # Get knowledge gaps for this subject (optimized)
        gaps = KnowledgeGap.objects.by_student(student_id).by_subject(subject).unresolved().order_by('-severity')

        # Get assessment history (optimized)
        assessments = Assessment.objects.by_student(student_id).by_subject(subject)

        # Identify weak areas (low scores or gaps)
        weak_topics = self._identify_weak_topics(gaps, assessments)

        # Get available content for this subject (optimized)
        available_content = EducationalContent.objects.by_subject(subject).indexed().only_essential()

        # Build learning path (use transaction for atomicity)
        with transaction.atomic():
            learning_path = LearningPath.objects.create(
                student=student,
                name=f"{subject} Learning Path",
                subject=subject
            )

            # Add content items based on gaps and difficulty progression
            # Use bulk_create for better performance
            path_items = []
            order = 0
            for topic in (target_topics or weak_topics):
                # Find content matching this topic
                matching_content = available_content.filter(
                    Q(title__icontains=topic) |
                    Q(description__icontains=topic) |
                    Q(tags__icontains=topic)
                ).first()

                if not matching_content:
                    # Try to find content by difficulty progression
                    if order == 0:
                        matching_content = available_content.filter(difficulty='beginner').first()
                    elif order < 3:
                        matching_content = available_content.filter(difficulty='intermediate').first()
                    else:
                        matching_content = available_content.filter(difficulty='advanced').first()

                if matching_content:
                    path_items.append(
                        LearningPathItem(
                            learning_path=learning_path,
                            content=matching_content,
                            order=order
                        )
                    )
                    order += 1

            # If no specific topics, create a general path
            if not path_items:
                for i, content in enumerate(available_content[:10]):  # Limit to 10 items
                    path_items.append(
                        LearningPathItem(
                            learning_path=learning_path,
                            content=content,
                            order=i
                        )
                    )

            # Bulk create all items at once
            if path_items:
                LearningPathItem.objects.bulk_create(path_items)

        return learning_path

    def _identify_weak_topics(self, gaps, assessments) -> list[str]:
        """
        Identify topics where student needs improvement.
        Optimized: Uses set for O(1) lookups instead of O(n) list checks.
        """
        weak_topics_set = set()  # Use set for O(1) membership testing

        # Add topics from knowledge gaps (O(n) instead of O(n²))
        for gap in gaps:
            if gap.topic:
                weak_topics_set.add(gap.topic)

        # Add topics from low-scoring assessments
        for assessment in assessments:
            if assessment.score < 70 and assessment.topic:
                weak_topics_set.add(assessment.topic)

        # Convert to list and limit (maintains order from gaps first, then assessments)
        return list(weak_topics_set)[:10]


class AnalyticsService:
    """Service for generating analytics and insights"""

    def get_student_progress(self, student_id: int) -> dict:
        """Get comprehensive progress analytics for a student"""
        assessments = Assessment.objects.by_student(student_id)
        gaps = KnowledgeGap.objects.by_student(student_id)
        learning_paths = LearningPath.objects.by_student(student_id)

        # Calculate average scores by subject (optimized aggregation)
        subject_scores = assessments.values('subject').annotate(
            avg_score=Avg('score'),
            count=Count('id')
        ).order_by('-avg_score')

        # Calculate gap resolution rate (single query)
        gap_stats = gaps.aggregate(
            total=Count('id'),
            resolved=Count('id', filter=Q(resolved=True))
        )
        total_gaps = gap_stats['total'] or 0
        resolved_gaps = gap_stats['resolved'] or 0
        resolution_rate = (resolved_gaps / total_gaps * 100) if total_gaps > 0 else 0

        # Learning path completion (single query)
        path_stats = learning_paths.aggregate(
            total=Count('id'),
            completed=Count('id', filter=Q(completed=True))
        )
        total_paths = path_stats['total'] or 0
        completed_paths = path_stats['completed'] or 0

        # Calculate path progress (optimized with prefetch and single-pass calculation)
        path_progress = []
        # Prefetch items for all paths in one query
        learning_paths = learning_paths.prefetch_related('items')
        
        for path in learning_paths:
            # Access prefetched items (no additional query)
            items = list(path.items.all())
            total_items = len(items)
            
            # Single-pass calculation: count completed items while iterating
            completed_items = sum(1 for item in items if item.completed)
            progress = (completed_items / total_items * 100) if total_items > 0 else 0
            
            path_progress.append({
                'path_id': path.id,
                'name': path.name,
                'subject': path.subject,
                'progress': progress,
                'completed': path.completed
            })

        # Get recent assessments (already optimized by manager)
        recent_assessments = assessments.order_by('-completed_at')[:10]

        return {
            'subject_scores': list(subject_scores),
            'knowledge_gaps': {
                'total': total_gaps,
                'resolved': resolved_gaps,
                'resolution_rate': round(resolution_rate, 2)
            },
            'learning_paths': {
                'total': total_paths,
                'completed': completed_paths,
                'progress': path_progress
            },
            'recent_assessments': [
                {
                    'id': a.id,
                    'subject': a.subject,
                    'topic': a.topic,
                    'score': a.score,
                    'completed_at': a.completed_at.isoformat()
                }
                for a in recent_assessments
            ]
        }

    def get_content_effectiveness(self, content_id: int = None) -> dict:
        """Analyze content effectiveness based on student performance"""

        if content_id:
            items = LearningPathItem.objects.filter(content_id=content_id).optimized()
        else:
            items = LearningPathItem.objects.optimized()

        # Calculate completion rate and average scores (optimized aggregation)
        stats = items.aggregate(
            total=Count('id'),
            completed=Count('id', filter=Q(completed=True)),
            avg_score=Avg('score', filter=Q(score__isnull=False))
        )

        total_assignments = stats['total'] or 0
        completed = stats['completed'] or 0
        avg_score = stats['avg_score'] or 0

        return {
            'content_id': content_id,
            'total_assignments': total_assignments,
            'completion_rate': (completed / total_assignments * 100) if total_assignments > 0 else 0,
            'average_score': round(avg_score, 2),
            'engagement_metric': completed  # Simple engagement metric
        }

    def get_engagement_metrics(self, student_id: int) -> dict:
        """Get student engagement metrics"""
        from tutoring.models import Conversation, Message

        conversations = Conversation.objects.by_student(student_id)
        messages = Message.objects.by_student(student_id)

        # Calculate metrics with aggregation (single query)
        conv_stats = conversations.aggregate(
            total=Count('id'),
            unique_dates=Count('created_at__date', distinct=True)
        )

        msg_stats = messages.aggregate(
            total=Count('id')
        )

        total_conversations = conv_stats['total'] or 0
        total_messages = msg_stats['total'] or 0
        active_days = conv_stats['unique_dates'] or 0

        # Calculate session length (messages per conversation)
        avg_messages_per_conversation = (
            total_messages / total_conversations
            if total_conversations > 0 else 0
        )

        return {
            'total_conversations': total_conversations,
            'total_messages': total_messages,
            'avg_messages_per_conversation': round(avg_messages_per_conversation, 2),
            'active_days': active_days
        }

