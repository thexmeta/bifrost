#!/bin/bash
set -euo pipefail

# =============================================================================
# Bifrost AI Gateway - Debian x64 Release Build Script
# =============================================================================
# Creates a statically linked Linux amd64 binary and installs it system-wide
# =============================================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

VERSION="${VERSION:-$(git describe --tags --always --dirty 2>/dev/null || echo 'dev-build')}"
BINARY_NAME="bifrost-http"
INSTALL_DIR="/usr/local/bin"
DATA_DIR="/var/lib/bifrost"
CONFIG_DIR="/etc/bifrost"
SERVICE_FILE="/etc/systemd/system/bifrost-http.service"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

log_info()    { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error()   { echo -e "${RED}[ERROR]${NC} $1"; }

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

    GO_VERSION=$(go version | grep -oP 'go\K[0-9]+\.[0-9]+')
    log_info "Go version: $(go version)"

    # Check for required build tools
    for cmd in gcc make; do
        if ! command -v "$cmd" &>/dev/null; then
            log_error "$cmd is not installed"
            exit 1
        fi
    done

    # Check for UI dependencies
    if ! command -v node &>/dev/null; then
        log_error "Node.js is not installed or not in PATH"
        exit 1
    fi
    if ! command -v npm &>/dev/null; then
        log_error "npm is not installed or not in PATH"
        exit 1
    fi

    log_success "All prerequisites met"
}

# =============================================================================
# Build UI
# =============================================================================
build_ui() {
    log_info "Building UI..."

    cd "$PROJECT_DIR/ui"

    # Install dependencies
    log_info "Installing UI dependencies..."
    npm ci --prefer-offline

    # Build Next.js frontend (skip ESLint checks for release build)
    log_info "Building Next.js frontend (ESLint disabled for release build)..."
    npx next build --no-lint

    # Fix paths for static export
    node scripts/fix-paths.js

    log_success "UI build complete"
}

# =============================================================================
# Build Go Binary
# =============================================================================
build_binary() {
    log_info "Building bifrost-http binary for Linux amd64 (static)..."

    cd "$PROJECT_DIR/transports/bifrost-http"

    # Create tmp directory
    mkdir -p "$PROJECT_DIR/tmp"

    # Build with static linking
    CGO_ENABLED=1 \
    GOOS=linux \
    GOARCH=amd64 \
    GOWORK=off \
    go build \
        -ldflags="-w -s -extldflags '-static' -X main.Version=v${VERSION}" \
        -a \
        -trimpath \
        -tags "sqlite_static" \
        -o "$PROJECT_DIR/tmp/bifrost-http" \
        .

    # Verify binary
    if [ ! -f "$PROJECT_DIR/tmp/bifrost-http" ]; then
        log_error "Build failed - binary not found"
        exit 1
    fi

    # Show binary info
    log_info "Binary size: $(du -h "$PROJECT_DIR/tmp/bifrost-http" | cut -f1)"
    log_info "Binary type: $(file "$PROJECT_DIR/tmp/bifrost-http")"

    log_success "Build complete: tmp/bifrost-http (v${VERSION})"
}

# =============================================================================
# Install System-Wide
# =============================================================================
install_binary() {
    log_info "Installing bifrost-http system-wide..."

    # Check for root/sudo
    if [ "$EUID" -ne 0 ]; then
        log_error "Installation requires root privileges"
        echo "Run with: sudo $0 install"
        exit 1
    fi

    # Create directories
    mkdir -p "$INSTALL_DIR"
    mkdir -p "$DATA_DIR/logs"
    mkdir -p "$CONFIG_DIR"

    # Install binary
    cp "$PROJECT_DIR/tmp/bifrost-http" "$INSTALL_DIR/$BINARY_NAME"
    chmod 755 "$INSTALL_DIR/$BINARY_NAME"

    log_success "Binary installed to $INSTALL_DIR/$BINARY_NAME"

    # Install default config if not exists
    if [ ! -f "$CONFIG_DIR/config.json" ]; then
        if [ -f "$PROJECT_DIR/config.json" ]; then
            cp "$PROJECT_DIR/config.json" "$CONFIG_DIR/config.json"
            log_info "Default config installed to $CONFIG_DIR/config.json"
        fi
    fi
}

