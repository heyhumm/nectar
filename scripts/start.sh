#!/bin/bash

# Mission Control Startup Script
# Starts both Convex and Next.js dev servers

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$PROJECT_DIR/logs"
PID_DIR="$PROJECT_DIR/.pids"

# Create directories
mkdir -p "$LOG_DIR" "$PID_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[Mission Control]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[Mission Control]${NC} $1"
}

error() {
    echo -e "${RED}[Mission Control]${NC} $1"
}

cleanup() {
    log "Shutting down..."

    if [ -f "$PID_DIR/convex.pid" ]; then
        CONVEX_PID=$(cat "$PID_DIR/convex.pid")
        if kill -0 "$CONVEX_PID" 2>/dev/null; then
            kill "$CONVEX_PID" 2>/dev/null || true
        fi
        rm -f "$PID_DIR/convex.pid"
    fi

    if [ -f "$PID_DIR/nextjs.pid" ]; then
        NEXTJS_PID=$(cat "$PID_DIR/nextjs.pid")
        if kill -0 "$NEXTJS_PID" 2>/dev/null; then
            kill "$NEXTJS_PID" 2>/dev/null || true
        fi
        rm -f "$PID_DIR/nextjs.pid"
    fi

    log "Shutdown complete"
    exit 0
}

trap cleanup SIGINT SIGTERM

check_dependencies() {
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed"
        exit 1
    fi

    if ! command -v npm &> /dev/null; then
        error "npm is not installed"
        exit 1
    fi

    if [ ! -f "$PROJECT_DIR/package.json" ]; then
        error "package.json not found in $PROJECT_DIR"
        exit 1
    fi

    if [ ! -f "$PROJECT_DIR/.env.local" ]; then
        warn ".env.local not found - Convex may not be initialized"
        warn "Run 'npx convex dev' interactively first to set up your project"
    fi
}

start_convex() {
    log "Starting Convex dev server..."
    cd "$PROJECT_DIR"

    npx convex dev >> "$LOG_DIR/convex.log" 2>&1 &
    CONVEX_PID=$!
    echo $CONVEX_PID > "$PID_DIR/convex.pid"

    log "Convex started (PID: $CONVEX_PID)"
}

start_nextjs() {
    log "Starting Next.js dev server..."
    cd "$PROJECT_DIR"

    npm run dev >> "$LOG_DIR/nextjs.log" 2>&1 &
    NEXTJS_PID=$!
    echo $NEXTJS_PID > "$PID_DIR/nextjs.pid"

    log "Next.js started (PID: $NEXTJS_PID)"
}

wait_for_services() {
    log "Waiting for services to be ready..."

    # Wait for Next.js to be ready (port 4847)
    for i in {1..30}; do
        if curl -s http://localhost:4847 > /dev/null 2>&1; then
            log "Next.js is ready at http://localhost:4847"
            break
        fi
        sleep 1
    done
}

main() {
    log "Starting Mission Control..."
    log "Project directory: $PROJECT_DIR"

    check_dependencies

    # Check if already running
    if [ -f "$PID_DIR/nextjs.pid" ]; then
        EXISTING_PID=$(cat "$PID_DIR/nextjs.pid")
        if kill -0 "$EXISTING_PID" 2>/dev/null; then
            warn "Mission Control appears to be already running (PID: $EXISTING_PID)"
            warn "Use 'scripts/stop.sh' to stop it first"
            exit 1
        fi
    fi

    start_convex
    sleep 2  # Give Convex a moment to start
    start_nextjs

    wait_for_services

    log "Mission Control is running!"
    log "  - Web UI: http://localhost:4847"
    log "  - Logs: $LOG_DIR"
    log ""
    log "Press Ctrl+C to stop"

    # Wait for child processes
    wait
}

main "$@"
