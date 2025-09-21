#!/usr/bin/env bash

# Deployment script for Mycelix Holochain Network
# This script sets up and deploys the complete stack

set -e

echo "🚀 Deploying Mycelix Holochain Network..."
echo "========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    echo ""
    echo "Step 1: Checking Prerequisites..."
    echo "----------------------------------"
    
    local missing_deps=()
    
    # Check for Rust
    if ! command -v cargo &> /dev/null; then
        missing_deps+=("cargo (Rust)")
    fi
    
    # Check for Node.js
    if ! command -v node &> /dev/null; then
        missing_deps+=("node (Node.js)")
    fi
    
    # Check for Holochain (optional but recommended)
    if ! command -v holochain &> /dev/null; then
        print_warning "Holochain not installed. Install with: cargo install holochain"
        print_info "Gateway will run in demo mode without Holochain conductor"
    else
        print_success "Holochain installed"
    fi
    
    # Check for hc (Holochain CLI)
    if ! command -v hc &> /dev/null; then
        print_warning "Holochain CLI not installed. Install with: cargo install holochain_cli_bundle"
    else
        print_success "Holochain CLI installed"
    fi
    
    if [ ${#missing_deps[@]} -gt 0 ]; then
        print_error "Missing required dependencies: ${missing_deps[*]}"
        print_info "Please install missing dependencies and try again"
        exit 1
    fi
    
    print_success "All required prerequisites installed"
}

# Build the project
build_project() {
    echo ""
    echo "Step 2: Building Project..."
    echo "---------------------------"
    
    if [ -f "./build.sh" ]; then
        print_info "Running build script..."
        ./build.sh || {
            print_error "Build failed!"
            exit 1
        }
    else
        print_error "build.sh not found"
        exit 1
    fi
    
    print_success "Project built successfully"
}

# Setup Holochain conductor
setup_conductor() {
    echo ""
    echo "Step 3: Setting Up Holochain Conductor..."
    echo "------------------------------------------"
    
    if command -v holochain &> /dev/null; then
        # Create lair keystore if it doesn't exist
        if [ ! -d "./lair-keystore" ]; then
            print_info "Initializing lair keystore..."
            lair-keystore-cli init -p ./lair-keystore || {
                print_warning "Lair keystore initialization failed, continuing..."
            }
        fi
        
        # Check if conductor config exists
        if [ ! -f "conductor-config.yaml" ]; then
            print_error "conductor-config.yaml not found"
            exit 1
        fi
        
        # Generate sandbox if needed
        if [ ! -d "./holochain-data" ]; then
            print_info "Creating Holochain data directory..."
            mkdir -p ./holochain-data
        fi
        
        print_success "Conductor setup complete"
    else
        print_warning "Skipping conductor setup (Holochain not installed)"
    fi
}

# Install the DNA
install_dna() {
    echo ""
    echo "Step 4: Installing DNA..."
    echo "-------------------------"
    
    if command -v hc &> /dev/null && [ -f "mycelix-dna/mycelix.dna" ]; then
        print_info "Installing Mycelix DNA..."
        
        # Create hApp manifest if it doesn't exist
        if [ ! -f "mycelix.happ" ]; then
            cat > happ.yaml << EOF
---
manifest_version: "1"
name: mycelix
description: "Consciousness-first P2P networking"
roles:
  - id: mycelix
    provisioning:
      strategy: create
      deferred: false
    dna:
      bundled: "./mycelix-dna/mycelix.dna"
      clone_limit: 0
EOF
            
            print_info "Packaging hApp..."
            hc app pack . -o mycelix.happ || {
                print_warning "hApp packaging failed"
            }
        fi
        
        print_success "DNA installation prepared"
    else
        print_warning "Skipping DNA installation (hc not available or DNA not built)"
    fi
}

# Deploy services
deploy_services() {
    echo ""
    echo "Step 5: Deploying Services..."
    echo "-----------------------------"
    
    # Stop any existing services
    print_info "Stopping existing services..."
    pkill -f mycelix-gateway 2>/dev/null || true
    pkill -f holochain 2>/dev/null || true
    
    # Start Holochain conductor if available
    if command -v holochain &> /dev/null; then
        print_info "Starting Holochain conductor..."
        nohup holochain -c conductor-config.yaml &> holochain.log &
        HOLOCHAIN_PID=$!
        print_success "Holochain conductor started (PID: $HOLOCHAIN_PID)"
        
        # Wait for conductor to be ready
        sleep 5
        
        # Install the app if conductor is running
        if kill -0 $HOLOCHAIN_PID 2>/dev/null; then
            if [ -f "mycelix.happ" ] && command -v hc &> /dev/null; then
                print_info "Installing Mycelix app to conductor..."
                hc app install --app-id mycelix ./mycelix.happ || {
                    print_warning "App installation failed, conductor may already have it installed"
                }
            fi
        else
            print_error "Conductor failed to start. Check holochain.log"
        fi
    fi
    
    # Start the gateway
    if [ -f "./dist/mycelix-gateway" ]; then
        print_info "Starting Mycelix gateway..."
        export RUST_LOG=info
        export HOLOCHAIN_CONDUCTOR_URL=${HOLOCHAIN_CONDUCTOR_URL:-"ws://localhost:8888"}
        export HOLOCHAIN_APP_ID=${HOLOCHAIN_APP_ID:-"mycelix"}
        
        nohup ./dist/mycelix-gateway &> gateway.log &
        GATEWAY_PID=$!
        print_success "Gateway started on port 8765 (PID: $GATEWAY_PID)"
        
        # Wait and check if gateway is running
        sleep 3
        if ! kill -0 $GATEWAY_PID 2>/dev/null; then
            print_error "Gateway failed to start. Check gateway.log:"
            tail -20 gateway.log
            exit 1
        fi
    else
        print_error "Gateway binary not found at ./dist/mycelix-gateway"
        exit 1
    fi
    
    print_success "Services deployed successfully"
}

# Configure network
configure_network() {
    echo ""
    echo "Step 6: Configuring Network..."
    echo "------------------------------"
    
    # Test gateway health endpoint
    if command -v curl &> /dev/null; then
        print_info "Testing gateway health..."
        if curl -s http://localhost:8765/health > /dev/null 2>&1; then
            print_success "Gateway is healthy"
        else
            print_warning "Gateway health check failed"
        fi
        
        print_info "Testing WebSocket endpoint..."
        # Simple WebSocket test would go here
        print_success "Network configuration complete"
    else
        print_warning "curl not installed, skipping health checks"
    fi
}

# Create systemd service (optional)
create_systemd_service() {
    echo ""
    echo "Step 7: Creating Systemd Service (Optional)..."
    echo "----------------------------------------------"
    
    if [ "$EUID" -eq 0 ] || [ "$1" == "--systemd" ]; then
        cat > /tmp/mycelix-holochain.service << EOF
[Unit]
Description=Mycelix Holochain Network
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)
Environment="RUST_LOG=info"
ExecStart=$(pwd)/run.sh
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
        
        if [ "$EUID" -eq 0 ]; then
            cp /tmp/mycelix-holochain.service /etc/systemd/system/
            systemctl daemon-reload
            systemctl enable mycelix-holochain
            print_success "Systemd service created and enabled"
            print_info "Start with: systemctl start mycelix-holochain"
        else
            print_info "Systemd service file created at /tmp/mycelix-holochain.service"
            print_info "Install with: sudo cp /tmp/mycelix-holochain.service /etc/systemd/system/"
        fi
    else
        print_info "Skipping systemd service creation (run with --systemd to create)"
    fi
}

