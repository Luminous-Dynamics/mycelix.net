#!/bin/bash
# Setup Holonix development environment for Mycelix Consciousness Network

echo "🌊 Setting up Holonix for Mycelix P2P Consciousness Network"
echo "========================================================="
echo ""
echo "📦 This will provide:"
echo "  • Holochain 0.5.x stable (latest production-ready)"
echo "  • hc CLI tools for app development"
echo "  • lair-keystore for secure key management"
echo "  • Reproducible environment via Nix flakes"
echo ""

# Kill old conductor if running
echo "🛑 Stopping old conductor..."
pkill -f "holochain --config-path" 2>/dev/null || true

echo ""
echo "🔧 Entering Holonix development shell..."
echo "  This may take 5-10 minutes on first run to download dependencies"
echo ""

# Use nix develop with our flake
nix develop --impure -c bash -c '
echo ""
echo "✅ Holonix Environment Active!"
echo "================================"
echo ""
echo "🔍 Checking versions:"
echo "  Holochain: $(holochain --version)"
echo "  hc CLI: $(hc --version)"
echo "  lair-keystore: $(lair-keystore --version)"
echo ""

# Create proper conductor config for 0.5.x
echo "📝 Creating Holochain 0.5.x conductor config..."
cat > conductor-0.5.yaml << EOF
---
data_root_path: ./conductor-data
keystore:
  type: danger_test_keystore

admin_interfaces:
  - driver:
      type: websocket
      port: 4444
    allowed_origins: "*"

network:
  network_type: quic_bootstrap
  bootstrap_service: https://bootstrap.holo.host
  transport_pool:
    - type: webrtc
      signal_url: ws://signal.holo.host/webrtc
EOF

echo "🚀 Starting Holochain conductor..."
holochain --config-path conductor-0.5.yaml &

echo ""
echo "⏳ Waiting for conductor to start..."
sleep 3

echo ""
echo "✨ Holonix environment ready!"
echo ""
echo "📚 Next steps:"
echo "  1. Use '\''hc sandbox generate'\'' to create a test environment"
echo "  2. Use '\''hc app create mycelix-consciousness'\'' to create the hApp"
echo "  3. Implement consciousness zomes in Rust"
echo "  4. Deploy with hx402 payment protocol"
echo ""
echo "💡 Pro tip: Keep this shell open for all Holochain development!"
'