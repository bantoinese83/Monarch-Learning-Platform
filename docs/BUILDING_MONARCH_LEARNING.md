# Building an AI-Powered Learning Platform: A Complete Guide to Monarch Learning

*How I built a personalized educational platform with Gemini File Search, Django, and Next.js*

---

## Introduction

Imagine a learning platform that doesn't just deliver generic content, but truly understands what you've studied, generates personalized assessments from your own materials, and provides an AI tutor that can cite specific pages from your uploaded documents. That's exactly what I built with **Monarch Learning** — a full-stack educational platform that leverages Google's Gemini File Search API to create a truly personalized learning experience.

In this article, I'll walk you through the entire architecture, tech stack, and implementation details so you can build something similar. We'll cover everything from setting up the backend with Django to creating a modern React frontend with Next.js, and most importantly, how to integrate Gemini's powerful File Search API for RAG (Retrieval-Augmented Generation) capabilities.

---

## The Problem We're Solving

Traditional learning platforms have a fundamental limitation: they rely on pre-existing content libraries. But what if you want to learn from your own materials? What if you're a teacher who wants to create assessments from your custom curriculum? What if you need an AI tutor that can reference your specific textbooks and notes?

**Monarch Learning** solves this by:

1. **Content Ownership**: Users upload their own educational materials (PDFs, DOCX, TXT)
2. **Intelligent Indexing**: Files are automatically indexed using Gemini File Search for semantic search
3. **Personalized Assessments**: AI generates questions exclusively from uploaded content (no general knowledge)
4. **Context-Aware Tutoring**: The tutor bot can cite specific sources from your documents
5. **Progress Tracking**: Comprehensive analytics on learning performance

---

## Tech Stack Deep Dive

### Backend Stack

**Django 5.0 + Django REST Framework**
- Why Django? Mature ORM, excellent admin panel, built-in security features
- REST Framework for clean API design with serializers and viewsets
- Django Channels for WebSocket support (real-time tutor bot)

```python
# Example: Clean API endpoint with DRF
class AssessmentGeneratorView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        generator = AssessmentGenerator()
        assessment = generator.generate_assessment(
            student_id=request.user.id,
            subject=request.GET.get('subject'),
            topic=request.GET.get('topic'),
            num_questions=5
        )
        return Response(assessment)
```

**PostgreSQL (Neon)**
- Serverless PostgreSQL for scalability
- Complex queries with JSON fields for flexible metadata
- Full-text search capabilities

**Redis + Celery**
- Async task processing for file indexing
- Background jobs that don't block the API
- Rate limiting and caching

**Google Gemini API**
- `google-genai` SDK (v1.50.0+) for File Search
- `gemini-2.5-flash` model for fast, cost-effective responses
- File Search API for RAG capabilities

### Frontend Stack

**Next.js 14.1 (App Router)**
- Server-side rendering and static generation
- Built-in API routes and middleware
- Optimized performance out of the box

**TypeScript 5.0**
- Type safety across the entire frontend
- Better IDE support and fewer runtime errors
- Strict mode enabled for maximum safety

**React 18.2**
- Modern hooks (useState, useEffect, useCallback)
- Suspense boundaries for better UX
- Concurrent rendering capabilities

**State Management: Zustand**
- Lightweight alternative to Redux
- Simple API, no boilerplate
- Perfect for auth state and global UI state

**Styling: Tailwind CSS**
- Utility-first CSS framework
- Responsive design made easy
- Custom design system with consistent spacing

**Data Visualization: Nivo**
- Beautiful, responsive charts
- Bar charts, line charts, pie charts
- Built on D3.js with React bindings

---

## Architecture Overview

### System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐│
│  │Dashboard │  │ Content  │  │Assessment│  │  Tutor   ││
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘│
└────────────────────┬────────────────────────────────────┘
                     │ HTTP/REST API
                     │ WebSocket (Tutor Bot)
┌────────────────────▼────────────────────────────────────┐
│              Backend (Django REST API)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Students   │  │   Content    │  │  Analytics   │  │
│  │   Service    │  │   Service    │  │   Service    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└──────┬──────────┬──────────┬──────────┬──────────────┘
       │          │          │          │
   ┌───▼───┐  ┌──▼──┐   ┌───▼───┐  ┌───▼───┐
   │Postgres│  │Redis│   │ Celery│  │Gemini │
   │ (Neon) │  │     │   │Worker │  │  API  │
   └────────┘  └─────┘   └───────┘  └───────┘
```

### Data Flow

**Content Upload Flow:**
1. User uploads file → Django receives file
2. Metadata extraction using Gemini (async)
3. File uploaded to Gemini File Search store
4. Celery task indexes file in background
5. File becomes searchable via semantic search

**Assessment Generation Flow:**
1. User requests assessment → Frontend calls API
2. Backend fetches student's File Search stores
3. Builds prompt with student context and focus areas
4. Queries Gemini with File Search tool enabled
5. Parses JSON response into structured questions
6. Returns assessment to frontend

**Tutor Bot Flow:**
1. User sends message → WebSocket connection
2. Backend queries Gemini with File Search
3. AI response includes citations from uploaded files
4. Real-time streaming back to frontend
5. Citations displayed with source information

---

## Step-by-Step Implementation Guide

### Step 1: Backend Setup

#### 1.1 Initialize Django Project

```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install Django==5.0.1
pip install djangorestframework==3.14.0
pip install django-cors-headers==4.3.1
pip install channels==4.0.0
pip install channels-redis==4.2.0
pip install psycopg[binary]>=3.1.0
pip install redis==5.0.1
pip install celery==5.3.4
pip install google-genai>=1.50.0
pip install python-dotenv==1.0.0
pip install Pillow>=10.3.0
pip install djangorestframework-simplejwt==5.3.0

