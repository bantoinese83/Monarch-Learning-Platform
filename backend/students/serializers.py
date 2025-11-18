from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import Assessment, KnowledgeGap, LearningPath, LearningPathItem, StudentProfile, User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "role", "first_name", "last_name", "date_of_birth"]
        read_only_fields = ["id"]


class StudentProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = StudentProfile
        fields = "__all__"


class KnowledgeGapSerializer(serializers.ModelSerializer):
    class Meta:
        model = KnowledgeGap
        fields = "__all__"
        read_only_fields = ["identified_at"]


class AssessmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Assessment
        fields = "__all__"
        read_only_fields = ["completed_at", "student"]  # student is set by perform_create in view


class LearningPathItemSerializer(serializers.ModelSerializer):
    content_title = serializers.CharField(source="content.title", read_only=True)

    class Meta:
        model = LearningPathItem
        fields = "__all__"


class LearningPathSerializer(serializers.ModelSerializer):
    items = LearningPathItemSerializer(many=True, read_only=True)

    class Meta:
        model = LearningPath
        fields = "__all__"
        read_only_fields = ["created_at", "updated_at"]


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)
    role = serializers.ChoiceField(choices=User.ROLE_CHOICES, default="student", required=False)

    class Meta:
        model = User
        fields = ["username", "email", "password", "password2", "first_name", "last_name", "role"]

    def validate(self, attrs):
        if attrs["password"] != attrs["password2"]:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop("password2")
        # Remove empty strings for optional fields
        if "first_name" in validated_data and not validated_data["first_name"]:
            validated_data.pop("first_name", None)
        if "last_name" in validated_data and not validated_data["last_name"]:
            validated_data.pop("last_name", None)
        user = User.objects.create_user(**validated_data)
        if user.role == "student":
            StudentProfile.objects.create(user=user)
        return user
