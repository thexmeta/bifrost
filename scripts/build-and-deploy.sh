#!/bin/bash
set -euo pipefail

# =============================================================================
# Bifrost AI Gateway - Build and Deploy Script
# =============================================================================
# Builds the bifrost-http binary and deploys it to the target directory
# Supports both local development and production deployments
# =============================================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# =============================================================================
# Configuration
# =============================================================================
VERSION="${VERSION:-}"
TARGET_DIR="${TARGET_DIR:-}"
NO_STOP="${NO_STOP:-false}"
SKIP_UI="${SKIP_UI:-false}"
SYSTEMD_SERVICE="${SYSTEMD_SERVICE:-true}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BINARY_NAME="bifrost-http"
DEFAULT_TARGET_DIR="/usr/local/bin"
DEFAULT_DATA_DIR="/etc/bifrost"
DEFAULT_WORK_DIR="/var/lib/bifrost"
EXISTING_SERVICE=false

log_info()    { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error()   { echo -e "${RED}[ERROR]${NC} $1"; }

# =============================================================================
# Usage
# =============================================================================
usage() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  Bifrost Build and Deploy Script${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --version VERSION        Build version (default: git describe or dev-build)"
    echo "  --target-dir DIR         Target directory for deployment (default: /usr/local/bin)"
    echo "  --no-stop                Don't stop existing Bifrost instance"
    echo "  --skip-ui                Skip UI build (Go binary only)"
    echo "  --no-systemd             Don't create/manage systemd service"
    echo "  --help                   Show this help message"
    echo ""
    echo "Environment Variables:"
    echo "  VERSION                  Build version (overrides --version)"
    echo "  TARGET_DIR               Target directory (overrides --target-dir)"
    echo "  PORT                     Server port (default: 4000)"
    echo "  NO_STOP                  Don't stop existing instance (true/false)"
    echo "  SKIP_UI                  Skip UI build (true/false)"
    echo ""
    echo "Examples:"
    echo "  $0                                # Build and deploy to /usr/local/bin"
    echo "  $0 --target-dir /opt/bifrost      # Custom target directory"
    echo "  $0 --skip-ui                      # Build binary only"
    echo "  VERSION=1.2.3 $0                  # Specific version tag"
    echo "  PORT=8080 $0                      # Custom port"
    echo ""
    exit 0
}

# =============================================================================
# Parse Arguments
# =============================================================================
parse_args() {
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --version)
                VERSION="$2"
                shift 2
                ;;
            --target-dir)
                TARGET_DIR="$2"
                shift 2
                ;;
            --no-stop)
                NO_STOP="true"
                shift
                ;;
            --skip-ui)
                SKIP_UI="true"
                shift
                ;;
            --no-systemd)
                SYSTEMD_SERVICE="false"
                shift
                ;;
            --help)
                usage
                ;;
            *)
                log_error "Unknown option: $1"
                usage
                ;;
        esac
    done
}

# =============================================================================
# Get Build Version
# =============================================================================
get_version() {
    if [ -z "$VERSION" ] || [ "$VERSION" = "local-build" ]; then
        if command -v git &>/dev/null && git rev-parse --git-dir &>/dev/null; then
            VERSION=$(git describe --tags --always --dirty 2>/dev/null || git rev-parse --short HEAD 2>/dev/null || echo "dev-build")
        else
            VERSION="dev-build"
        fi
    fi
    log_info "Build Version: v${VERSION}"
}

# =============================================================================
# Detect Existing Bifrost Service Configuration
# =============================================================================
detect_existing_service() {
    log_info "Checking existing Bifrost service configuration..."

    local service_file="/etc/systemd/system/bifrost-http.service"

    # Check if systemd service exists
    if [ -f "$service_file" ]; then
        EXISTING_SERVICE=true
        log_success "Found existing systemd service at: $service_file"

        # Extract ExecStart path
        local exec_start
        exec_start=$(grep -E "^ExecStart=" "$service_file" 2>/dev/null | sed 's/^ExecStart=//' | awk '{print $1}')
        if [ -n "$exec_start" ]; then
            log_info "  Binary location:     $exec_start"
        fi

        # Extract WorkingDirectory
        local work_dir
        work_dir=$(grep -E "^WorkingDirectory=" "$service_file" 2>/dev/null | cut -d= -f2 | xargs)
        if [ -n "$work_dir" ]; then
            log_info "  Working directory:   $work_dir"
        fi

        # Extract config/app dir from flags
        local app_dir
        app_dir=$(grep -E "^ExecStart=" "$service_file" 2>/dev/null | grep -oP '(?:--app-dir|-app-dir)\s+\K[^ ]+' || true)
        if [ -z "$app_dir" ]; then
            app_dir=$(grep -E "^ExecStart=" "$service_file" 2>/dev/null | grep -oP '(?:--config|-config)\s+\K[^ ]+' | xargs dirname 2>/dev/null || true)
        fi
        if [ -n "$app_dir" ]; then
            log_info "  App/Config directory: $app_dir"
        fi

        # Extract host and port
        local host port
        host=$(grep -E "^ExecStart=" "$service_file" 2>/dev/null | grep -oP '(?:--host|-host)\s+\K[^ ]+' || true)
        port=$(grep -E "^ExecStart=" "$service_file" 2>/dev/null | grep -oP '(?:--port|-port)\s+\K[^ ]+' || true)
        if [ -n "$host" ] && [ -n "$port" ]; then
            log_info "  Listen address:      $host:$port"
        fi

        log_warn "Existing service found - will NOT be modified"
    else
        log_info "No existing systemd service found"
    fi

    # Check for running process
    if pgrep -x "bifrost-http" > /dev/null 2>&1; then
        local proc_info
        proc_info=$(pgrep -x "bifrost-http" -a 2>/dev/null | head -1)
        log_info "  Running process:     $proc_info"
    fi

    # Set default deployment directory
    if [ -z "$TARGET_DIR" ]; then
        TARGET_DIR="$DEFAULT_TARGET_DIR"
        log_info "Default deployment directory: $TARGET_DIR"
    else
        log_info "Using specified deployment directory: $TARGET_DIR"
    fi

    echo ""
}