# Create project
django-admin startproject monarch_learning
cd monarch_learning
python manage.py startapp students
python manage.py startapp content
python manage.py startapp tutoring
python manage.py startapp analytics
```

#### 1.2 Configure Settings

```python
# settings.py
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

# Security
SECRET_KEY = os.getenv('SECRET_KEY')
DEBUG = os.getenv('DEBUG', 'False') == 'True'
ALLOWED_HOSTS = ['localhost', '127.0.0.1']

# Database (Neon PostgreSQL)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('DB_NAME'),
        'USER': os.getenv('DB_USER'),
        'PASSWORD': os.getenv('DB_PASSWORD'),
        'HOST': os.getenv('DB_HOST'),
        'PORT': os.getenv('DB_PORT', '5432'),
        'OPTIONS': {
            'sslmode': 'require',
        },
    }
}

# Gemini API
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
GEMINI_MODEL = os.getenv('GEMINI_MODEL', 'gemini-2.5-flash')

# Redis for Celery and Channels
REDIS_HOST = os.getenv('REDIS_HOST', 'localhost')
REDIS_PORT = int(os.getenv('REDIS_PORT', 6379))
CELERY_BROKER_URL = f'redis://{REDIS_HOST}:{REDIS_PORT}/0'
CELERY_RESULT_BACKEND = f'redis://{REDIS_HOST}:{REDIS_PORT}/0'

# Channels (WebSocket)
ASGI_APPLICATION = 'monarch_learning.asgi.application'
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            "hosts": [(REDIS_HOST, REDIS_PORT)],
        },
    },
}

# Installed Apps
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'channels',
    'students',
    'content',
    'tutoring',
    'analytics',
]

# REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}

# CORS
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
]
CORS_ALLOW_CREDENTIALS = True
```

### Step 2: Database Models

#### 2.1 Student Models

```python
# students/models.py
from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    ROLE_CHOICES = [
        ('student', 'Student'),
        ('tutor', 'Tutor'),
        ('admin', 'Administrator'),
    ]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='student')

class StudentProfile(models.Model):
    LEARNING_STYLE_CHOICES = [
        ('visual', 'Visual'),
        ('auditory', 'Auditory'),
        ('reading', 'Reading/Writing'),
        ('kinesthetic', 'Kinesthetic'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='student_profile')
    learning_style = models.CharField(max_length=20, choices=LEARNING_STYLE_CHOICES, default='visual')
    grade_level = models.CharField(max_length=50, blank=True)
    preferred_language = models.CharField(max_length=10, default='en')

class Assessment(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='assessments')
    subject = models.CharField(max_length=100, db_index=True)
    topic = models.CharField(max_length=200, db_index=True)
    score = models.FloatField(validators=[MinValueValidator(0), MaxValueValidator(100)])
    max_score = models.FloatField(default=100)
    completed_at = models.DateTimeField(auto_now_add=True, db_index=True)
    metadata = models.JSONField(default=dict)  # Store question-level details
```

#### 2.2 Content Models

```python
# content/models.py
class FileSearchStore(models.Model):
    """Represents a Gemini File Search store"""
    name = models.CharField(max_length=200, unique=True, db_index=True)
    display_name = models.CharField(max_length=200)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='file_stores')
    created_at = models.DateTimeField(auto_now_add=True)

class EducationalContent(models.Model):
    DIFFICULTY_CHOICES = [
        ('beginner', 'Beginner'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced'),
    ]
    
    title = models.CharField(max_length=500, db_index=True)
    description = models.TextField(blank=True)
    file = models.FileField(upload_to='educational_content/')
    file_name = models.CharField(max_length=500)
    file_type = models.CharField(max_length=100)
    file_size = models.BigIntegerField()
    
    # Metadata
    subject = models.CharField(max_length=100, db_index=True)
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES, db_index=True)
    author = models.CharField(max_length=200, blank=True)
    publication_year = models.IntegerField(null=True, blank=True)
    
    # Gemini File Search
    file_search_store = models.ForeignKey(FileSearchStore, on_delete=models.SET_NULL, null=True)
    indexed = models.BooleanField(default=False, db_index=True)
    indexing_error = models.TextField(blank=True)
    
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='uploaded_content')
    created_at = models.DateTimeField(auto_now_add=True)
```

### Step 3: Gemini File Search Integration

This is the heart of our RAG implementation. Here's how to integrate it:

#### 3.1 File Search Service

```python
# content/services.py
from google import genai
from google.genai import types
import time

