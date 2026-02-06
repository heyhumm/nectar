#!/bin/bash

# Mission Control Stop Script

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
PID_DIR="$PROJECT_DIR/.pids"

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[Mission Control]${NC} $1"
}

error() {
    echo -e "${RED}[Mission Control]${NC} $1"
}

stop_process() {
    local name=$1
    local pid_file="$PID_DIR/$name.pid"

    if [ -f "$pid_file" ]; then
        PID=$(cat "$pid_file")
        if kill -0 "$PID" 2>/dev/null; then
            log "Stopping $name (PID: $PID)..."
            kill "$PID" 2>/dev/null

            # Wait for process to terminate
            for i in {1..10}; do
                if ! kill -0 "$PID" 2>/dev/null; then
                    break
                fi
                sleep 0.5
            done

            # Force kill if still running
            if kill -0 "$PID" 2>/dev/null; then
                log "Force killing $name..."
                kill -9 "$PID" 2>/dev/null
            fi

            log "$name stopped"
        else
            log "$name is not running"
        fi
        rm -f "$pid_file"
    else
        log "No PID file for $name"
    fi
}

main() {
    log "Stopping Mission Control..."

    stop_process "nextjs"
    stop_process "convex"

    log "Mission Control stopped"
}

main "$@"
