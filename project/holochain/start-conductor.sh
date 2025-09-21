#!/usr/bin/env bash

# Start Real Holochain Conductor
set -e

echo "🧬 Starting Holochain Conductor"
echo "==============================="
echo ""

# Add cargo bin to PATH
export PATH="$HOME/.cargo/bin:$PATH"

# Check if holochain is installed
if ! command -v holochain &> /dev/null; then
    echo "❌ Holochain not found"
    echo "Please run the installation first"
    exit 1
fi

echo "✅ Using Holochain $(holochain --version)"
echo ""

# Initialize lair keystore if needed
if [ ! -f "$HOME/.lair/lair-keystore-config.yaml" ]; then
    echo "Initializing Lair keystore..."
    echo "password123" | lair-keystore init -p 2>/dev/null || true
fi

# Start lair in the background
echo "Starting Lair keystore..."
echo "password123" | lair-keystore -p > lair.log 2>&1 &
LAIR_PID=$!
echo "Lair running with PID: $LAIR_PID"

# Get the lair connection URL
sleep 2
LAIR_URL=$(grep "connectionUrl" lair.log | cut -d'"' -f4 || echo "")

if [ -z "$LAIR_URL" ]; then
    echo "⚠️  Could not get Lair URL, using default"
    LAIR_URL="unix:///tmp/lair-keystore/socket?k=dummy"
fi

echo "Lair URL: $LAIR_URL"

# Update conductor config with lair URL
cat > conductor-config.yaml << EOF
---
environment_path: conductor-data
keystore:
  type: lair_server
  connection_url: "$LAIR_URL"

admin_interfaces:
  - driver:
      type: websocket
      port: 4444

app_interfaces:
  - driver:
      type: websocket
      port: 4445

network:
  bootstrap_service: https://bootstrap.holo.host
  transport_pool:
    - type: webrtc
EOF

echo ""
echo "Starting Holochain conductor..."
echo "Admin WebSocket: ws://localhost:4444"
echo "App WebSocket: ws://localhost:4445"
echo ""

# Start conductor
holochain --config-path conductor-config.yaml &
CONDUCTOR_PID=$!

echo "Conductor running with PID: $CONDUCTOR_PID"
echo ""
echo "To stop:"
echo "  kill $CONDUCTOR_PID $LAIR_PID"
echo ""
echo "To install the HIPI app:"
echo "  hc app install mycelix.dna"
echo ""
echo "Conductor logs will appear below..."
echo "=================================="

# Keep running and show logs
wait $CONDUCTOR_PID