class GeminiFileSearchService:
    """Service for managing Gemini File Search operations"""
    
    def __init__(self):
        if not settings.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY not configured")
        self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
        self.model = settings.GEMINI_MODEL
    
    def create_file_search_store(self, display_name: str, user_id: int) -> FileSearchStore:
        """Create a new File Search store"""
        try:
            # Create store in Gemini
            gemini_store = self.client.file_search_stores.create(
                config={'display_name': display_name}
            )
            
            # Store reference in our database
            store = FileSearchStore.objects.create(
                name=gemini_store.name,
                display_name=display_name,
                created_by_id=user_id
            )
            return store
        except Exception as e:
            raise Exception(f"Failed to create file search store: {str(e)}")
    
    def upload_and_index_file(self, content: EducationalContent, chunking_config: dict = None) -> str:
        """
        Upload file to Gemini File Search and wait for indexing.
        This is the key method that makes files searchable.
        """
        try:
            if not content.file_search_store:
                store = self._get_or_create_user_store(content.uploaded_by)
                content.file_search_store = store
                content.save()
            
            # Build config with metadata for filtering
            config = {
                'display_name': content.file_name,
                'custom_metadata': self._build_metadata(content)
            }
            
            if chunking_config:
                config['chunking_config'] = chunking_config
            
            # Upload to Gemini File Search
            operation = self.client.file_search_stores.upload_to_file_search_store(
                file=content.file.path,
                file_search_store_name=content.file_search_store.name,
                config=config
            )
            
            # Poll until indexing completes (Gemini recommendation: check every 5s)
            poll_interval = 5.0
            max_attempts = 120  # 10 minutes max
            attempts = 0
            
            while not operation.done and attempts < max_attempts:
                time.sleep(poll_interval)
                operation = self.client.operations.get(operation)
                attempts += 1
            
            if not operation.done:
                raise Exception(f"Indexing timed out after {max_attempts * poll_interval}s")
            
            content.indexed = True
            content.save()
            return ''
            
        except Exception as e:
            content.indexing_error = str(e)[:1000]
            content.indexed = False
            content.save()
            raise Exception(f"Failed to index file: {str(e)}")
    
    def query_with_file_search(
        self,
        query: str,
        file_search_store_names: list[str],
        metadata_filter: str = None,
        student_context: dict = None
    ) -> dict:
        """
        Query Gemini with File Search enabled.
        This is where the magic happens - Gemini searches your files and answers based on them.
        """
        try:
            # Build system instruction for personalization
            system_instruction = self._build_system_instruction(student_context)
            
            # Configure File Search tool
            tool_config = types.Tool(
                file_search=types.FileSearch(
                    file_search_store_names=file_search_store_names,
                    metadata_filter=metadata_filter  # Filter by subject, difficulty, etc.
                )
            )
            
            config = types.GenerateContentConfig(
                tools=[tool_config],
                system_instruction=system_instruction if system_instruction else None
            )
            
            # Query Gemini
            response = self.client.models.generate_content(
                model=self.model,
                contents=query,
                config=config
            )
            
            # Extract response text
            text_output = ''
            if hasattr(response, 'text') and response.text:
                text_output = response.text
            elif hasattr(response, 'candidates') and response.candidates:
                for candidate in response.candidates:
                    # Check for blocked responses
                    if hasattr(candidate, 'finish_reason'):
                        finish_reason = candidate.finish_reason
                        if finish_reason in ['RECITATION', 'SAFETY']:
                            raise Exception(
                                f"Gemini blocked response (finish_reason: {finish_reason}). "
                                "Try rephrasing your request."
                            )
                    
                    content = getattr(candidate, 'content', None)
                    if content and hasattr(content, 'parts'):
                        for part in content.parts:
                            part_text = getattr(part, 'text', None)
                            if part_text:
                                text_output += part_text + "\n"
            
            # Extract citations (grounding metadata)
            citations = []
            if hasattr(response, 'candidates') and response.candidates:
                candidate = response.candidates[0]
                if hasattr(candidate, 'grounding_metadata'):
                    grounding = candidate.grounding_metadata
                    if (hasattr(grounding, 'retrieval_metadata') and
                        grounding.retrieval_metadata and
                        hasattr(grounding.retrieval_metadata, 'retrieved_context')):
                        for chunk in grounding.retrieval_metadata.retrieved_context:
                            if hasattr(chunk, 'file') and chunk.file:
                                citations.append({
                                    'file': chunk.file.uri if hasattr(chunk.file, 'uri') else '',
                                    'display_name': getattr(chunk.file, 'display_name', ''),
                                })
            
            return {
                'text': text_output.strip(),
                'citations': citations,
            }
            
        except Exception as e:
            raise Exception(f"Query failed: {str(e)}")
    
    def _build_metadata(self, content: EducationalContent) -> list[dict]:
        """Build custom metadata for filtering"""
        metadata = []
        
        if content.subject:
            metadata.append({
                'key': 'subject',
                'string_value': content.subject
            })
        
        if content.difficulty:
            metadata.append({
                'key': 'difficulty',
                'string_value': content.difficulty
            })
        
        return metadata
```

#### 3.2 Async File Indexing with Celery

```python
# content/tasks.py
from celery import shared_task
from .models import EducationalContent
from .services import GeminiFileSearchService

