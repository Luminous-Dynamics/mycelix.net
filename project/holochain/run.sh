#!/usr/bin/env bash

# Run script for Mycelix Holochain Network

set -e

echo "🍄 Starting Mycelix Network..."
echo "=============================="

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

# Cleanup function
cleanup() {
    echo ""
    print_info "Shutting down services..."
    
    # Kill background processes
    jobs -p | xargs -r kill 2>/dev/null || true
    
    # Kill specific processes if they're still running
    pkill -f mycelix-gateway 2>/dev/null || true
    pkill -f holochain 2>/dev/null || true
    
    print_success "Services stopped"
    exit 0
}

# Set up trap for cleanup on exit
trap cleanup EXIT INT TERM

# Check if build exists
if [ ! -f "dist/mycelix-gateway" ]; then
    print_warning "Gateway not found. Building first..."
    ./build.sh || {
        print_error "Build failed!"
        exit 1
    }
fi

# Step 1: Start Holochain Conductor (if available)
if command -v holochain &> /dev/null; then
    echo ""
    print_info "Starting Holochain Conductor..."
    
    # Create conductor config if it doesn't exist
    if [ ! -f "conductor-config.yaml" ]; then
        cat > conductor-config.yaml << EOF
---
data_root_path: ./holochain-data
keystore:
  type: lair_server
  connection_url: ~
dpki: ~
network:
  transport_pool:
    - type: quic
  bootstrap_service: https://bootstrap.holo.host
  tuning_params:
    gossip_strategy: sharded
    gossip_loop_iteration_delay_ms: 100
    gossip_outbound_target_mbps: 1.0
    gossip_inbound_target_mbps: 1.0
    gossip_historic_outbound_target_mbps: 0.5
    gossip_historic_inbound_target_mbps: 0.5

admin_interfaces:
  - driver:
      type: websocket
      port: 0
EOF
        print_success "Created conductor-config.yaml"
    fi
    
    # Start conductor in background
    holochain -c conductor-config.yaml &> holochain.log &
    HOLOCHAIN_PID=$!
    print_success "Holochain conductor started (PID: $HOLOCHAIN_PID)"
    
    # Wait for conductor to be ready
    sleep 3
else
    print_warning "Holochain not installed. Gateway will run in demo mode."
    print_info "Install with: cargo install holochain"
fi

# Step 2: Start Rust Gateway
echo ""
print_info "Starting Mycelix Gateway..."

# Set environment variables
export RUST_LOG=info
export HOLOCHAIN_CONDUCTOR_URL=${HOLOCHAIN_CONDUCTOR_URL:-"ws://localhost:8888"}
export HOLOCHAIN_APP_ID=${HOLOCHAIN_APP_ID:-"mycelix"}

# Start gateway
./dist/mycelix-gateway &> gateway.log &
GATEWAY_PID=$!
print_success "Gateway started on port 8765 (PID: $GATEWAY_PID)"

# Wait for gateway to be ready
sleep 2

# Check if gateway is running
if ! kill -0 $GATEWAY_PID 2>/dev/null; then
    print_error "Gateway failed to start. Check gateway.log for details"
    tail -20 gateway.log
    exit 1
fi

# Step 3: Start Client Development Server
echo ""
print_info "Starting Client Development Server..."

cd ../client

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    print_info "Installing client dependencies..."
    npm install || {
        print_error "Failed to install dependencies"
        exit 1
    }
fi

# Check if vite is available
if [ -f "node_modules/.bin/vite" ]; then
    print_info "Starting Vite dev server..."
    npm run dev &> ../holochain/client.log &
    CLIENT_PID=$!
    sleep 3
    print_success "Client dev server started (PID: $CLIENT_PID)"
    CLIENT_URL="http://localhost:5173"
else
    # Fallback to simple HTTP server
    print_warning "Vite not found. Using simple HTTP server..."
    python3 -m http.server 3000 &> ../holochain/client.log &
    CLIENT_PID=$!
    print_success "Simple HTTP server started on port 3000 (PID: $CLIENT_PID)"
    CLIENT_URL="http://localhost:3000"
fi

cd ../holochain

# Step 4: Display Status
echo ""
echo "========================================="
echo "       Mycelix Network Running! 🎉"
echo "========================================="
echo ""
echo "Services:"
if [ ! -z "$HOLOCHAIN_PID" ]; then
    echo "  • Holochain Conductor: Running (PID: $HOLOCHAIN_PID)"
fi
echo "  • Gateway: http://localhost:8765 (PID: $GATEWAY_PID)"
echo "  • Client: $CLIENT_URL (PID: $CLIENT_PID)"
echo ""
echo "Logs:"
echo "  • Holochain: holochain.log"
echo "  • Gateway: gateway.log"
echo "  • Client: client.log"
echo ""
echo "WebSocket Endpoints:"
echo "  • Gateway WebSocket: ws://localhost:8765/ws"
echo "  • Metrics: http://localhost:8765/metrics"
echo "  • Health: http://localhost:8765/health"
echo ""
print_info "Press Ctrl+C to stop all services"
echo ""

# Monitor services
while true; do
    # Check if gateway is still running
    if ! kill -0 $GATEWAY_PID 2>/dev/null; then
        print_error "Gateway stopped unexpectedly!"
        tail -20 gateway.log
        exit 1
    fi
    
    # Check if client is still running
    if ! kill -0 $CLIENT_PID 2>/dev/null; then
        print_warning "Client server stopped. Restarting..."
        cd ../client
        npm run dev &> ../holochain/client.log &
        CLIENT_PID=$!
        cd ../holochain
    fi
    
    sleep 5
done