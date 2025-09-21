#!/bin/bash
# Setup Latest Holonix development environment for Mycelix Consciousness Network
# Version: 2025-09-18 - Using Holochain 0.6.0-dev.22 (latest)

set -e  # Exit on error

echo "🚀 Mycelix P2P Consciousness Network - Latest Holonix Setup"
echo "==========================================================="
echo ""
echo "📦 This will install:"
echo "  • Holonix with Holochain 0.6.0-dev.22 (latest bleeding edge)"
echo "  • HDK (Holochain Development Kit) for Rust"
echo "  • hc CLI tools for scaffolding and management"
echo "  • lair-keystore for secure key management"
echo "  • Reproducible environment via Nix flakes"
echo ""

# Check if we're already in a nix shell
if [ -n "$IN_NIX_SHELL" ]; then
    echo "⚠️  Already in a Nix shell. Please exit first (type 'exit') then run this script."
    exit 1
fi

# Kill old conductor if running
echo "🛑 Stopping any existing Holochain processes..."
pkill -f "holochain" 2>/dev/null || true
sleep 1

# Clean up old conductor data if exists
if [ -d "./conductor-data" ]; then
    echo "🧹 Cleaning old conductor data..."
    rm -rf ./conductor-data
fi

# Update flake lock to get absolute latest
echo ""
echo "🔄 Updating flake.lock to latest Holonix..."
nix flake update --extra-experimental-features 'nix-command flakes' 2>&1 | tee holonix-update.log

echo ""
echo "📥 Downloading Holonix environment..."
echo "  ⏱️  This may take 10-20 minutes on first run"
echo "  💡 Tip: Using a faster mirror can help with download speed"
echo ""

# Create a retry wrapper for network issues
MAX_RETRIES=3
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    echo "  Attempt $((RETRY_COUNT + 1)) of $MAX_RETRIES..."
    
    if nix develop --extra-experimental-features 'nix-command flakes' --impure --command bash -c '
        echo ""
        echo "✅ Holonix Environment Successfully Activated!"
        echo "=============================================="
        echo ""
        echo "🔍 Installed Versions:"
        echo "  • Holochain: $(holochain --version 2>/dev/null || echo "Not available")"
        echo "  • hc CLI: $(hc --version 2>/dev/null || echo "Not available")"
        echo "  • lair-keystore: $(lair-keystore --version 2>/dev/null || echo "Not available")"
        echo "  • cargo: $(cargo --version)"
        echo ""
        
        # Create a proper conductor config for 0.6.x
        echo "📝 Creating Holochain 0.6.x conductor config..."
        cat > conductor-config.yaml << EOF
---
environment_path: ./conductor-data
use_dangerous_test_keystore: true

admin_interfaces:
  - driver:
      type: websocket
      port: 4444

network:
  bootstrap_service: https://bootstrap.holo.host
  transport_pool:
    - type: webrtc
      signal_url: wss://signal.holo.host
EOF

        echo "✨ Configuration created!"
        echo ""
        echo "📚 Quick Start Commands:"
        echo ""
        echo "  1. Enter development shell:"
        echo "     nix develop"
        echo ""
        echo "  2. Generate a test environment:"
        echo "     hc sandbox generate workdir"
        echo "     cd workdir"
        echo ""
        echo "  3. Create your consciousness hApp:"
        echo "     hc scaffold dna consciousness"
        echo "     hc scaffold zome consciousness_identity"
        echo ""
        echo "  4. Start the conductor:"
        echo "     hc sandbox run"
        echo ""
        echo "💡 Documentation:"
        echo "  • Holochain Docs: https://developer.holochain.org"
        echo "  • HDK Reference: https://docs.rs/hdk/latest"
        echo "  • Join Discord: https://discord.gg/holochain"
        echo ""
    '; then
        echo ""
        echo "🎉 Setup Complete! Holonix is ready."
        echo ""
        echo "🌊 Next Step: Enter the development environment with:"
        echo "   nix develop"
        echo ""
        exit 0
    else
        RETRY_COUNT=$((RETRY_COUNT + 1))
        if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
            echo "  ⚠️  Download failed. Retrying in 10 seconds..."
            echo "  💡 If you see network errors, try:"
            echo "     - Checking your internet connection"
            echo "     - Using a different DNS (8.8.8.8)"
            echo "     - Configuring a faster Nix cache"
            sleep 10
        else
            echo ""
            echo "❌ Failed to set up Holonix after $MAX_RETRIES attempts."
            echo ""
            echo "🔧 Troubleshooting:"
            echo "  1. Check network: ping -c 3 github.com"
            echo "  2. Check DNS: nslookup cache.nixos.org"
            echo "  3. Try manual setup: nix develop --show-trace"
            echo "  4. Check logs: cat holonix-update.log"
            echo ""
            echo "📚 Alternative: Use stable version instead:"
            echo "  - Edit flake.nix"
            echo "  - Comment out: holonix.url = \"github:holochain/holonix/main\""
            echo "  - Uncomment: holonix.url = \"github:holochain/holonix/main-0.5\""
            echo "  - Run this script again"
            exit 1
        fi
    fi
done