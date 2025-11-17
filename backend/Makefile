# Makefile for Monarch Learning Platform
# Enhanced with Ruff and other 2025 tools

.PHONY: help start stop restart status install setup logs clean kill-ports migrate superuser shell test dev-backend dev-frontend dev-celery lint format type-check

help: ## Show this help message
	@echo "Monarch Learning Platform - Available Commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

start: ## Start all services (backend, frontend, celery, redis)
	@./scripts/start.sh

stop: ## Stop all services
	@./scripts/stop.sh

restart: ## Restart all services
	@./scripts/restart.sh

status: ## Show status of all services
	@./scripts/status.sh

install: ## Install all dependencies
	@echo "Installing backend dependencies..."
	@cd backend && source venv/bin/activate && pip install -r requirements.txt
	@echo "Installing frontend dependencies..."
	@cd frontend && npm install

setup: ## Initial setup (create venv, install deps, run migrations)
	@./scripts/setup.sh

logs: ## View logs from all services
	@./scripts/logs.sh

clean: ## Clean temporary files and caches
	@echo "Cleaning temporary files..."
	@find . -type d -name "__pycache__" -exec rm -r {} + 2>/dev/null || true
	@find . -type f -name "*.pyc" -delete 2>/dev/null || true
	@find . -type d -name "*.egg-info" -exec rm -r {} + 2>/dev/null || true
	@rm -rf backend/.pytest_cache backend/.mypy_cache
	@echo "Clean complete ✓"

kill-ports: ## Kill processes on ports 3000 and 8000
	@./scripts/kill-ports.sh

migrate: ## Run database migrations
	@cd backend && source venv/bin/activate && python3 manage.py migrate

makemigrations: ## Create new migrations
	@cd backend && source venv/bin/activate && python3 manage.py makemigrations

superuser: ## Create Django superuser
	@cd backend && source venv/bin/activate && python3 manage.py createsuperuser

shell: ## Open Django shell
	@cd backend && source venv/bin/activate && python3 manage.py shell_plus

test: ## Run tests
	@cd backend && source venv/bin/activate && python3 manage.py test

dev-backend: ## Start backend in development mode
	@cd backend && source venv/bin/activate && python3 manage.py runserver

dev-frontend: ## Start frontend in development mode
	@cd frontend && npm run dev

dev-celery: ## Start Celery worker
	@cd backend && source venv/bin/activate && celery -A monarch_learning worker -l info

lint: ## Run Ruff linter (2025 ultra-fast)
	@cd backend && source venv/bin/activate && ruff check .

format: ## Format code with Ruff
	@cd backend && source venv/bin/activate && ruff format .

lint-fix: ## Run Ruff linter and auto-fix issues
	@cd backend && source venv/bin/activate && ruff check --fix .

type-check: ## Run mypy type checking
	@cd backend && source venv/bin/activate && mypy .

check-all: ## Run all checks (lint, format, type-check)
	@echo "Running Ruff linter..."
	@cd backend && source venv/bin/activate && ruff check .
	@echo "Checking code formatting..."
	@cd backend && source venv/bin/activate && ruff format --check .
	@echo "Running type checks..."
	@cd backend && source venv/bin/activate && mypy .
	@echo "All checks passed ✓"

