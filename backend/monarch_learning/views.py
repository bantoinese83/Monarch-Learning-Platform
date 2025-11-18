from django.http import JsonResponse
from django.shortcuts import redirect
from rest_framework import permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response


def root_view(request):
    """Root view that redirects to admin or returns API info"""
    if request.user.is_authenticated and request.user.is_staff:
        return redirect("/admin/")

    return JsonResponse(
        {
            "message": "Monarch Learning Platform API",
            "version": "1.0.0",
            "endpoints": {
                "admin": "/admin/",
                "api": {
                    "auth": "/api/auth/",
                    "content": "/api/content/",
                    "tutoring": "/api/tutoring/",
                    "analytics": "/api/analytics/",
                },
            },
            "frontend": "http://localhost:3000",
            "documentation": "See README.md for API documentation",
        }
    )


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def health_check(request):
    """Health check endpoint for monitoring service availability"""
    return Response(
        {
            "status": "healthy",
            "service": "monarch-learning-api",
            "version": "1.0.0",
            "timestamp": request.GET.get("timestamp", "unknown"),
        }
    )
