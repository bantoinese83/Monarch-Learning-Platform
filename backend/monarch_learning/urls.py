"""
URL configuration for monarch_learning project with 2025 enhancements
"""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

from . import views

urlpatterns = [
    path('', views.root_view, name='root'),
    path('admin/', admin.site.urls),
    path('api/auth/', include('students.urls')),
    path('api/content/', include('content.urls')),
    path('api/tutoring/', include('tutoring.urls')),
    path('api/analytics/', include('analytics.urls')),
]

# GraphQL endpoint (if enabled)
if 'graphene_django' in settings.INSTALLED_APPS:
    from graphene_django.views import GraphQLView
    urlpatterns += [
        path('graphql/', GraphQLView.as_view(graphiql=settings.DEBUG)),
    ]

# Debug toolbar URLs (development only)
if settings.DEBUG:
    try:
        import debug_toolbar
        urlpatterns += [
            path('__debug__/', include(debug_toolbar.urls)),
        ]
    except ImportError:
        pass

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