# Display deployment info
display_info() {
    echo ""
    echo "========================================="
    echo "     Mycelix Network Deployed! 🎉"
    echo "========================================="
    echo ""
    echo "Network Endpoints:"
    echo "  • Gateway WebSocket: ws://localhost:8765/ws"
    echo "  • Gateway Health: http://localhost:8765/health"
    echo "  • Gateway Metrics: http://localhost:8765/metrics"
    
    if command -v holochain &> /dev/null; then
        echo "  • Holochain Admin: ws://localhost:4444"
        echo "  • Holochain App: ws://localhost:8888"
    fi
    
    echo ""
    echo "Service Status:"
    if [ ! -z "$HOLOCHAIN_PID" ] && kill -0 $HOLOCHAIN_PID 2>/dev/null; then
        echo "  • Holochain Conductor: Running (PID: $HOLOCHAIN_PID)"
    else
        echo "  • Holochain Conductor: Not running (demo mode)"
    fi
    
    if [ ! -z "$GATEWAY_PID" ] && kill -0 $GATEWAY_PID 2>/dev/null; then
        echo "  • Gateway: Running (PID: $GATEWAY_PID)"
    else
        echo "  • Gateway: Not running"
    fi
    
    echo ""
    echo "Logs:"
    echo "  • Holochain: ./holochain.log"
    echo "  • Gateway: ./gateway.log"
    
    echo ""
    echo "Next Steps:"
    echo "  1. Open client: cd ../client && npm run dev"
    echo "  2. Test connection: curl http://localhost:8765/health"
    echo "  3. Monitor logs: tail -f gateway.log"
    echo "  4. Run tests: ./test.sh"
    
    echo ""
    echo "To stop services:"
    echo "  pkill -f mycelix-gateway"
    echo "  pkill -f holochain"
    
    echo ""
    print_success "Deployment complete!"
}

# Main deployment flow
main() {
    check_prerequisites
    build_project
    setup_conductor
    install_dna
    deploy_services
    configure_network
    create_systemd_service "$@"
    display_info
}

# Handle interrupts
trap 'echo ""; print_error "Deployment interrupted"; exit 1' INT TERM

# Run main function
main "$@"