from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register(r"files", views.EducationalContentViewSet, basename="content")
router.register(r"stores", views.FileSearchStoreViewSet, basename="file-search-store")

urlpatterns = [
    path("", include(router.urls)),
]
