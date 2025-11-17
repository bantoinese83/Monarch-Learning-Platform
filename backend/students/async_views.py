"""
Async views example for 2025 Django best practices
These demonstrate how to use async views for I/O-bound operations
"""
import asyncio

from asgiref.sync import sync_to_async
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Assessment, KnowledgeGap


@api_view(['GET'])
@permission_classes([IsAuthenticated])
async def async_student_stats(request) -> Response:
    """
    Example async view for fetching student statistics.
    Demonstrates async ORM usage for concurrent database queries.
    """
    user_id = request.user.id

    # Run multiple database queries concurrently
    assessments_qs = Assessment.objects.by_student(user_id)
    gaps_qs = KnowledgeGap.objects.by_student(user_id)

    # Convert querysets to async
    get_assessments = sync_to_async(list)(assessments_qs)
    get_gaps = sync_to_async(list)(gaps_qs)

    # Execute queries concurrently
    assessments, gaps = await asyncio.gather(
        get_assessments,
        get_gaps
    )

    # Calculate statistics
    total_assessments = len(assessments)
    avg_score = sum(a.score for a in assessments) / total_assessments if total_assessments > 0 else 0
    unresolved_gaps = len([g for g in gaps if not g.resolved])

    return Response({
        'total_assessments': total_assessments,
        'average_score': round(avg_score, 2),
        'unresolved_knowledge_gaps': unresolved_gaps,
        'total_gaps': len(gaps),
    })


# Note: To use async views, you need:
# 1. Django 3.1+ with ASGI server (Daphne, Uvicorn)
# 2. Async-capable database adapter (asyncpg for PostgreSQL)
# 3. Update URL patterns to use async views
#
# Example URL pattern:
# path('api/auth/stats/', async_student_stats, name='async-stats'),