@shared_task(bind=True, max_retries=3)
def index_educational_content(self, content_id: int):
    """
    Async task to index content in Gemini File Search.
    This runs in the background so users don't wait.
    """
    content = None
    try:
        content = EducationalContent.objects.get(id=content_id)
        
        # Optimized chunking for educational content
        chunking_config = {
            'white_space_config': {
                'max_tokens_per_chunk': 512,  # Gemini's max
                'max_overlap_tokens': 50,
            }
        }
        
        service = GeminiFileSearchService()
        service.upload_and_index_file(content, chunking_config=chunking_config)
        
        content.indexed = True
        content.indexing_error = ''
        content.save(update_fields=['indexed', 'indexing_error'])
        
        return f"Successfully indexed content {content_id}"
        
    except EducationalContent.DoesNotExist:
        return f"Content {content_id} not found"
    except Exception as exc:
        error_message = str(exc)
        if content:
            content.indexing_error = error_message[:1000]
            content.indexed = False
            content.save(update_fields=['indexed', 'indexing_error'])
        
        # Retry with exponential backoff
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))
```

### Step 4: Assessment Generation

This is where we generate personalized assessments from uploaded content:

#### 4.1 Assessment Generator Service

```python
# students/services.py
import json
import re
from content.services import GeminiFileSearchService

class AssessmentGenerator:
    """Generate personalized assessments using Gemini File Search"""
    
    def __init__(self):
        self.file_search_service = GeminiFileSearchService()
    
    def generate_assessment(
        self,
        student_id: int,
        subject: str,
        topic: str = None,
        num_questions: int = 5
    ) -> dict:
        """Generate assessment from uploaded content only"""
        # Get student context for personalization
        student_context = self._get_student_context(student_id)
        
        # Get student's file search stores
        file_stores = FileSearchStore.objects.by_user(student_id)
        if not file_stores:
            raise Exception("No educational content available. Please upload content first.")
        
        # Block "General" assessments - require specific subject
        if subject == 'General':
            indexed_content = EducationalContent.objects.filter(
                uploaded_by_id=student_id,
                indexed=True
            ).values_list('subject', flat=True).distinct()
            
            if not indexed_content:
                raise Exception("No indexed content available.")
            
            available_subjects = list(indexed_content)
            raise Exception(
                f"Cannot generate 'General' assessments. "
                f"Available subjects: {', '.join(available_subjects)}"
            )
        
        # Determine focus areas (knowledge gaps, recent low scores, etc.)
        focus_areas = self._determine_focus_areas(student_id, subject, topic)
        
        # Generate questions using AI
        questions = self._generate_questions_with_ai(
            student_context,
            subject,
            topic,
            focus_areas,
            num_questions,
            [store.name for store in file_stores]
        )
        
        if not questions:
            raise Exception("Failed to generate assessment questions.")
        
        return {
            'id': f'assessment-{student_id}-{subject.lower().replace(" ", "-")}',
            'subject': subject,
            'topic': topic or 'Mixed Topics',
            'questions': questions,
            'total_questions': len(questions)
        }
    
    def _generate_questions_with_ai(
        self,
        student_context: dict,
        subject: str,
        topic: str | None,
        focus_areas: list[str],
        num_questions: int,
        file_search_store_names: list[str]
    ) -> list[dict]:
        """Generate questions using Gemini with File Search"""
        # Build comprehensive prompt
        prompt = self._build_question_generation_prompt(
            student_context, subject, topic, focus_areas, num_questions
        )
        
        # Filter by subject metadata
        metadata_filter = f'subject="{subject}"' if subject and subject != 'General' else None
        
        try:
            result = self.file_search_service.query_with_file_search(
                query=prompt,
                file_search_store_names=file_search_store_names,
                metadata_filter=metadata_filter,
                student_context=student_context
            )
            
            questions_text = result.get('text', '')
            if not questions_text.strip():
                return []
            
            # Parse JSON response
            questions = self._parse_ai_questions_response(questions_text, num_questions)
            return questions
            
        except Exception as e:
            logger.error(f"Error generating questions: {e}", exc_info=True)
            return []
    
    def _build_question_generation_prompt(
        self,
        student_context: dict,
        subject: str,
        topic: str | None,
        focus_areas: list[str],
        num_questions: int
    ) -> str:
        """Build prompt following Gemini best practices"""
        
        # Context section
        context_parts = []
        if student_context.get('grade_level'):
            context_parts.append(f"Grade level: {student_context['grade_level']}")
        if student_context.get('learning_style'):
            context_parts.append(f"Learning style: {student_context['learning_style']}")
        
        context_str = "\n".join(f"- {part}" for part in context_parts) if context_parts else "- Not specified"
        
        # Few-shot examples
        examples = """Example 1:
Input: Educational content about software development methodologies
Output:
[
  {
    "question": "According to the content, which methodology emphasizes iterative development?",
    "options": ["Waterfall", "Agile", "V-Model", "Big Bang"],
    "correct_answer": "Agile",
    "explanation": "The content states that Agile methodology focuses on iterative development cycles."
  }
]"""
        
        prompt_parts = [
            "Task: Generate assessment questions from uploaded educational content files.",
            "",
            "Context:",
            context_str,
            "",
            f"Subject: {subject}",
            f"Topic: {topic or 'Mixed Topics'}",
            "",
            "Focus Areas (from uploaded content only):",
            "\n".join(f"- {area}" for area in focus_areas) if focus_areas else "- Content from uploaded files",
            "",
            "Instructions:",
            "1. Use ONLY information from the uploaded educational content files",
            "2. Base ALL questions exclusively on facts found in the uploaded content",
            "3. DO NOT use general knowledge or information outside the provided content",
            "4. If content lacks sufficient information, return an error JSON object",
            "",
            "Constraints:",
            f"- Generate exactly {num_questions} multiple-choice questions",
            "- Each question must have exactly 4 answer options",
            "- One option must be clearly correct based on the content",
            "- Include a brief explanation citing the content",
            "",
            "Response Format:",
            "Return ONLY a valid JSON array. No explanatory text before or after.",
            "",
            "Examples:",
            examples,
            "",
            "Now generate questions based on the uploaded content:",
            "",
            "Output:"
        ]
        
        return "\n".join(prompt_parts)
    
    def _parse_ai_questions_response(self, response_text: str, expected_count: int) -> list[dict]:
        """Parse JSON response from Gemini"""
        if not response_text or not response_text.strip():
            return []
        
        # Check for error indicators
        response_lower = response_text.lower()
        no_content_indicators = [
            "unable to generate",
            "no educational content",
            "no content found"
        ]
        
        if any(indicator in response_lower for indicator in no_content_indicators):
            raise Exception("No relevant content found for this subject/topic.")
        
        # Extract JSON array using regex
        json_match = re.search(r'\[(?:[^\[\]]+|\[[^\]]*\])*\]', response_text, re.DOTALL)
        if json_match:
            try:
                questions_data = json.loads(json_match.group())
            except json.JSONDecodeError:
                # Try simpler approach
                start_idx = response_text.find('[')
                end_idx = response_text.rfind(']')
                if start_idx != -1 and end_idx != -1:
                    questions_data = json.loads(response_text[start_idx:end_idx+1])
                else:
                    return []
        else:
            return []
        
        # Validate and format questions
        validated_questions = []
        for i, q_data in enumerate(questions_data):
            if i >= expected_count:
                break
            
            if not isinstance(q_data, dict):
                continue
            
            if not all(key in q_data for key in ['question', 'options', 'correct_answer']):
                continue
            
            options = q_data['options']
            if isinstance(options, str):
                try:
                    options = json.loads(options)
                except:
                    options = [opt.strip() for opt in options.split(',')]
            
            if not isinstance(options, list) or len(options) != 4:
                continue
            
            validated_questions.append({
                'id': f'q{i+1}',
                'question': str(q_data['question']).strip(),
                'options': [str(opt).strip() for opt in options],
                'correct_answer': str(q_data['correct_answer']).strip(),
                'explanation': str(q_data.get('explanation', 'This is the correct answer.')).strip()
            })
        
        return validated_questions
