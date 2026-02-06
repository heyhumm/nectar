#!/bin/bash

# Install Mission Control as a launchd service (macOS)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[Install]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[Install]${NC} $1"
}

error() {
    echo -e "${RED}[Install]${NC} $1"
}

check_prerequisites() {
    # Check if .env.local exists
    if [ ! -f "$PROJECT_DIR/.env.local" ]; then
        error ".env.local not found!"
        error "You must run 'npx convex dev' interactively first to set up Convex."
        error "This creates the .env.local file needed for the service to work."
        exit 1
    fi

    # Check if node_modules exists
    if [ ! -d "$PROJECT_DIR/node_modules" ]; then
        error "node_modules not found!"
        error "Run 'npm install' first."
        exit 1
    fi
}

install_launchd_service() {
    local plist_name=$1
    local service_name=$2
    local plist_src="$SCRIPT_DIR/$plist_name"
    local plist_dest="$HOME/Library/LaunchAgents/$plist_name"

    log "Installing $service_name service..."

    # Unload existing service if present
    if [ -f "$plist_dest" ]; then
        warn "Existing $service_name service found, unloading..."
        launchctl unload "$plist_dest" 2>/dev/null || true
    fi

    # Copy plist
    cp "$plist_src" "$plist_dest"
    log "Copied $plist_name to $plist_dest"

    # Load the service
    launchctl load "$plist_dest"
    log "$service_name service loaded"
}

setup_hostname() {
    local hostname="mission.control"
    local hosts_file="/etc/hosts"

    if grep -q "$hostname" "$hosts_file" 2>/dev/null; then
        log "Hostname '$hostname' already exists in $hosts_file"
    else
        log "Adding '$hostname' to $hosts_file (requires sudo)..."
        echo "127.0.0.1	$hostname" | sudo tee -a "$hosts_file" > /dev/null
        log "Added: 127.0.0.1	$hostname"
    fi
}

main() {
    echo "Mission Control Service Installer"
    echo "=================================="
    echo ""

    check_prerequisites

    # Create LaunchAgents directory if needed
    mkdir -p "$HOME/Library/LaunchAgents"

    # Create logs directory
    mkdir -p "$PROJECT_DIR/logs"

    # Install main service
    install_launchd_service "com.missioncontrol.plist" "Mission Control"

    # Install proxy service
    install_launchd_service "com.missioncontrol.proxy.plist" "Proxy"

    # Setup hostname
    echo ""
    setup_hostname

    log ""
    log "Mission Control services installed successfully!"
    log ""
    log "Services:"
    log "  com.missioncontrol       - Main app (Convex + Next.js)"
    log "  com.missioncontrol.proxy - Hostname proxy"
    log ""
    log "Commands:"
    log "  Start all:  launchctl start com.missioncontrol && launchctl start com.missioncontrol.proxy"
    log "  Stop all:   launchctl stop com.missioncontrol.proxy && launchctl stop com.missioncontrol"
    log "  Status:     $SCRIPT_DIR/status.sh"
    log "  Logs:       tail -f $PROJECT_DIR/logs/*.log"
    log ""
    log "Access: http://mission.control:8080"
    log "(For http://mission.control without port, run proxy with sudo)"
    log ""
    log "The services will start automatically on login."
    log "To start now: launchctl start com.missioncontrol && launchctl start com.missioncontrol.proxy"
}

main "$@"
