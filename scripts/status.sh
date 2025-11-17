#!/bin/bash

# Monarch Learning Platform - Status Script

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PID_DIR="$ROOT_DIR/.pids"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

check_service() {
    local service=$1
    local port=$2
    local pid_file="$PID_DIR/${service}.pid"
    
    echo -n "$service: "
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p "$pid" > /dev/null 2>&1; then
            if [ ! -z "$port" ]; then
                if lsof -ti:$port > /dev/null 2>&1; then
                    echo -e "${GREEN}Running${NC} (PID: $pid, Port: $port)"
                    return 0
                else
                    echo -e "${YELLOW}Process running but port $port not listening${NC}"
                    return 1
                fi
            else
                echo -e "${GREEN}Running${NC} (PID: $pid)"
                return 0
            fi
        else
            echo -e "${RED}Not running${NC} (stale PID file)"
            rm -f "$pid_file"
            return 1
        fi
    else
        if [ ! -z "$port" ] && lsof -ti:$port > /dev/null 2>&1; then
            echo -e "${YELLOW}Port $port in use by unknown process${NC}"
            return 1
        else
            echo -e "${RED}Not running${NC}"
            return 1
        fi
    fi
}

echo "════════════════════════════════════════"
echo "Monarch Learning Platform - Status"
echo "════════════════════════════════════════"
echo ""

# Check Redis
echo -n "Redis: "
if redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}Running${NC}"
else
    echo -e "${RED}Not running${NC}"
fi

echo ""

# Check services
check_service "Celery Worker" ""
check_service "Django Server" "8000"
check_service "Next.js Frontend" "3000"

echo ""
echo "════════════════════════════════════════"

