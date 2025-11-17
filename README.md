# Monarch Learning Platform

AI-powered personalized learning and tutoring system with Gemini File Search integration.

## Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+
- Redis (will auto-start if available)
- Google Gemini API Key

### One-Command Setup

```bash
# Install everything
make install

# Setup environment and database
make setup

# Start all services
make start
```

That's it! Your platform is now running.

### Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Admin Panel**: http://localhost:8000/admin
- **GraphQL API**: http://localhost:8000/graphql/ (dev mode)

## Available Commands

### Service Management
```bash
make start      # Start all services (Django, Celery, Next.js)
make stop       # Stop all services
make restart    # Restart all services
make status     # Check service status
make logs       # View logs from all services
```

### Setup & Development
```bash
make install        # Install all dependencies
make setup          # Initial setup (migrations, etc.)
make migrate        # Run database migrations
make makemigrations # Create new migrations
make superuser      # Create Django superuser
make shell          # Open Django shell (with shell_plus)
make test           # Run tests
```

### Code Quality (2025 Tools)
```bash
make lint          # Run Ruff linter (ultra-fast)
make format        # Format code with Ruff
make lint-fix      # Auto-fix linting issues
make type-check    # Run mypy type checking
make check-all     # Run all checks (lint, format, type-check)
```

### Development Mode
```bash
make dev-backend   # Run Django server in foreground
make dev-frontend  # Run Next.js in foreground
make dev-celery    # Run Celery worker in foreground
```

### Utilities
```bash
make clean         # Clean up temporary files and caches
make kill-ports    # Kill processes on ports 3000 and 8000
make help          # Show all available commands
```

## Architecture

- **Backend**: Django 5.0 + Django REST Framework
- **Frontend**: Next.js (React)
- **Database**: PostgreSQL (Neon)
- **Cache**: Redis
- **Task Queue**: Celery
- **AI**: Google Gemini API with File Search
- **Real-time**: WebSockets (Django Channels)
- **GraphQL**: graphene-django (optional)

## Features

- **Content Management**: Upload PDF, DOCX, and TXT files with AI-powered metadata extraction
- **File Preview**: In-browser preview for PDF and DOCX files before upload
- **Gemini File Search**: Advanced RAG-powered content indexing and retrieval
- **Student Profiles**: Comprehensive progress tracking and personalized learning
- **Adaptive Learning Paths**: AI-generated personalized learning paths based on knowledge gaps
- **RAG-Powered Tutor Bot**: Real-time AI tutor with file search integration
- **Analytics Dashboard**: Dynamic charts and visualizations with Nivo
- **Real-time Chat**: WebSocket-based tutor bot interface
- **Enhanced Admin Panel**: Color-coded badges, progress bars, and optimized queries
- **GraphQL API**: Optional GraphQL endpoint for flexible data queries
- **Modern UI/UX**: Polished interface with empty states, loading indicators, and animations

## First Time Setup

1. **Create backend `.env` file:**
   ```bash
   cd backend
   # Create .env with:
   # SECRET_KEY=your-secret-key
   # DEBUG=True
   # DB_NAME=monarch_learning
   # DB_USER=your-db-user
   # DB_PASSWORD=your-db-password
   # DB_HOST=your-db-host
   # GEMINI_API_KEY=your-gemini-key
   # REDIS_HOST=localhost
   # REDIS_PORT=6379
   ```

2. **Install dependencies:**
   ```bash
   make install
   ```

3. **Setup database:**
   ```bash
   make setup
   ```

4. **Create admin user:**
   ```bash
   make superuser
   ```

5. **Start services:**
   ```bash
   make start
   ```

## Admin Panel

Access the admin panel at http://localhost:8000/admin/ after creating a superuser.

**Features:**
- Enhanced UI with color-coded badges and progress bars
- Facet filters and date hierarchies
- Optimized querysets for better performance
- Visual indicators for status, severity, difficulty