# =============================================================================
# Stop Existing Bifrost Instance
# =============================================================================
stop_existing() {
    if [ "$EXISTING_SERVICE" = "true" ]; then
        log_warn "Existing service found - NOT stopping (use existing service management)"
        echo ""
        return
    fi

    if [ "$NO_STOP" = "true" ]; then
        log_info "Skipping stop of existing instances (--no-stop)"
        echo ""
        return
    fi

    log_info "Stopping existing Bifrost instances..."

    # Stop systemd service if running
    if systemctl is-active --quiet bifrost-http 2>/dev/null; then
        log_info "  Stopping systemd service: bifrost-http"
        sudo systemctl stop bifrost-http || {
            log_warn "  Failed to stop service gracefully, forcing..."
            sudo systemctl stop bifrost-http --force || true
        }
        sleep 2
        if systemctl is-active --quiet bifrost-http 2>/dev/null; then
            log_error "  Service still running after stop attempt"
            return 1
        fi
        log_success "  Service stopped successfully"
    else
        log_info "  No systemd service running"
    fi

    # Kill any remaining bifrost-http processes
    if pgrep -x "bifrost-http" > /dev/null; then
        log_info "  Found running bifrost-http processes"
        log_info "  Sending SIGTERM..."
        pkill -x "bifrost-http" || true
        sleep 2

        if pgrep -x "bifrost-http" > /dev/null; then
            log_warn "  Processes still running, sending SIGKILL..."
            pkill -9 -x "bifrost-http" || true
            sleep 1
        fi
        log_success "  Processes terminated"
    else
        log_info "  No running bifrost-http processes"
    fi

    echo ""
}

# =============================================================================
# Prerequisites Check
# =============================================================================
check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check Go installation
    if ! command -v go &>/dev/null; then
        log_error "Go is not installed or not in PATH"
        echo "Install Go 1.26.1+ from https://go.dev/dl/"
        exit 1
    fi

    log_info "Go version: $(go version)"

    # Check Node.js for UI build
    if [ "$SKIP_UI" = "false" ]; then
        if ! command -v node &>/dev/null; then
            log_error "Node.js is not installed or not in PATH (required for UI build)"
            exit 1
        fi
        if ! command -v npm &>/dev/null; then
            log_error "npm is not installed or not in PATH (required for UI build)"
            exit 1
        fi
        log_info "Node.js version: $(node --version)"
    fi

    log_success "All prerequisites met"
    echo ""
}