```

### Step 5: Frontend Implementation

#### 5.1 Next.js Setup

```bash
# Create Next.js app
npx create-next-app@14.1.0 frontend --typescript --tailwind --app
cd frontend

# Install dependencies
npm install axios zustand react-hook-form zod
npm install @nivo/bar @nivo/line @nivo/pie @nivo/core
npm install mammoth react-confetti react-markdown remark-gfm
npm install @hookform/resolvers

# Dev dependencies
npm install -D prettier prettier-plugin-tailwindcss
```

#### 5.2 API Client Setup

```typescript
// frontend/lib/api.ts
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 180000, // 3 minutes for AI operations
})

// Add JWT token to requests
api.interceptors.request.use(config => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

// Handle token refresh on 401
api.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      const refreshToken = localStorage.getItem('refresh_token')
      
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_URL}/api/auth/refresh/`, {
            refresh: refreshToken,
          })
          const { access } = response.data
          localStorage.setItem('access_token', access)
          
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${access}`
            return api.request(originalRequest)
          }
        } catch {
          // Refresh failed - logout
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          window.location.href = '/login'
        }
      }
    }

    // Enhanced error handling
    if (error.response) {
      const data = error.response.data as any
      const message = data?.details || data?.error || data?.message || 'An error occurred'
      const enhancedError = new Error(message)
      ;(enhancedError as any).status = error.response.status
      return Promise.reject(enhancedError)
    } else if (error.request) {
      return Promise.reject(new Error('Network error. Please check your connection.'))
    }
    
    return Promise.reject(error)
  }
)

export default api
```

#### 5.3 State Management with Zustand

```typescript
// frontend/store/authStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isInitialized: boolean
  user: any | null
  login: (access: string, refresh: string, user: any) => void
  logout: () => void
  init: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isInitialized: false,
      user: null,
      
      login: (access, refresh, user) => {
        localStorage.setItem('access_token', access)
        localStorage.setItem('refresh_token', refresh)
        set({
          accessToken: access,
          refreshToken: refresh,
          isAuthenticated: true,
          user,
        })
      },
      
      logout: () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        set({
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          user: null,
        })
      },
      
      init: () => {
        const access = localStorage.getItem('access_token')
        const refresh = localStorage.getItem('refresh_token')
        set({
          accessToken: access,
          refreshToken: refresh,
          isAuthenticated: !!access,
          isInitialized: true,
        })
      },
    }),
    {
      name: 'auth-storage',
    }
  )
)
```

#### 5.4 Assessment Page with Auto-Subject Selection

```typescript
// frontend/app/assessment/page.tsx
'use client'