# =============================================================================
# Create systemd Service
# =============================================================================
create_service() {
    log_info "Creating systemd service..."

    if [ "$EUID" -ne 0 ]; then
        log_warn "Skipping systemd service creation (requires root)"
        echo "Run with: sudo $0 install"
        return
    fi

    cat > "$SERVICE_FILE" <<EOF
[Unit]
Description=Bifrost AI Gateway
Documentation=https://docs.getbifrost.ai
After=network.target

[Service]
Type=simple
ExecStart=$INSTALL_DIR/$BINARY_NAME --host 0.0.0.0 --port 8080 --config $CONFIG_DIR/config.json
WorkingDirectory=$DATA_DIR
Restart=on-failure
RestartSec=5s
StandardOutput=journal
StandardError=journal
SyslogIdentifier=bifrost-http

# Security hardening
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=$DATA_DIR

# Go runtime performance tuning (adjust as needed)
# Environment=GOGC=200
# Environment=GOMEMLIMIT=1800MiB

[Install]
WantedBy=multi-user.target
EOF

    log_success "Systemd service created at $SERVICE_FILE"
    log_info "To enable and start the service:"
    echo -e "  ${CYAN}sudo systemctl daemon-reload${NC}"
    echo -e "  ${CYAN}sudo systemctl enable bifrost-http${NC}"
    echo -e "  ${CYAN}sudo systemctl start bifrost-http${NC}"
}