# =============================================================================
# Build UI
# =============================================================================
build_ui() {
    if [ "$SKIP_UI" = "true" ]; then
        log_info "Skipping UI build (--skip-ui)"
        echo ""
        return
    fi

    log_info "Building UI..."

    local ui_dir="$PROJECT_DIR/ui"
    local ui_out_dir="$ui_dir/out"

    if [ ! -d "$ui_dir" ]; then
        log_warn "UI directory not found at $ui_dir, skipping UI build"
        echo ""
        return
    fi

    cd "$ui_dir"

    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        log_info "  Installing UI dependencies..."
        npm ci --prefer-offline || npm install
    fi

    # Build Next.js frontend
    log_info "  Building Next.js UI..."
    export NEXT_TELEMETRY_DISABLED=1
    
    # Build with linting disabled for release
    if ! npx next build --no-lint; then
        log_warn "  UI build completed with warnings"
    fi

    # Check if build succeeded
    if [ -d "$ui_out_dir" ]; then
        log_success "  UI build successful"
        
        # Copy built UI to embed location
        log_info "  Copying UI to embed location..."
        if [ -f "scripts/copy-build.js" ]; then
            node scripts/copy-build.js || log_warn "  UI copy script failed, continuing..."
        elif [ -f "scripts/fix-config.js" ]; then
            # Fallback: manual copy if copy-build.js doesn't exist
            local embed_dir="$PROJECT_DIR/transports/bifrost-http/server/static"
            mkdir -p "$embed_dir"
            cp -r "$ui_out_dir"/* "$embed_dir/" 2>/dev/null || true
            log_info "  UI copied to embed location"
        fi
    else
        log_warn "  UI build completed but no output found, continuing with Go build"
    fi

    cd "$PROJECT_DIR"
    echo ""
}

# =============================================================================
# Build Go Binary
# =============================================================================
build_binary() {
    log_info "Building bifrost-http..."

    local build_dir="$PROJECT_DIR/transports/bifrost-http"
    local output_path="$PROJECT_DIR/tmp/bifrost-http"

    # Ensure tmp directory exists
    mkdir -p "$PROJECT_DIR/tmp"

    cd "$build_dir"

    # Build the binary
    log_info "  Building with ldflags: -X main.Version=v${VERSION}"
    
    if ! CGO_ENABLED=1 \
        GOOS=linux \
        GOARCH=amd64 \
        GOWORK=off \
        go build \
            -ldflags="-w -s -extldflags '-static' -X main.Version=v${VERSION}" \
            -a \
            -trimpath \
            -tags "sqlite_static" \
            -o "$output_path" \
            .; then
        log_error "Build failed"
        exit 1
    fi

    # Verify binary
    if [ ! -f "$output_path" ]; then
        log_error "Build failed - binary not found at $output_path"
        exit 1
    fi

    log_success "  Build successful: $output_path"
    log_info "  Binary size: $(du -h "$output_path" | cut -f1)"
    log_info "  Binary type: $(file "$output_path")"
    
    cd "$PROJECT_DIR"
    echo ""
}

# =============================================================================
# Deploy to Target Directory
# =============================================================================
deploy() {
    log_info "Deploying to $TARGET_DIR..."

    # Create target directory if it doesn't exist
    if [ ! -d "$TARGET_DIR" ]; then
        log_info "  Creating target directory..."
        sudo mkdir -p "$TARGET_DIR"
    fi

    # Copy the binary
    local target_binary="$TARGET_DIR/$BINARY_NAME"
    log_info "  Copying binary to $target_binary"
    sudo cp "$PROJECT_DIR/tmp/bifrost-http" "$target_binary"
    sudo chmod 755 "$target_binary"

    # Verify copy
    if [ -f "$target_binary" ]; then
        local file_size
        file_size=$(du -h "$target_binary" | cut -f1)
        log_success "  Binary deployed successfully ($file_size)"
    else
        log_error "  Failed to copy binary to target directory"
        exit 1
    fi

    # Install default config to /etc/bifrost if not exists
    if [ ! -f "$DEFAULT_DATA_DIR/config.json" ]; then
        if [ -f "$PROJECT_DIR/config.json" ]; then
            log_info "  Installing default config..."
            sudo mkdir -p "$DEFAULT_DATA_DIR"
            sudo cp "$PROJECT_DIR/config.json" "$DEFAULT_DATA_DIR/config.json"
            sudo chmod 644 "$DEFAULT_DATA_DIR/config.json"
            log_info "  Default config installed to $DEFAULT_DATA_DIR/config.json"
        fi
    fi

    # Ensure data directory exists
    sudo mkdir -p "$DEFAULT_WORK_DIR/logs"
    sudo chmod 755 "$DEFAULT_WORK_DIR"

    echo ""
}

# =============================================================================
# Create systemd Service
# =============================================================================
create_systemd_service() {
    if [ "$EXISTING_SERVICE" = "true" ]; then
        log_warn "Existing service found - NOT modifying systemd service"
        log_info "Binary will be deployed to $TARGET_DIR, but service configuration remains unchanged"
        echo ""
        return
    fi

    if [ "$SYSTEMD_SERVICE" = "false" ]; then
        log_info "Skipping systemd service creation (--no-systemd)"
        return
    fi

    local service_file="/etc/systemd/system/bifrost-http.service"
    local port="${PORT:-4000}"

    log_info "Creating systemd service..."

    sudo cat > "$service_file" <<EOF
[Unit]
Description=Bifrost AI Gateway
After=network.target

[Service]
Type=simple
ExecStart=$TARGET_DIR/$BINARY_NAME -host 0.0.0.0 -port $port -app-dir $DEFAULT_DATA_DIR/bifrost-data
WorkingDirectory=$DEFAULT_WORK_DIR
Restart=on-failure
RestartSec=5s
StandardOutput=journal
StandardError=journal
SyslogIdentifier=bifrost-http
StartLimitInterval=60
StartLimitBurst=3

# Security hardening
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=$DEFAULT_WORK_DIR $DEFAULT_DATA_DIR

# Go runtime performance tuning (adjust as needed)
Environment=GOGC=200
Environment=GOMEMLIMIT=500MiB

[Install]
WantedBy=multi-user.target
EOF

    log_success "Systemd service created at $service_file"

    # Reload systemd daemon
    sudo systemctl daemon-reload

    log_info "Service configured with:"
    log_info "  Binary:  $TARGET_DIR/$BINARY_NAME"
    log_info "  Port:    $port"
    log_info "  App dir: $DEFAULT_DATA_DIR/bifrost-data"

    echo ""
}

# =============================================================================
# Start Service
# =============================================================================
start_service() {
    if [ "$EXISTING_SERVICE" = "true" ]; then
        log_warn "Existing service found - NOT restarting (use: sudo systemctl restart bifrost-http)"
        echo ""
        return
    fi

    if [ "$NO_STOP" = "true" ]; then
        return
    fi

    log_info "Starting Bifrost service..."

    if systemctl is-enabled bifrost-http &>/dev/null; then
        sudo systemctl enable bifrost-http
        sudo systemctl start bifrost-http
        sleep 2

        if systemctl is-active --quiet bifrost-http; then
            log_success "Service started successfully"
        else
            log_warn "Service failed to start automatically"
            log_info "Start manually with: sudo systemctl start bifrost-http"
        fi
    else
        log_info "Systemd service not enabled"
    fi

    echo ""
}

# =============================================================================
# Print Summary
# =============================================================================
print_summary() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${GREEN}  Build and Deploy Complete!${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    echo -e "Version:        ${YELLOW}v${VERSION}${NC}"
    echo -e "Binary:         ${YELLOW}$TARGET_DIR/$BINARY_NAME${NC}"
    echo -e "Config:         ${YELLOW}$DEFAULT_DATA_DIR/config.json${NC}"
    echo -e "Data dir:       ${YELLOW}$DEFAULT_DATA_DIR/bifrost-data${NC}"
    echo -e "Work dir:       ${YELLOW}$DEFAULT_WORK_DIR${NC}"
    echo ""

    local port="${PORT:-4000}"

    if [ "$EXISTING_SERVICE" = "true" ]; then
        echo -e "Status:         ${YELLOW}Existing service untouched - restart manually if needed:${NC}"
        echo -e "                ${CYAN}sudo systemctl restart bifrost-http${NC}"
    elif systemctl is-active --quiet bifrost-http 2>/dev/null; then
        echo -e "Status:         ${GREEN}Service is running on port $port${NC}"
    elif systemctl is-enabled bifrost-http &>/dev/null; then
        echo -e "Status:         ${YELLOW}Service is enabled (start with: sudo systemctl start bifrost-http)${NC}"
    else
        echo -e "Status:         ${YELLOW}Deployed (not running as service)${NC}"
        echo ""
        echo -e "${YELLOW}To start Bifrost manually:${NC}"
        echo -e "  cd $TARGET_DIR"
        echo -e "  ./$BINARY_NAME -host 0.0.0.0 -port $port -app-dir $DEFAULT_DATA_DIR/bifrost-data"
    fi

    echo ""
    echo -e "${CYAN}Access the UI:${NC}"
    echo -e "  http://localhost:$port"
    echo ""
    echo -e "${CYAN}API Endpoint:${NC}"
    echo -e "  http://localhost:$port/v1/chat/completions"
    echo ""
    echo -e "${CYAN}View logs:${NC}"
    if systemctl is-enabled bifrost-http &>/dev/null; then
        echo -e "  sudo journalctl -u bifrost-http -f"
    else
        echo -e "  Check logs in: $DEFAULT_WORK_DIR/logs/"
    fi
    echo ""
}

# =============================================================================
# Main
# =============================================================================
main() {
    parse_args "$@"
    
    echo -e "${BLUE}"
    echo "╔═══════════════════════════════════════════════════════╗"
    echo "║        Bifrost AI Gateway - Build & Deploy            ║"
    echo "╚═══════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    get_version
    
    # Step 0: Detect existing service and deployment directory
    detect_existing_service
    
    log_info "Target Directory: $TARGET_DIR"
    echo ""

    # Step 1: Stop existing instances
    stop_existing
    
    # Step 2: Check prerequisites
    check_prerequisites
    
    # Step 3: Build UI
    build_ui
    
    # Step 4: Build Go binary
    build_binary
    
    # Step 5: Deploy
    deploy
    
    # Step 6: Create systemd service and start
    create_systemd_service
    start_service
    
    # Step 7: Print summary
    print_summary
}

main "$@"
