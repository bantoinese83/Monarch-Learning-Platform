from django.urls import path

from . import views

urlpatterns = [
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.login_view, name='login'),
    path('refresh/', views.refresh_token_view, name='refresh'),
    path('profile/', views.ProfileView.as_view(), name='profile'),
    path('student-profile/', views.StudentProfileView.as_view(), name='student-profile'),
    path('knowledge-gaps/', views.KnowledgeGapListCreateView.as_view(), name='knowledge-gaps'),
    path('assessments/', views.AssessmentListCreateView.as_view(), name='assessments'),
    path('learning-paths/', views.LearningPathListCreateView.as_view(), name='learning-paths'),
    path('learning-paths/<int:pk>/', views.LearningPathDetailView.as_view(), name='learning-path-detail'),
]

