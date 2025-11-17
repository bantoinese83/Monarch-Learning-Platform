#!/bin/bash

# Monarch Learning Platform - Start Script
# Handles all edge cases and scenarios

set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
PID_DIR="$ROOT_DIR/.pids"
LOG_DIR="$ROOT_DIR/logs"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Create necessary directories
mkdir -p "$PID_DIR" "$LOG_DIR"

# Function to print colored messages
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Function to check if a process is running
is_running() {
    local pid=$1
    if [ -f "$PID_DIR/$pid" ]; then
        local stored_pid=$(cat "$PID_DIR/$pid")
        if ps -p "$stored_pid" > /dev/null 2>&1; then
            return 0
        else
            rm -f "$PID_DIR/$pid"
            return 1
        fi
    fi
    return 1
}

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0
    fi
    return 1
}

# Function to kill process on port
kill_port() {
    local port=$1
    local pids=$(lsof -ti:$port 2>/dev/null)
    
    if [ ! -z "$pids" ]; then
        # Handle multiple PIDs (can happen with some processes)
        for pid in $pids; do
            if ps -p "$pid" > /dev/null 2>&1; then
                print_warning "Killing process $pid on port $port"
                # Try graceful kill first
                kill "$pid" 2>/dev/null || true
                sleep 1
                # Force kill if still running
                if ps -p "$pid" > /dev/null 2>&1; then
                    kill -9 "$pid" 2>/dev/null || true
                fi
            fi
        done
        sleep 1
        # Verify port is free
        if lsof -ti:$port > /dev/null 2>&1; then
            print_warning "Port $port still in use, attempting force kill..."
            kill -9 $(lsof -ti:$port 2>/dev/null) 2>/dev/null || true
            sleep 1
        fi
    fi
}

# Function to wait for service to be ready
wait_for_service() {
    local url=$1
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -s "$url" > /dev/null 2>&1; then
            return 0
        fi
        attempt=$((attempt + 1))
        sleep 1
    done
    return 1
}

# Check Redis
print_status "Checking Redis..."
if ! command -v redis-cli &> /dev/null; then
    print_error "redis-cli not found. Please install Redis."
    exit 1
fi

if ! redis-cli ping > /dev/null 2>&1; then
    print_error "Redis is not running. Attempting to start..."
    if command -v redis-server &> /dev/null; then
        redis-server --daemonize yes 2>/dev/null || true
        sleep 2
        if redis-cli ping > /dev/null 2>&1; then
            print_status "Redis started ✓"
        else
            print_error "Failed to start Redis. Please start manually:"
            echo "  redis-server"
            exit 1
        fi
    else
        print_error "Redis is not running and redis-server not found."
        echo "Please install and start Redis:"
        echo "  brew install redis  # macOS"
        echo "  redis-server"
        exit 1
    fi
else
    print_status "Redis is running ✓"
fi

# Check backend environment
print_status "Checking backend setup..."
if [ ! -f "$BACKEND_DIR/.env" ]; then
    print_error "Backend .env file not found!"
    exit 1
fi

if [ ! -d "$BACKEND_DIR/venv" ]; then
    print_warning "Virtual environment not found. Creating..."
    cd "$BACKEND_DIR"
    python3 -m venv venv
    source venv/bin/activate
    pip install --upgrade pip
    pip install -r requirements.txt
    print_status "Virtual environment created ✓"
fi

# Check frontend environment
print_status "Checking frontend setup..."
if [ ! -f "$FRONTEND_DIR/.env.local" ]; then
    print_warning "Frontend .env.local not found. Creating..."
    echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > "$FRONTEND_DIR/.env.local"
fi

if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
    print_warning "Node modules not found. Installing..."
    cd "$FRONTEND_DIR"
    npm install
    print_status "Node modules installed ✓"
fi

# Check database connection
print_status "Checking database connection..."
cd "$BACKEND_DIR"
source venv/bin/activate
if ! python3 manage.py check --database default > /dev/null 2>&1; then
    print_warning "Database connection check failed. Running migrations..."
    python3 manage.py migrate
fi

# Start Celery worker
print_status "Starting Celery worker..."
if is_running "celery.pid"; then
    print_warning "Celery worker already running"
else
    cd "$BACKEND_DIR"
    source venv/bin/activate
    nohup celery -A monarch_learning worker -l info > "$LOG_DIR/celery.log" 2>&1 &
    echo $! > "$PID_DIR/celery.pid"
    sleep 2
    if is_running "celery.pid"; then
        print_status "Celery worker started ✓ (PID: $(cat $PID_DIR/celery.pid))"
    else
        print_error "Failed to start Celery worker. Check $LOG_DIR/celery.log"
        exit 1
    fi
fi

# Start Django server
print_status "Starting Django server..."
if check_port 8000; then
    if is_running "django.pid"; then
        print_warning "Django server already running on port 8000"
    else
        print_warning "Port 8000 is in use by another process. Killing it..."
        kill_port 8000
        sleep 1
    fi
fi

if ! check_port 8000 || ! is_running "django.pid"; then
    cd "$BACKEND_DIR"
    source venv/bin/activate
    nohup python3 manage.py runserver > "$LOG_DIR/django.log" 2>&1 &
    echo $! > "$PID_DIR/django.pid"
    sleep 3
    if is_running "django.pid"; then
        print_status "Django server started ✓ (PID: $(cat $PID_DIR/django.pid))"
        if wait_for_service "http://localhost:8000"; then
            print_status "Django available at http://localhost:8000"
        else
            print_warning "Django started but not responding yet. Check $LOG_DIR/django.log"
        fi
    else
        print_error "Failed to start Django server. Check $LOG_DIR/django.log"
        exit 1
    fi
fi

# Start Next.js
print_status "Starting Next.js frontend..."
if check_port 3000; then
    if is_running "nextjs.pid"; then
        print_warning "Next.js already running on port 3000"
    else
        print_warning "Port 3000 is in use by another process. Killing it..."
        kill_port 3000
        sleep 1
    fi
fi

if ! check_port 3000 || ! is_running "nextjs.pid"; then
    cd "$FRONTEND_DIR"
    nohup npm run dev > "$LOG_DIR/nextjs.log" 2>&1 &
    echo $! > "$PID_DIR/nextjs.pid"
    sleep 5
    if is_running "nextjs.pid"; then
        print_status "Next.js started ✓ (PID: $(cat $PID_DIR/nextjs.pid))"
        if wait_for_service "http://localhost:3000"; then
            print_status "Frontend available at http://localhost:3000"
        else
            print_warning "Next.js started but not responding yet. Check $LOG_DIR/nextjs.log"
        fi
    else
        print_error "Failed to start Next.js. Check $LOG_DIR/nextjs.log"
        exit 1
    fi
fi

echo ""
print_status "════════════════════════════════════════"
print_status "All services started successfully! 🚀"
print_status "════════════════════════════════════════"
echo ""
echo "Services:"
echo "  • Frontend:    http://localhost:3000"
echo "  • Backend API: http://localhost:8000"
echo "  • Admin Panel: http://localhost:8000/admin"
echo ""
echo "Logs:"
echo "  • Django:  $LOG_DIR/django.log"
echo "  • Celery:  $LOG_DIR/celery.log"
echo "  • Next.js: $LOG_DIR/nextjs.log"
echo ""
echo "To stop all services, run: ./scripts/stop.sh"
echo ""

