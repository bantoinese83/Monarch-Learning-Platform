from rest_framework import permissions, status, views
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from analytics.services import AnalyticsService, LearningPathService


class StudentProgressView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """Get student progress analytics"""
        service = AnalyticsService()
        progress = service.get_student_progress(request.user.id)
        return Response(progress)


class ContentEffectivenessView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """Get content effectiveness analytics"""
        service = AnalyticsService()
        content_id = request.query_params.get("content_id")
        effectiveness = service.get_content_effectiveness(
            content_id=int(content_id) if content_id else None
        )
        return Response(effectiveness)


class EngagementMetricsView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """Get student engagement metrics"""
        service = AnalyticsService()
        metrics = service.get_engagement_metrics(request.user.id)
        return Response(metrics)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def generate_learning_path(request):
    """Generate a personalized learning path"""
    subject = request.data.get("subject")
    target_topics = request.data.get("target_topics", [])

    if not subject:
        return Response({"error": "Subject is required"}, status=status.HTTP_400_BAD_REQUEST)

    service = LearningPathService()
    learning_path = service.generate_learning_path(
        student_id=request.user.id, subject=subject, target_topics=target_topics
    )

    from students.serializers import LearningPathSerializer

    return Response(LearningPathSerializer(learning_path).data)
