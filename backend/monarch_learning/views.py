from django.http import JsonResponse
from django.shortcuts import redirect


def root_view(request):
    """Root view that redirects to admin or returns API info"""
    if request.user.is_authenticated and request.user.is_staff:
        return redirect('/admin/')

    return JsonResponse({
        'message': 'Monarch Learning Platform API',
        'version': '1.0.0',
        'endpoints': {
            'admin': '/admin/',
            'api': {
                'auth': '/api/auth/',
                'content': '/api/content/',
                'tutoring': '/api/tutoring/',
                'analytics': '/api/analytics/',
            }
        },
        'frontend': 'http://localhost:3000',
        'documentation': 'See README.md for API documentation'
    })

