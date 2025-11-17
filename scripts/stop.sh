#!/bin/bash

# Monarch Learning Platform - Stop Script

set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PID_DIR="$ROOT_DIR/.pids"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to stop a service
stop_service() {
    local service=$1
    local pid_file="$PID_DIR/${service}.pid"
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p "$pid" > /dev/null 2>&1; then
            print_status "Stopping $service (PID: $pid)..."
            kill "$pid" 2>/dev/null || true
            sleep 2
            if ps -p "$pid" > /dev/null 2>&1; then
                print_warning "$service didn't stop gracefully. Force killing..."
                kill -9 "$pid" 2>/dev/null || true
            fi
            rm -f "$pid_file"
            print_status "$service stopped ✓"
        else
            rm -f "$pid_file"
            print_warning "$service was not running"
        fi
    else
        print_warning "$service PID file not found"
    fi
}

# Stop services in reverse order
print_status "Stopping all services..."

# Stop Next.js
stop_service "nextjs"

# Stop Django
stop_service "django"

# Stop Celery
stop_service "celery"

# Also kill any processes on ports (in case PID files are missing)
kill_port_process() {
    local port=$1
    local pids=$(lsof -ti:$port 2>/dev/null)
    if [ ! -z "$pids" ]; then
        print_warning "Killing process(es) on port $port..."
        for pid in $pids; do
            kill "$pid" 2>/dev/null || true
        done
        sleep 1
        # Force kill if still running
        pids=$(lsof -ti:$port 2>/dev/null)
        if [ ! -z "$pids" ]; then
            for pid in $pids; do
                kill -9 "$pid" 2>/dev/null || true
            done
        fi
    fi
}

kill_port_process 3000
kill_port_process 8000

print_status "All services stopped ✓"

