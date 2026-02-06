#!/bin/bash

# Uninstall Mission Control launchd services (macOS)

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[Uninstall]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[Uninstall]${NC} $1"
}

uninstall_service() {
    local service_name=$1
    local plist_name=$2
    local plist_dest="$HOME/Library/LaunchAgents/$plist_name"

    if [ ! -f "$plist_dest" ]; then
        warn "$service_name service is not installed"
        return 0
    fi

    log "Stopping $service_name..."
    launchctl stop "$service_name" 2>/dev/null || true

    log "Unloading $service_name..."
    launchctl unload "$plist_dest" 2>/dev/null || true

    log "Removing $plist_name..."
    rm -f "$plist_dest"

    log "$service_name service uninstalled"
}

main() {
    echo "Mission Control Service Uninstaller"
    echo "===================================="
    echo ""

    uninstall_service "com.missioncontrol.proxy" "com.missioncontrol.proxy.plist"
    uninstall_service "com.missioncontrol" "com.missioncontrol.plist"

    log ""
    log "Mission Control services uninstalled successfully!"
    log ""
    log "Note: The hostname entry in /etc/hosts was not removed."
    log "To remove it manually: sudo sed -i '' '/mission.control/d' /etc/hosts"
}

main "$@"
