from types import SimpleNamespace
from unittest.mock import patch

from django.test import SimpleTestCase, override_settings

from content.services import GeminiFileSearchService


@override_settings(GEMINI_API_KEY="test-key", GEMINI_MODEL="gemini-test")
class GeminiFileSearchServiceTests(SimpleTestCase):
    """Unit tests for GeminiFileSearchService query handling."""

    def setUp(self):
        patcher = patch("content.services.genai.Client")
        self.addCleanup(patcher.stop)
        self.mock_client_class = patcher.start()
        self.mock_client = self.mock_client_class.return_value

    def test_query_uses_response_text_when_available(self):
        """Ensure raw response.text is returned when present."""
        mock_response = SimpleNamespace(text='[{"question": "Q1"}]', candidates=[])
        self.mock_client.models.generate_content.return_value = mock_response

        service = GeminiFileSearchService()
        result = service.query_with_file_search(
            query="prompt",
            file_search_store_names=["store-1"],
        )

        self.assertEqual(result["text"], '[{"question": "Q1"}]')
        self.mock_client.models.generate_content.assert_called_once()

    def test_query_falls_back_to_candidate_parts_text(self):
        """Ensure candidate parts populate text when response.text is empty."""
        candidate_part = SimpleNamespace(text='[{"question": "Q2"}]')
        candidate = SimpleNamespace(content=SimpleNamespace(parts=[candidate_part]))
        mock_response = SimpleNamespace(text="", candidates=[candidate])
        self.mock_client.models.generate_content.return_value = mock_response

        service = GeminiFileSearchService()
        result = service.query_with_file_search(
            query="prompt",
            file_search_store_names=["store-1"],
        )

        self.assertEqual(result["text"], '[{"question": "Q2"}]')
        self.mock_client.models.generate_content.assert_called_once()
