.PHONY: help start stop restart status install setup logs clean kill-ports migrate superuser shell test dev-backend dev-frontend dev-celery lint format lint-fix type-check check-all makemigrations

help: ## Show this help message
	@echo "Monarch Learning Platform - Management Commands"
	@echo ""
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-15s %s\n", $$1, $$2}'

start: ## Start all services (Django, Celery, Next.js)
	@./scripts/start.sh

stop: ## Stop all services
	@./scripts/stop.sh

restart: ## Restart all services
	@./scripts/restart.sh

status: ## Show status of all services
	@./scripts/status.sh

install: ## Install all dependencies (backend + frontend)
	@echo "Installing backend dependencies..."
	@cd backend && python3 -m venv venv || true
	@cd backend && source venv/bin/activate && pip install --upgrade pip && pip install -r requirements.txt
	@echo "Installing frontend dependencies..."
	@cd frontend && npm install
	@echo "Installation complete!"

setup: ## Initial setup (create .env files, run migrations)
	@echo "Setting up environment..."
	@test -f backend/.env || (echo "ERROR: backend/.env not found. Please create it first." && exit 1)
	@test -f frontend/.env.local || echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > frontend/.env.local
	@cd backend && source venv/bin/activate && python3 manage.py makemigrations
	@cd backend && source venv/bin/activate && python3 manage.py migrate
	@echo "Setup complete!"

logs: ## Show logs from all services
	@echo "=== Django Logs ==="
	@tail -n 20 logs/django.log 2>/dev/null || echo "No Django logs found"
	@echo ""
	@echo "=== Celery Logs ==="
	@tail -n 20 logs/celery.log 2>/dev/null || echo "No Celery logs found"
	@echo ""
	@echo "=== Next.js Logs ==="
	@tail -n 20 logs/nextjs.log 2>/dev/null || echo "No Next.js logs found"

logs-django: ## Show Django logs (follow mode)
	@tail -f logs/django.log 2>/dev/null || echo "No Django logs found"

logs-celery: ## Show Celery logs (follow mode)
	@tail -f logs/celery.log 2>/dev/null || echo "No Celery logs found"

logs-nextjs: ## Show Next.js logs (follow mode)
	@tail -f logs/nextjs.log 2>/dev/null || echo "No Next.js logs found"

clean: ## Clean up PID files and logs
	@echo "Cleaning up..."
	@rm -rf .pids logs/*.log
	@echo "Cleanup complete!"

kill-ports: ## Kill processes on ports 3000 and 8000
	@./scripts/kill-ports.sh

migrate: ## Run database migrations
	@cd backend && source venv/bin/activate && python3 manage.py makemigrations
	@cd backend && source venv/bin/activate && python3 manage.py migrate

superuser: ## Create Django superuser
	@cd backend && source venv/bin/activate && python3 manage.py createsuperuser

shell: ## Open Django shell
	@cd backend && source venv/bin/activate && python3 manage.py shell

test: ## Run tests
	@cd backend && source venv/bin/activate && python3 manage.py test

dev-backend: ## Run Django server in foreground (for debugging)
	@cd backend && source venv/bin/activate && python3 manage.py runserver

dev-frontend: ## Run Next.js in foreground (for debugging)
	@cd frontend && npm run dev

dev-celery: ## Run Celery worker in foreground (for debugging)
	@cd backend && source venv/bin/activate && celery -A monarch_learning worker -l info

makemigrations: ## Create new migrations
	@cd backend && source venv/bin/activate && python3 manage.py makemigrations

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