import { Suspense, useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import api from '@/lib/api'
import Layout from '@/components/Layout'
import CircleAnimation from '@/components/CircleAnimation'
import EmptyState from '@/components/EmptyState'

interface Question {
  id: string
  question: string
  options: string[]
  correct_answer: string
  explanation?: string
}

interface Assessment {
  id: string
  subject: string
  topic: string
  questions: Question[]
}

function AssessmentPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([])
  const [subject, setSubject] = useState<string | null>(null)
  const topic = searchParams.get('topic') || 'Mixed Topics'

  const [assessment, setAssessment] = useState<Assessment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const isLoadingRef = useRef(false)

  // Fetch available subjects and auto-select
  useEffect(() => {
    const fetchAvailableSubjects = async () => {
      try {
        const response = await api.get('/content/files/')
        const contents = response.data.results || response.data
        
        // Extract unique subjects from indexed content
        const subjects = Array.from(new Set(
          contents
            .filter((c: any) => c.indexed && c.subject)
            .map((c: any) => c.subject as string)
        )) as string[]
        
        setAvailableSubjects(subjects)
        
        // Get subject from URL
        const urlSubject = searchParams.get('subject')
        
        // Determine which subject to use
        if (urlSubject && urlSubject !== 'General') {
          setSubject(urlSubject)
        } else if (subjects.length > 0) {
          // Auto-select first available subject
          setSubject(subjects[0])
          // Update URL
          if (!urlSubject || urlSubject === 'General') {
            router.replace(`/assessment?subject=${encodeURIComponent(subjects[0])}&topic=${encodeURIComponent(topic)}`)
          }
        } else {
          setSubject(null)
        }
      } catch (error) {
        console.error('Failed to fetch subjects:', error)
        setSubject(null)
      }
    }
    
    fetchAvailableSubjects()
  }, [searchParams, topic, router])

  const loadAssessment = useCallback(async () => {
    if (!subject || isLoadingRef.current) return

    isLoadingRef.current = true
    try {
      setLoading(true)
      setError(null)

      const response = await api.get('/auth/generate-assessment/', {
        params: {
          subject,
          topic,
          num_questions: 5
        },
        timeout: 300000 // 5 minutes
      })

      if (!response.data?.questions || !Array.isArray(response.data.questions)) {
        throw new Error('Invalid assessment response format')
      }

      const assessmentData: Assessment = {
        id: response.data.id,
        subject: response.data.subject,
        topic: response.data.topic,
        questions: response.data.questions.map((q: any, index: number) => ({
          id: q.id || `q${index + 1}`,
          question: q.question,
          options: q.options,
          correct_answer: q.correct_answer,
          explanation: q.explanation
        }))
      }

      setAssessment(assessmentData)
      setLoading(false)
    } catch (error: any) {
      const errorMessage = error.response?.data?.details ||
                          error.response?.data?.error ||
                          error.message ||
                          'Failed to generate assessment.'
      setError(errorMessage)
      setAssessment(null)
      setLoading(false)
    } finally {
      isLoadingRef.current = false
    }
  }, [subject, topic])

  // Load assessment when subject is determined
  useEffect(() => {
    if (subject && !isLoadingRef.current) {
      loadAssessment()
    }
  }, [subject, loadAssessment])

  // Show empty state if no subject available
  if (!subject && !loading) {
    return (
      <Layout>
        <EmptyState
          title="No Content Available"
          description="Upload and index educational content first to generate assessments."
          action={{
            label: 'Upload Content',
            href: '/content'
          }}
        />
      </Layout>
    )
  }

  // Loading state
  if (loading) {
    return (
      <Layout>
        <div className="flex min-h-[60vh] flex-col items-center justify-center">
          <CircleAnimation
            type="interconnecting-waves"
            size="lg"
            text="Generating personalized assessment..."
            title="AI Processing"
            color="#0ea5e9"
          />
        </div>
      </Layout>
    )
  }

  // Error state
  if (!assessment && error) {
    return (
      <Layout>
        <EmptyState
          title="Assessment Generation Failed"
          description={error}
          action={{
            label: 'Try Again',
            href: '#',
            onClick: () => loadAssessment()
          }}
        />
      </Layout>
    )
  }

  // Render assessment questions...
  // (Full implementation in actual codebase)
}

export default function AssessmentPage() {
  return (
    <Suspense fallback={
      <Layout>
        <div className="flex min-h-[60vh] flex-col items-center justify-center">
          <CircleAnimation
            type="interconnecting-waves"
            size="lg"
            text="Loading..."
            title="Loading Assessment"
            color="#0ea5e9"
          />
        </div>
      </Layout>
    }>
      <AssessmentPageContent />
    </Suspense>
  )
}
```

#### 5.5 WebSocket Tutor Bot

```typescript
// frontend/app/tutor/page.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { useAuthStore } from '@/store/authStore'

