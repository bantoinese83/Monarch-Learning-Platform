"""
Custom middleware for enhanced security and request handling
"""

import logging

from django.utils.deprecation import MiddlewareMixin

logger = logging.getLogger(__name__)


class SecurityHeadersMiddleware(MiddlewareMixin):
    """
    Add security headers to all responses
    Skip for OPTIONS requests to allow CORS preflight
    """

    def process_response(self, request, response):
        # Skip security headers for OPTIONS requests (CORS preflight)
        if request.method == "OPTIONS":
            return response

        # Content Security Policy
        response["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "font-src 'self' data:; "
            "connect-src 'self' https://generativelanguage.googleapis.com;"
        )

        # X-Content-Type-Options
        response["X-Content-Type-Options"] = "nosniff"

        # X-Frame-Options (already handled by Django, but being explicit)
        response["X-Frame-Options"] = "DENY"

        # Referrer Policy
        response["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # Permissions Policy
        response["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"

        return response


class RequestLoggingMiddleware(MiddlewareMixin):
    """
    Log API requests for monitoring and debugging
    Skip OPTIONS requests to reduce log noise
    """

    def process_request(self, request):
        # Skip logging for OPTIONS requests (CORS preflight)
        if request.method == "OPTIONS":
            return None

        if request.path.startswith("/api/"):
            logger.info(
                f"{request.method} {request.path} - "
                f"User: {getattr(request.user, 'username', 'Anonymous')}"
            )
        return None


class AsyncSupportMiddleware(MiddlewareMixin):
    """
    Middleware to support async views
    """

    async_capable = True
    sync_capable = True


class CORSPreflightMiddleware(MiddlewareMixin):
    """
    Handle CORS preflight OPTIONS requests before CommonMiddleware can redirect them.
    This prevents "Redirect is not allowed for a preflight request" errors.
    The CORS middleware (which runs before this) will add the proper headers.
    """

    def process_request(self, request):
        # Handle OPTIONS requests for CORS preflight - return early to prevent redirects
        # This runs AFTER CORS middleware, so CORS headers are already set
        if request.method == "OPTIONS" and request.path.startswith("/api/"):
            from django.conf import settings
            from django.http import HttpResponse

            # Create response with CORS headers
            response = HttpResponse()
            response.status_code = 200

            # Add CORS headers manually since we're bypassing normal flow
            if getattr(settings, "CORS_ALLOW_ALL_ORIGINS", False):
                origin = request.META.get("HTTP_ORIGIN", "*")
                response["Access-Control-Allow-Origin"] = origin
            else:
                origin = request.META.get("HTTP_ORIGIN", "")
                if origin in getattr(settings, "CORS_ALLOWED_ORIGINS", []):
                    response["Access-Control-Allow-Origin"] = origin

            if getattr(settings, "CORS_ALLOW_CREDENTIALS", False):
                response["Access-Control-Allow-Credentials"] = "true"

            response["Access-Control-Allow-Methods"] = ", ".join(
                getattr(
                    settings,
                    "CORS_ALLOW_METHODS",
                    ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
                )
            )
            response["Access-Control-Allow-Headers"] = ", ".join(
                getattr(settings, "CORS_ALLOW_HEADERS", ["content-type", "authorization"])
            )
            response["Access-Control-Max-Age"] = str(
                getattr(settings, "CORS_PREFLIGHT_MAX_AGE", 86400)
            )

            return response
        return None
