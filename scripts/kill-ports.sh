#!/bin/bash

# Kill processes on ports 3000 and 8000
# Useful for cleaning up stuck processes

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

kill_port() {
    local port=$1
    local pids=$(lsof -ti:$port 2>/dev/null)
    
    if [ ! -z "$pids" ]; then
        for pid in $pids; do
            if ps -p "$pid" > /dev/null 2>&1; then
                print_warning "Killing process $pid on port $port"
                kill "$pid" 2>/dev/null || true
                sleep 1
                if ps -p "$pid" > /dev/null 2>&1; then
                    kill -9 "$pid" 2>/dev/null || true
                fi
            fi
        done
        sleep 1
        if lsof -ti:$port > /dev/null 2>&1; then
            kill -9 $(lsof -ti:$port 2>/dev/null) 2>/dev/null || true
        fi
        print_status "Port $port cleared ✓"
    else
        print_status "Port $port is already free"
    fi
}

print_status "Killing processes on ports 3000 and 8000..."

kill_port 3000
kill_port 8000

print_status "Done!"

