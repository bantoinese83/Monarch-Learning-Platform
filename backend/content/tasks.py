"""
Celery tasks for async file processing
"""
import logging

from celery import shared_task

from .models import EducationalContent
from .services import GeminiFileSearchService

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def index_educational_content(self, content_id: int):
    """
    Async task to upload and index educational content to Gemini File Search.
    Retries up to 3 times on failure.
    Updates indexing_error field on failure.
    """
    content = None
    try:
        content = EducationalContent.objects.optimized().get(id=content_id)
        
        # Reset error state
        content.indexing_error = ''
        content.save(update_fields=['indexing_error'])

        # Default chunking config optimized for educational content
        # API requires max_tokens_per_chunk to be between 0 and 512
        chunking_config = {
            'white_space_config': {
                'max_tokens_per_chunk': 512,  # Maximum allowed by API
                'max_overlap_tokens': 50  # Reduced to stay within limits
            }
        }

        service = GeminiFileSearchService()
        service.upload_and_index_file(content, chunking_config=chunking_config)

        # Success - mark as indexed
        content.indexed = True
        content.indexing_error = ''
        content.save(update_fields=['indexed', 'indexing_error'])

        logger.info(f"Successfully indexed content {content_id}")
        return f"Successfully indexed content {content_id}"

    except EducationalContent.DoesNotExist:
        logger.error(f"Content {content_id} not found")
        return f"Content {content_id} not found"
    except Exception as exc:
        # Update error state
        error_message = str(exc)
        if content:
            content.indexing_error = error_message[:1000]  # Limit error message length
            content.indexed = False
            content.save(update_fields=['indexed', 'indexing_error'])
        
        logger.error(f"Failed to index content {content_id}: {error_message}", exc_info=True)
        
        # Retry with exponential backoff (only if retries remaining)
        if self.request.retries < self.max_retries:
            retry_countdown = 60 * (2 ** self.request.retries)
            logger.info(f"Retrying indexing for content {content_id} in {retry_countdown}s (attempt {self.request.retries + 1}/{self.max_retries})")
            raise self.retry(exc=exc, countdown=retry_countdown)
        else:
            # Max retries reached - mark as failed
            logger.error(f"Max retries reached for content {content_id}. Marking as failed.")
            if content:
                content.indexing_error = f"Indexing failed after {self.max_retries} retries: {error_message[:500]}"
                content.indexed = False
                content.save(update_fields=['indexed', 'indexing_error'])
            raise

