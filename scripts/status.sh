#!/bin/bash

# Mission Control Status Script

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
PID_DIR="$PROJECT_DIR/.pids"
LOG_DIR="$PROJECT_DIR/logs"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

check_process() {
    local name=$1
    local pid_file="$PID_DIR/$name.pid"

    if [ -f "$pid_file" ]; then
        PID=$(cat "$pid_file")
        if kill -0 "$PID" 2>/dev/null; then
            echo -e "  $name: ${GREEN}running${NC} (PID: $PID)"
            return 0
        else
            echo -e "  $name: ${RED}stopped${NC} (stale PID file)"
            return 1
        fi
    else
        echo -e "  $name: ${YELLOW}not started${NC}"
        return 1
    fi
}

check_launchd_service() {
    local service=$1
    local status

    if launchctl list | grep -q "$service"; then
        echo -e "  $service: ${GREEN}loaded${NC}"
        return 0
    else
        echo -e "  $service: ${YELLOW}not loaded${NC}"
        return 1
    fi
}

check_port() {
    local port=$1
    local name=$2

    if curl -s "http://localhost:$port" > /dev/null 2>&1; then
        echo -e "  $name (port $port): ${GREEN}responding${NC}"
    else
        echo -e "  $name (port $port): ${RED}not responding${NC}"
    fi
}

check_hostname() {
    local hostname="mission.control"
    local port=$1

    if curl -s "http://$hostname:$port" > /dev/null 2>&1; then
        echo -e "  http://$hostname:$port: ${GREEN}accessible${NC}"
    else
        echo -e "  http://$hostname:$port: ${RED}not accessible${NC}"
    fi
}

main() {
    echo "Mission Control Status"
    echo "======================"
    echo ""

    echo "Launchd Services:"
    check_launchd_service "com.missioncontrol"
    check_launchd_service "com.missioncontrol.proxy"
    echo ""

    echo "Processes:"
    check_process "convex"
    check_process "nextjs"
    echo ""

    echo "Endpoints:"
    check_port 4847 "Next.js"
    check_port 8080 "Proxy"
    check_hostname 8080
    echo ""

    echo "Hostname:"
    if grep -q "mission.control" /etc/hosts 2>/dev/null; then
        echo -e "  /etc/hosts: ${GREEN}configured${NC}"
    else
        echo -e "  /etc/hosts: ${YELLOW}not configured${NC}"
    fi
    echo ""

    echo "Logs:"
    if [ -d "$LOG_DIR" ]; then
        echo "  Directory: $LOG_DIR"
        for logfile in "$LOG_DIR"/*.log; do
            if [ -f "$logfile" ]; then
                name=$(basename "$logfile")
                lines=$(wc -l < "$logfile" 2>/dev/null || echo "0")
                echo "  $name: $lines lines"
            fi
        done
    else
        echo "  No logs directory"
    fi
}

main "$@"
