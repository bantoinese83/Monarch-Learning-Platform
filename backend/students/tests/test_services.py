"""
Tests for assessment generation service
"""

import json
from types import SimpleNamespace
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings

from content.models import FileSearchStore
from students.models import StudentProfile
from students.services import AssessmentGenerator

User = get_user_model()


@override_settings(GEMINI_API_KEY="test-key", GEMINI_MODEL="gemini-test")
class AssessmentGeneratorTests(TestCase):
    """Tests for AssessmentGenerator service"""

    def setUp(self):
        """Set up test data"""
        # Create a test user
        self.user = User.objects.create_user(
            username="teststudent", email="test@example.com", password="testpass123"
        )

        # Create student profile
        self.profile = StudentProfile.objects.create(
            user=self.user, learning_style="visual", grade_level="10", preferred_language="en"
        )

        # Create a file search store for the user
        self.file_store = FileSearchStore.objects.create(
            name="test-store-123", display_name="Test Store", created_by=self.user
        )

        # Mock the Gemini client
        patcher = patch("content.services.genai.Client")
        self.addCleanup(patcher.stop)
        self.mock_client_class = patcher.start()
        self.mock_client = self.mock_client_class.return_value

    def test_generate_assessment_success(self):
        """Test successful assessment generation"""
        # Mock valid JSON response from Gemini
        questions_json = json.dumps(
            [
                {
                    "question": "What is 2 + 2?",
                    "options": ["3", "4", "5", "6"],
                    "correct_answer": "4",
                    "explanation": "Basic addition",
                },
                {
                    "question": "What is the capital of France?",
                    "options": ["London", "Berlin", "Paris", "Madrid"],
                    "correct_answer": "Paris",
                    "explanation": "Paris is the capital",
                },
            ]
        )

        # Mock Gemini response with text
        mock_response = SimpleNamespace(text=questions_json, candidates=[])
        self.mock_client.models.generate_content.return_value = mock_response

        # Generate assessment
        generator = AssessmentGenerator()
        assessment = generator.generate_assessment(
            student_id=self.user.id, subject="Mathematics", topic="Basic Math", num_questions=2
        )

        # Verify assessment structure
        self.assertIsNotNone(assessment)
        self.assertEqual(assessment["subject"], "Mathematics")
        self.assertEqual(assessment["topic"], "Basic Math")
        self.assertEqual(len(assessment["questions"]), 2)
        self.assertEqual(assessment["total_questions"], 2)

        # Verify question structure
        question1 = assessment["questions"][0]
        self.assertEqual(question1["question"], "What is 2 + 2?")
        self.assertEqual(len(question1["options"]), 4)
        self.assertEqual(question1["correct_answer"], "4")
        self.assertIn("explanation", question1)

    def test_generate_assessment_with_candidate_parts_fallback(self):
        """Test assessment generation when response.text is empty but candidate parts exist"""
        questions_json = json.dumps(
            [
                {
                    "question": "What is photosynthesis?",
                    "options": ["Process A", "Process B", "Process C", "Process D"],
                    "correct_answer": "Process A",
                    "explanation": "Photosynthesis explanation",
                }
            ]
        )

        # Mock Gemini response with empty text but candidate parts
        candidate_part = SimpleNamespace(text=questions_json)
        candidate = SimpleNamespace(content=SimpleNamespace(parts=[candidate_part]))
        mock_response = SimpleNamespace(
            text="",  # Empty text
            candidates=[candidate],
        )
        self.mock_client.models.generate_content.return_value = mock_response

        # Generate assessment
        generator = AssessmentGenerator()
        assessment = generator.generate_assessment(
            student_id=self.user.id, subject="Science", topic="Biology", num_questions=1
        )

        # Verify assessment was generated from candidate parts
        self.assertIsNotNone(assessment)
        self.assertEqual(len(assessment["questions"]), 1)
        self.assertEqual(assessment["questions"][0]["question"], "What is photosynthesis?")

    def test_generate_assessment_no_file_stores(self):
        """Test that assessment generation fails when no file stores exist"""
        # Delete the file store
        self.file_store.delete()

        generator = AssessmentGenerator()

        with self.assertRaises(Exception) as context:
            generator.generate_assessment(
                student_id=self.user.id, subject="Mathematics", num_questions=5
            )

        self.assertIn("No educational content available", str(context.exception))

    def test_generate_assessment_invalid_json_response(self):
        """Test that assessment generation fails when Gemini returns invalid JSON"""
        # Mock invalid JSON response
        mock_response = SimpleNamespace(text="This is not valid JSON", candidates=[])
        self.mock_client.models.generate_content.return_value = mock_response

        generator = AssessmentGenerator()

        with self.assertRaises(Exception) as context:
            generator.generate_assessment(
                student_id=self.user.id, subject="Mathematics", num_questions=5
            )

        self.assertIn("Failed to generate assessment questions", str(context.exception))

    def test_generate_assessment_empty_questions(self):
        """Test that assessment generation fails when no questions are generated"""
        # Mock empty JSON array
        mock_response = SimpleNamespace(text="[]", candidates=[])
        self.mock_client.models.generate_content.return_value = mock_response

        generator = AssessmentGenerator()

        with self.assertRaises(Exception) as context:
            generator.generate_assessment(
                student_id=self.user.id, subject="Mathematics", num_questions=5
            )

        self.assertIn("Failed to generate assessment questions", str(context.exception))

    def test_generate_assessment_uses_student_context(self):
        """Test that student context is passed to Gemini"""
        questions_json = json.dumps(
            [
                {
                    "question": "Test question?",
                    "options": ["A", "B", "C", "D"],
                    "correct_answer": "A",
                    "explanation": "Test",
                }
            ]
        )

        mock_response = SimpleNamespace(text=questions_json, candidates=[])
        self.mock_client.models.generate_content.return_value = mock_response

        generator = AssessmentGenerator()
        generator.generate_assessment(
            student_id=self.user.id, subject="Mathematics", num_questions=1
        )

        # Verify that generate_content was called
        self.mock_client.models.generate_content.assert_called_once()

        # Verify the call included student context in the prompt
        call_args = self.mock_client.models.generate_content.call_args
        # contents can be positional or keyword argument
        if call_args[0]:  # positional args
            prompt = call_args[0][1]  # contents is second positional arg
        else:  # keyword args
            prompt = call_args[1]["contents"]
        self.assertIn("visual", prompt)  # learning_style
        self.assertIn("10", prompt)  # grade_level

    def test_generate_assessment_with_metadata_filter(self):
        """Test that metadata filter is used for subject filtering"""
        questions_json = json.dumps(
            [
                {
                    "question": "Test question?",
                    "options": ["A", "B", "C", "D"],
                    "correct_answer": "A",
                    "explanation": "Test",
                }
            ]
        )

        mock_response = SimpleNamespace(text=questions_json, candidates=[])
        self.mock_client.models.generate_content.return_value = mock_response

        generator = AssessmentGenerator()
        generator.generate_assessment(student_id=self.user.id, subject="Science", num_questions=1)

        # Verify that generate_content was called with metadata filter
        call_args = self.mock_client.models.generate_content.call_args
        # config is a keyword argument
        config = call_args[1]["config"]
        file_search = config.tools[0].file_search
        self.assertEqual(file_search.metadata_filter, 'subject="Science"')
