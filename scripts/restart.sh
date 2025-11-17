#!/bin/bash

# Monarch Learning Platform - Restart Script

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "Restarting all services..."
"$ROOT_DIR/scripts/stop.sh"
sleep 2
"$ROOT_DIR/scripts/start.sh"