## API Endpoints

- **Auth**: `/api/auth/register/`, `/api/auth/login/`, `/api/auth/refresh/`
- **Content**: `/api/content/` (list, create, upload)
- **Tutoring**: `/api/tutoring/conversations/`, `/api/tutoring/messages/`
- **Analytics**: `/api/analytics/progress/`, `/api/analytics/engagement/`
- **GraphQL**: `/graphql/` (GraphiQL interface in dev mode)

## Project Structure

```
monarch-learning/
├── backend/              # Django backend
│   ├── monarch_learning/ # Main Django project
│   ├── students/         # User and profile management
│   ├── content/          # Content management and File Search
│   ├── tutoring/         # Tutor bot and conversations
│   └── analytics/        # Analytics and reporting
├── frontend/             # Next.js frontend
│   ├── app/              # Next.js app directory
│   ├── components/       # React components
│   └── lib/              # Utilities
├── scripts/              # Management scripts
│   ├── start.sh          # Start all services
│   ├── stop.sh           # Stop all services
│   ├── restart.sh        # Restart all services
│   └── status.sh         # Check service status
└── Makefile              # Convenience commands
```

## Troubleshooting

**Services won't start:**
- Check if Redis is running: `redis-cli ping`
- Check if ports 3000 and 8000 are available
- Check logs: `make logs`

**Database connection issues:**
- Verify `.env` file has correct database credentials
- Check Neon project status
- Run `make migrate` to ensure migrations are up to date

**Port conflicts:**
- Use `make kill-ports` to automatically clear ports
- Or manually: `lsof -ti:8000 | xargs kill -9`

**Dependencies issues:**
- Run `make install` to reinstall all dependencies
- For backend: `cd backend && source venv/bin/activate && pip install -r requirements.txt`
- For frontend: `cd frontend && npm install`

## Optional Packages (2025 Trending)

The platform supports optional enhancements:

- **LangChain**: Enhanced tutor bot with memory and chains (see `backend/tutoring/langchain_service.py`)
- **PyCaret**: ML-powered learning path recommendations
- **Polars**: Fast DataFrame library for advanced analytics

Install optional packages:
```bash
pip install -r backend/requirements-optional.txt
```

## Security Features

- Enhanced security headers (CSP, XSS protection, clickjacking defense)
- HSTS and secure cookies in production
- Password validation (12 character minimum)
- CSRF protection with secure cookies
- JWT authentication

## Development Tools

- **Ruff**: Ultra-fast linter and formatter (10-100x faster)
- **Django Debug Toolbar**: Query profiling (dev mode)
- **mypy**: Type checking
- **django-extensions**: Enhanced shell and utilities

## Recent Updates

### DOCX Support
- Full DOCX file support for upload, preview, and metadata extraction
- Browser-based DOCX preview using Mammoth library
- Automatic text extraction for Gemini AI processing

### Enhanced UX
- Confetti celebration on successful file uploads
- Drag-and-drop file upload interface
- Real-time upload progress indicators
- AI-powered auto-fill for content metadata

### Performance Optimizations
- Django ORM optimizations (select_related, prefetch_related, bulk operations)
- Custom model managers for efficient queries
- Database indexes for common query patterns
- Memory-efficient file processing

### Code Quality (2025)
- Ruff linter and formatter (10-100x faster than alternatives)
- Type checking with mypy and django-stubs
- Comprehensive error handling and logging
- Clean architecture with service layers

## Environment Variables

**Backend** (`backend/.env`):
```bash
SECRET_KEY=your-secret-key-here
DEBUG=True
DB_NAME=monarch_learning
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_HOST=your-db-host
DB_PORT=5432
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-2.5-flash
REDIS_HOST=localhost
REDIS_PORT=6379
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0
```

**Frontend** (`frontend/.env.local`):
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

⚠️ **Important**: Never commit `.env` files or API keys to version control!

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - See LICENSE file for details
