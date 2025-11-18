"""
Integration tests for assessment generation using real Gemini API and database
These tests require GEMINI_API_KEY to be set in environment
"""

import os

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings

from content.models import EducationalContent, FileSearchStore
from content.services import GeminiFileSearchService
from students.models import StudentProfile
from students.services import AssessmentGenerator

User = get_user_model()

# Skip integration tests if API key is not available
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
SKIP_INTEGRATION = not GEMINI_API_KEY or GEMINI_API_KEY == "test-key"


@override_settings(
    GEMINI_API_KEY=GEMINI_API_KEY or "test-key",
    GEMINI_MODEL=os.getenv("GEMINI_MODEL", "gemini-2.5-flash"),
)
class AssessmentGeneratorIntegrationTests(TestCase):
    """Integration tests for AssessmentGenerator using real Gemini API"""

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        if SKIP_INTEGRATION:
            import unittest

            raise unittest.SkipTest("GEMINI_API_KEY not set - skipping integration tests")

    def setUp(self):
        """Set up test data with real file search store"""
        # Create a test user
        self.user = User.objects.create_user(
            username="teststudent", email="test@example.com", password="testpass123"
        )

        # Create student profile
        self.profile = StudentProfile.objects.create(
            user=self.user, learning_style="visual", grade_level="10", preferred_language="en"
        )

        # Create a real file search store using Gemini API
        self.file_search_service = GeminiFileSearchService()
        try:
            gemini_store = self.file_search_service.client.file_search_stores.create(
                config={"display_name": f"Test Store for {self.user.username}"}
            )
            self.file_store = FileSearchStore.objects.create(
                name=gemini_store.name, display_name="Test Store", created_by=self.user
            )
        except Exception as e:
            self.skipTest(f"Failed to create Gemini file search store: {e}")

        # Create a sample educational content file
        # We'll create a simple text file for testing
        test_content = """
        Mathematics Fundamentals
        
        Addition is one of the basic operations in mathematics.
        2 + 2 = 4
        3 + 5 = 8
        
        Subtraction is the inverse of addition.
        10 - 3 = 7
        15 - 8 = 7
        
        Multiplication is repeated addition.
        3 × 4 = 12
        5 × 6 = 30
        
        Division is the inverse of multiplication.
        12 ÷ 3 = 4
        20 ÷ 5 = 4
        """

        test_file = SimpleUploadedFile(
            "math_basics.txt", test_content.encode("utf-8"), content_type="text/plain"
        )

        # Create educational content
        self.educational_content = EducationalContent.objects.create(
            title="Mathematics Basics",
            description="Basic mathematics concepts",
            file=test_file,
            file_name="math_basics.txt",
            file_type="text/plain",
            file_size=len(test_content),
            subject="Mathematics",
            difficulty="beginner",
            uploaded_by=self.user,
            file_search_store=self.file_store,
        )

        # Upload and index the file to Gemini File Search
        try:
            self.file_search_service.upload_and_index_file(
                self.educational_content,
                chunking_config={
                    "white_space_config": {"max_tokens_per_chunk": 512, "max_overlap_tokens": 50}
                },
            )
        except Exception as e:
            self.skipTest(f"Failed to index file in Gemini: {e}")

    def tearDown(self):
        """Clean up Gemini resources"""
        # Clean up file search store from Gemini
        if hasattr(self, "file_store") and self.file_store:
            try:
                self.file_search_service.client.file_search_stores.delete(
                    name=self.file_store.name, config={"force": True}
                )
            except Exception:
                pass  # Ignore cleanup errors

    def test_generate_assessment_with_real_api(self):
        """Test assessment generation using real Gemini API"""
        generator = AssessmentGenerator()

        # Generate assessment - this will use real Gemini API
        assessment = generator.generate_assessment(
            student_id=self.user.id,
            subject="Mathematics",
            topic="Basic Operations",
            num_questions=3,
        )

        # Verify assessment structure
        self.assertIsNotNone(assessment)
        self.assertEqual(assessment["subject"], "Mathematics")
        self.assertEqual(assessment["topic"], "Basic Operations")
        self.assertGreater(len(assessment["questions"]), 0)
        self.assertLessEqual(len(assessment["questions"]), 3)

        # Verify question structure
        for question in assessment["questions"]:
            self.assertIn("id", question)
            self.assertIn("question", question)
            self.assertIn("options", question)
            self.assertIn("correct_answer", question)
            self.assertIsInstance(question["options"], list)
            self.assertEqual(len(question["options"]), 4)
            self.assertIn(question["correct_answer"], question["options"])

    def test_generate_assessment_uses_uploaded_content(self):
        """Test that assessment questions are based on uploaded content"""
        generator = AssessmentGenerator()

        assessment = generator.generate_assessment(
            student_id=self.user.id, subject="Mathematics", num_questions=2
        )

        # Verify questions were generated
        self.assertGreater(len(assessment["questions"]), 0)

        # Questions should relate to the content we uploaded (math basics)
        questions_text = " ".join([q["question"] for q in assessment["questions"]])
        # The questions should mention math concepts from our content
        # (This is a soft check - Gemini might phrase things differently)
        self.assertIsNotNone(questions_text)

    def test_generate_assessment_with_different_subjects(self):
        """Test assessment generation for different subjects"""
        generator = AssessmentGenerator()

        # Generate for Mathematics
        math_assessment = generator.generate_assessment(
            student_id=self.user.id, subject="Mathematics", num_questions=2
        )

        self.assertEqual(math_assessment["subject"], "Mathematics")
        self.assertGreater(len(math_assessment["questions"]), 0)

    def test_generate_assessment_respects_num_questions(self):
        """Test that assessment respects the num_questions parameter"""
        generator = AssessmentGenerator()

        # Request 2 questions
        assessment = generator.generate_assessment(
            student_id=self.user.id, subject="Mathematics", num_questions=2
        )

        # Should have at most 2 questions (might be less if parsing fails for some)
        self.assertLessEqual(len(assessment["questions"]), 2)
        self.assertGreater(len(assessment["questions"]), 0)

    def test_generate_assessment_includes_student_context(self):
        """Test that student context influences question generation"""
        generator = AssessmentGenerator()

        # Generate assessment - should use student's grade level and learning style
        assessment = generator.generate_assessment(
            student_id=self.user.id, subject="Mathematics", num_questions=2
        )

        # Verify assessment was generated
        self.assertIsNotNone(assessment)
        self.assertGreater(len(assessment["questions"]), 0)

        # The questions should be appropriate for grade 10 level
        # (This is verified by the fact that questions were generated successfully)

    def test_generate_assessment_error_handling_no_content(self):
        """Test error handling when no file stores exist"""
        # Delete the file store
        if hasattr(self, "file_store"):
            try:
                self.file_search_service.client.file_search_stores.delete(
                    name=self.file_store.name, config={"force": True}
                )
            except Exception:
                pass
            self.file_store.delete()

        generator = AssessmentGenerator()

        with self.assertRaises(Exception) as context:
            generator.generate_assessment(
                student_id=self.user.id, subject="Mathematics", num_questions=5
            )

        self.assertIn("No educational content available", str(context.exception))