# =============================================================================
# Create .deb Package (Optional)
# =============================================================================
create_deb_package() {
    log_info "Creating .deb package..."

    if ! command -v dpkg-deb &>/dev/null; then
        log_error "dpkg-deb not found - cannot create .deb package"
        exit 1
    fi

    DEB_DIR=$(mktemp -d)
    DEB_NAME="bifrost-http_${VERSION}_amd64.deb"
    DEB_OUTPUT="$PROJECT_DIR/tmp/$DEB_NAME"

    # Create DEB structure
    mkdir -p "$DEB_DIR/DEBIAN"
    mkdir -p "$DEB_DIR/usr/local/bin"
    mkdir -p "$DEB_DIR/etc/bifrost"
    mkdir -p "$DEB_DIR/var/lib/bifrost/logs"

    # Copy binary
    cp "$PROJECT_DIR/tmp/bifrost-http" "$DEB_DIR/usr/local/bin/bifrost-http"
    chmod 755 "$DEB_DIR/usr/local/bin/bifrost-http"

    # Copy config if exists
    if [ -f "$PROJECT_DIR/config.json" ]; then
        cp "$PROJECT_DIR/config.json" "$DEB_DIR/etc/bifrost/config.json"
        chmod 644 "$DEB_DIR/etc/bifrost/config.json"
    fi

    # Create control file
    cat > "$DEB_DIR/DEBIAN/control" <<EOF
Package: bifrost-http
Version: ${VERSION#v}
Section: net
Priority: optional
Architecture: amd64
Depends: libc6
Maintainer: Maxim <support@getbifrost.ai>
Description: AI Gateway for 20+ LLM providers
 Bifrost is a high-performance AI gateway that unifies 20+ LLM providers
 behind a single OpenAI-compatible API with ~11µs overhead at 5,000 RPS.
EOF

    # Create postinst script
    cat > "$DEB_DIR/DEBIAN/postinst" <<EOF
#!/bin/bash
echo "Bifrost HTTP gateway installed successfully"
echo "Configuration: /etc/bifrost/config.json"
echo "Data directory: /var/lib/bifrost"
echo ""
echo "Start with: bifrost-http --host 0.0.0.0 --port 8080"
echo "Or enable systemd service: systemctl enable --now bifrost-http"
EOF
    chmod 755 "$DEB_DIR/DEBIAN/postinst"

    # Build .deb
    dpkg-deb --build --root-owner-group "$DEB_DIR" "$DEB_OUTPUT"

    # Cleanup
    rm -rf "$DEB_DIR"

    log_success "DEB package created: $DEB_OUTPUT"
    log_info "Install with: sudo dpkg -i $DEB_OUTPUT"
}

# =============================================================================
# Main
# =============================================================================
main() {
    local ACTION="${1:-build}"

    echo -e "${BLUE}"
    echo "╔═══════════════════════════════════════════════════════╗"
    echo "║   Bifrost AI Gateway - Debian x64 Release Builder     ║"
    echo "╚═══════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo "Version: v${VERSION}"
    echo "Action: $ACTION"
    echo ""

    case "$ACTION" in
        build)
            check_prerequisites
            build_ui
            build_binary
            log_success "Build complete! Binary: tmp/bifrost-http"
            log_info "To install system-wide, run: sudo $0 install"
            ;;
        install)
            install_binary
            create_service
            log_success "Installation complete!"
            echo ""
            echo -e "${CYAN}=====================================================${NC}"
            echo -e "${GREEN}Bifrost AI Gateway - Installation Summary${NC}"
            echo -e "${CYAN}=====================================================${NC}"
            echo ""
            echo -e "Binary:         ${YELLOW}/usr/local/bin/bifrost-http${NC}"
            echo -e "Config:         ${YELLOW}/etc/bifrost/config.json${NC}"
            echo -e "Data Dir:       ${YELLOW}/var/lib/bifrost/${NC}"
            echo -e "Service:        ${YELLOW}bifrost-http.service${NC}"
            echo ""
            echo -e "${CYAN}Next Steps:${NC}"
            echo ""
            echo -e "1. Edit config.json to match your setup:"
            echo -e "   ${CYAN}sudo nano /etc/bifrost/config.json${NC}"
            echo ""
            echo -e "2. If using semantic caching, ensure vector store is running:"
            echo -e "   - Qdrant: ${YELLOW}localhost:6334${NC}"
            echo -e "   - Weaviate: ${YELLOW}localhost:8080${NC}"
            echo -e "   - Or disable caching in config.json${NC}"
            echo ""
            echo -e "3. Start the service:"
            echo -e "   ${CYAN}sudo systemctl daemon-reload${NC}"
            echo -e "   ${CYAN}sudo systemctl restart bifrost-http${NC}"
            echo ""
            echo -e "4. Check status:"
            echo -e "   ${CYAN}sudo systemctl status bifrost-http${NC}"
            echo -e "   ${CYAN}curl http://localhost:8080/health${NC}"
            echo ""
            echo -e "5. View logs:"
            echo -e "   ${CYAN}sudo journalctl -u bifrost-http -f${NC}"
            echo ""
            echo -e "${CYAN}Access the UI:${NC}"
            echo -e "   http://localhost:8080"
            echo ""
            echo -e "${CYAN}API Endpoint:${NC}"
            echo -e "   http://localhost:8080/v1/chat/completions"
            echo ""
            ;;
        deb)
            check_prerequisites
            build_ui
            build_binary
            create_deb_package
            ;;
        all)
            check_prerequisites
            build_ui
            build_binary
            install_binary
            create_service
            log_success "Build and installation complete!"
            echo -e "${CYAN}Start service: sudo systemctl enable --now bifrost-http${NC}"
            echo -e "${CYAN}Check status: sudo systemctl status bifrost-http${NC}"
            ;;
        *)
            echo "Usage: $0 {build|install|deb|all}"
            echo ""
            echo "Actions:"
            echo "  build   - Build UI and binary (default)"
            echo "  install - Install binary system-wide (requires sudo)"
            echo "  deb     - Build UI, binary, and create .deb package"
            echo "  all     - Build, install, and create systemd service"
            exit 1
            ;;
    esac
}

main "$@"
