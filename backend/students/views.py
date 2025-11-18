from django.contrib.auth import authenticate
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Assessment, KnowledgeGap, LearningPath, StudentProfile, User
from .serializers import (
    AssessmentSerializer,
    KnowledgeGapSerializer,
    LearningPathSerializer,
    RegisterSerializer,
    StudentProfileSerializer,
    UserSerializer,
)
from .services import AssessmentGenerator


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.active()
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "user": UserSerializer(user).data,
                "refresh": str(refresh),
                "access": str(refresh.access_token),
            },
            status=status.HTTP_201_CREATED,
        )


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def login_view(request):
    username = request.data.get("username")
    password = request.data.get("password")

    if not username or not password:
        return Response(
            {"error": "Username and password required"}, status=status.HTTP_400_BAD_REQUEST
        )

    user = authenticate(username=username, password=password)
    if not user:
        return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

    refresh = RefreshToken.for_user(user)
    return Response(
        {
            "user": UserSerializer(user).data,
            "refresh": str(refresh),
            "access": str(refresh.access_token),
        }
    )


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def refresh_token_view(request):
    """JWT token refresh endpoint"""
    refresh_token = request.data.get("refresh")
    if not refresh_token:
        return Response({"error": "Refresh token required"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        refresh = RefreshToken(refresh_token)
        return Response(
            {
                "access": str(refresh.access_token),
            }
        )
    except Exception:
        return Response({"error": "Invalid refresh token"}, status=status.HTTP_401_UNAUTHORIZED)


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class StudentProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = StudentProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        profile, _ = StudentProfile.objects.get_or_create(user=self.request.user)
        return profile


class KnowledgeGapListCreateView(generics.ListCreateAPIView):
    serializer_class = KnowledgeGapSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return KnowledgeGap.objects.by_student(self.request.user.id)

    def perform_create(self, serializer):
        serializer.save(student=self.request.user)


class AssessmentListCreateView(generics.ListCreateAPIView):
    serializer_class = AssessmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Use custom manager with select_related
        return Assessment.objects.by_student(self.request.user.id)

    def perform_create(self, serializer):
        serializer.save(student=self.request.user)


class LearningPathListCreateView(generics.ListCreateAPIView):
    serializer_class = LearningPathSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return LearningPath.objects.by_student(self.request.user.id)

    def perform_create(self, serializer):
        serializer.save(student=self.request.user)


class LearningPathDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = LearningPathSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return LearningPath.objects.by_student(self.request.user.id)


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def generate_assessment(request):
    """
    Generate a personalized assessment for the authenticated student.
    Query parameters: subject, topic, num_questions
    """
    try:
        subject = request.GET.get("subject", "General")
        topic = request.GET.get("topic")
        num_questions = int(request.GET.get("num_questions", "5"))

        # Limit number of questions for performance
        num_questions = min(max(num_questions, 3), 10)

        generator = AssessmentGenerator()
        assessment = generator.generate_assessment(
            student_id=request.user.id, subject=subject, topic=topic, num_questions=num_questions
        )

        return Response(assessment)

    except ValueError:
        return Response({"error": "Invalid parameters"}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response(
            {"error": "Failed to generate assessment", "details": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
