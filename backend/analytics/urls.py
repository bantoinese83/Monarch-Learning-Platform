from django.urls import path

from . import views

urlpatterns = [
    path("progress/", views.StudentProgressView.as_view(), name="student-progress"),
    path(
        "content-effectiveness/",
        views.ContentEffectivenessView.as_view(),
        name="content-effectiveness",
    ),
    path("engagement/", views.EngagementMetricsView.as_view(), name="engagement-metrics"),
    path("generate-learning-path/", views.generate_learning_path, name="generate-learning-path"),
]
