#!/bin/bash

# Development helper script - Quick commands

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

case "$1" in
    "backend"|"django"|"api")
        cd "$BACKEND_DIR"
        source venv/bin/activate
        python3 manage.py runserver
        ;;
    "frontend"|"next"|"nextjs")
        cd "$FRONTEND_DIR"
        npm run dev
        ;;
    "celery")
        cd "$BACKEND_DIR"
        source venv/bin/activate
        celery -A monarch_learning worker -l info
        ;;
    "shell")
        cd "$BACKEND_DIR"
        source venv/bin/activate
        python3 manage.py shell
        ;;
    "migrate")
        cd "$BACKEND_DIR"
        source venv/bin/activate
        python3 manage.py makemigrations
        python3 manage.py migrate
        ;;
    "superuser")
        cd "$BACKEND_DIR"
        source venv/bin/activate
        python3 manage.py createsuperuser
        ;;
    *)
        echo "Usage: ./scripts/dev.sh [backend|frontend|celery|shell|migrate|superuser]"
        echo ""
        echo "Commands:"
        echo "  backend/frontend/celery  - Run individual service in foreground"
        echo "  shell                    - Open Django shell"
        echo "  migrate                  - Run migrations"
        echo "  superuser                - Create Django superuser"
        exit 1
        ;;
esac