export default function TutorPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [connected, setConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const { accessToken } = useAuthStore()

  useEffect(() => {
    // Connect to WebSocket
    const ws = new WebSocket(`ws://localhost:8000/ws/tutor/`)
    
    ws.onopen = () => {
      setConnected(true)
      // Send auth token
      ws.send(JSON.stringify({
        type: 'auth',
        token: accessToken
      }))
    }
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      
      if (data.type === 'message') {
        setMessages(prev => [...prev, {
          id: data.id,
          text: data.text,
          sender: 'bot',
          timestamp: new Date(),
          citations: data.citations || []
        }])
      }
    }
    
    ws.onerror = () => setConnected(false)
    ws.onclose = () => setConnected(false)
    
    wsRef.current = ws
    
    return () => {
      ws.close()
    }
  }, [accessToken])

  const sendMessage = () => {
    if (!input.trim() || !wsRef.current) return

    const userMessage = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    
    wsRef.current.send(JSON.stringify({
      type: 'message',
      text: input
    }))
    
    setInput('')
  }

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-200px)]">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          {messages.map(msg => (
            <div key={msg.id} className={`mb-4 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
              <div className={`inline-block p-4 rounded-lg ${
                msg.sender === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-900'
              }`}>
                <p>{msg.text}</p>
                {msg.citations && msg.citations.length > 0 && (
                  <div className="mt-2 text-xs opacity-75">
                    Sources: {msg.citations.map((c: any) => c.display_name).join(', ')}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* Input */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Ask a question..."
              className="flex-1 px-4 py-2 border rounded-lg"
            />
            <button
              onClick={sendMessage}
              disabled={!connected}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}
```

### Step 6: WebSocket Implementation (Tutor Bot)

#### 6.1 Django Channels Consumer

```python
# tutoring/consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from .services import TutorBotService

User = get_user_model()

class TutorConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.conversation_id = self.scope['url_route']['kwargs']['conversation_id']
        self.user = None
        await self.accept()
    
    async def receive(self, text_data):
        data = json.loads(text_data)
        
        if data.get('type') == 'auth':
            # Authenticate user
            token = data.get('token')
            self.user = await self.authenticate_user(token)
            if not self.user:
                await self.close()
                return
        
        elif data.get('type') == 'message':
            if not self.user:
                await self.send(json.dumps({
                    'type': 'error',
                    'message': 'Not authenticated'
                }))
                return
            
            # Get user message
            user_message = data.get('text', '')
            
            # Query tutor bot with File Search
            service = TutorBotService()
            response = await database_sync_to_async(service.get_response)(
                user_id=self.user.id,
                message=user_message,
                conversation_id=self.conversation_id
            )
            
            # Send response with citations
            await self.send(json.dumps({
                'type': 'message',
                'id': response['id'],
                'text': response['text'],
                'citations': response.get('citations', [])
            }))
    
    @database_sync_to_async
    def authenticate_user(self, token):
        from rest_framework_simplejwt.tokens import AccessToken
        try:
            access_token = AccessToken(token)
            user_id = access_token['user_id']
            return User.objects.get(id=user_id)
        except:
            return None
```

---

## Key Implementation Details

### 1. Prompt Engineering for Assessments

The secret to getting good assessment questions is in the prompt design. Here's what works:

**✅ DO:**
- Use few-shot examples showing exact format
- Be explicit: "Use ONLY information from uploaded content"
- Structure prompts with clear sections (Task, Context, Instructions, Constraints)
- Request JSON format explicitly
- Include validation rules in the prompt

**❌ DON'T:**
- Rely on general knowledge
- Use vague instructions
- Skip examples
- Assume the model knows your data structure

### 2. Error Handling Strategy

```python
# Always check for these Gemini finish reasons
if candidate.finish_reason in ['RECITATION', 'SAFETY']:
    # Response was blocked - handle gracefully
    raise Exception("Content blocked by safety filters")

# Check for empty responses
if not response_text.strip():
    # Retry without metadata filter
    result = self.file_search_service.query_with_file_search(
        query=prompt,
        file_search_store_names=file_search_store_names,
        metadata_filter=None,  # Broaden search
        student_context=student_context
    )
```

### 3. Metadata Filtering

Use metadata to narrow search results:

```python
# Filter by subject
metadata_filter = f'subject="{subject}"'

# Filter by multiple criteria (if Gemini supports it)
# metadata_filter = f'subject="{subject}" AND difficulty="intermediate"'
```

### 4. Async Processing Pattern

Never block the API for long-running operations:

```python
# In your view
@action(detail=True, methods=['post'])
def upload(self, request, pk=None):
    content = self.get_object()
    
    # Trigger async task
    index_educational_content.delay(content.id)
    
    return Response({
        'status': 'uploaded',
        'indexing': 'in_progress'
    })
```

---

## Challenges and Solutions

### Challenge 1: Gemini Response Parsing

**Problem**: Gemini sometimes returns JSON wrapped in markdown or with extra text.

**Solution**: Use multiple parsing strategies:

```python
def _parse_ai_questions_response(self, response_text: str, expected_count: int) -> list[dict]:
    # Strategy 1: Regex to find JSON array
    json_match = re.search(r'\[(?:[^\[\]]+|\[[^\]]*\])*\]', response_text, re.DOTALL)
    if json_match:
        try:
            return json.loads(json_match.group())
        except:
            pass
    
    # Strategy 2: Find first [ and last ]
    start_idx = response_text.find('[')
    end_idx = response_text.rfind(']')
    if start_idx != -1 and end_idx != -1:
        try:
            return json.loads(response_text[start_idx:end_idx+1])
        except:
            pass
    
    # Strategy 3: Look for code blocks
    code_block_match = re.search(r'```(?:json)?\s*(\[.*?\])\s*```', response_text, re.DOTALL)
    if code_block_match:
        try:
            return json.loads(code_block_match.group(1))
        except:
            pass
    
    return []
```

### Challenge 2: Race Conditions in React

**Problem**: React StrictMode causes double renders, triggering multiple API calls.

**Solution**: Use refs to track loading state:

```typescript
const isLoadingRef = useRef(false)

const loadAssessment = useCallback(async () => {
  if (isLoadingRef.current) return
  
  isLoadingRef.current = true
  try {
    // ... API call
  } finally {
    isLoadingRef.current = false
  }
}, [dependencies])
```

### Challenge 3: File Search Store Management

**Problem**: Each user needs their own store, but creating too many is inefficient.

**Solution**: One store per user, reuse existing:

```python
def _get_or_create_user_store(self, user) -> FileSearchStore:
    """Get or create a default file search store for user"""
    from django.db import transaction
    
    with transaction.atomic():
        store, created = FileSearchStore.objects.get_or_create(
            created_by=user,
            defaults={
                'name': f'store-{user.id}',
                'display_name': f'{user.username}\'s Content Store'
            }
        )
        
        if created:
            # Create in Gemini
            gemini_store = self.client.file_search_stores.create(
                config={'display_name': store.display_name}
            )
            store.name = gemini_store.name
            store.save()
    
    return store
```

---

## Performance Optimizations

### 1. Database Query Optimization

```python
# Use select_related and prefetch_related
class EducationalContentManager(models.Manager):
    def optimized(self):
        return self.select_related('uploaded_by', 'file_search_store').prefetch_related('custom_metadata')

# Custom queryset methods
class AssessmentQuerySet(models.QuerySet):
    def by_student(self, student_id):
        return self.filter(student_id=student_id)
    
    def by_subject(self, subject):
        return self.filter(subject=subject)
    
    def recent(self, limit=10):
        return self.order_by('-completed_at')[:limit]
```

### 2. Frontend Code Splitting

```typescript
// Lazy load heavy components
const SubjectPerformanceBar = dynamic(
  () => import('@/components/charts/SubjectPerformanceBar'),
  { ssr: false }
)
```

### 3. Caching Strategy

```python
# Cache expensive queries
from django.core.cache import cache

def get_student_progress(student_id):
    cache_key = f'student_progress_{student_id}'
    progress = cache.get(cache_key)
    
    if not progress:
        progress = calculate_progress(student_id)
        cache.set(cache_key, progress, 300)  # 5 minutes
    
    return progress
```

---

## Testing Your Implementation

### Backend Tests

```python
# students/tests/test_services.py
from django.test import TestCase
from students.services import AssessmentGenerator
from students.models import User, StudentProfile

class AssessmentGeneratorTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        StudentProfile.objects.create(user=self.user)
    
    def test_generate_assessment_with_content(self):
        # Upload and index content first
        # ... (setup content)
        
        generator = AssessmentGenerator()
        assessment = generator.generate_assessment(
            student_id=self.user.id,
            subject='Mathematics',
            num_questions=5
        )
        
        self.assertEqual(len(assessment['questions']), 5)
        self.assertEqual(assessment['subject'], 'Mathematics')
        for question in assessment['questions']:
            self.assertEqual(len(question['options']), 4)
            self.assertIn(question['correct_answer'], question['options'])
```

### Frontend Tests

```typescript
// __tests__/assessment.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import AssessmentPage from '@/app/assessment/page'

describe('AssessmentPage', () => {
  it('auto-selects first available subject', async () => {
    // Mock API responses
    // ... (setup mocks)
    
    render(<AssessmentPage />)
    
    await waitFor(() => {
      expect(screen.getByText(/Software Development/i)).toBeInTheDocument()
    })
  })
})
```

---

## Deployment Considerations

### Environment Variables

**Backend (.env):**
```bash
SECRET_KEY=your-secret-key-here
DEBUG=False
ALLOWED_HOSTS=yourdomain.com
DB_NAME=your_db_name
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_HOST=your-neon-host.neon.tech
GEMINI_API_KEY=your-gemini-key
REDIS_HOST=your-redis-host
REDIS_PORT=6379
```

**Frontend (.env.local):**
```bash
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

### Production Checklist

- [ ] Set `DEBUG=False` in production
- [ ] Configure proper `ALLOWED_HOSTS`
- [ ] Set up SSL/HTTPS
- [ ] Configure production database
- [ ] Set up Redis in production
- [ ] Configure Celery workers (separate processes)
- [ ] Set up static file serving (CDN)
- [ ] Configure monitoring and logging
- [ ] Set up database backups

---

## Conclusion

Building Monarch Learning taught me a lot about:

1. **RAG Implementation**: Gemini File Search makes it surprisingly easy to build context-aware AI applications
2. **Prompt Engineering**: The quality of your prompts directly impacts the quality of AI responses
3. **Async Processing**: Never block your API for long-running operations
4. **Type Safety**: TypeScript catches so many bugs before they reach production
5. **Modern React Patterns**: Suspense, Server Components, and proper state management make for better UX

The platform is now production-ready and handles:
- ✅ File uploads and indexing
- ✅ Personalized assessment generation
- ✅ Real-time tutoring with citations
- ✅ Comprehensive analytics
- ✅ Secure authentication

### Next Steps

If you're building something similar, I recommend:

1. **Start Simple**: Get basic file upload working first
2. **Add File Search Gradually**: Test with one file, then scale up
3. **Iterate on Prompts**: Your first prompt won't be perfect
4. **Monitor Costs**: Gemini API usage can add up
5. **Test Thoroughly**: AI responses can be unpredictable

### Resources

- [Gemini API Documentation](https://ai.google.dev/gemini-api/docs)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Project Repository](https://github.com/yourusername/monarch-learning)

---

**Happy Building! 🚀**

If you found this article helpful, feel free to star the repository or reach out with questions. The codebase is open-source and well-documented, so you can dive deeper into any aspect that interests you.

---

*This article was written based on the actual implementation of Monarch Learning Platform. All code examples are from the production codebase.*

