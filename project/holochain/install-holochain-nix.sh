#!/usr/bin/env bash

# Holochain Installation Script for Nix Environment
# Runs Holochain installation in background while allowing development to continue

echo "🌐 Holochain Installation Manager"
echo "================================="
echo ""

# Set up local cargo directories
export CARGO_HOME="$(pwd)/.cargo"
export RUSTUP_HOME="$(pwd)/.rustup"
export PATH="$CARGO_HOME/bin:$PATH"
mkdir -p "$CARGO_HOME" "$RUSTUP_HOME"

# Check if already installed
if [ -f "$CARGO_HOME/bin/holochain" ]; then
    echo "✅ Holochain already installed:"
    $CARGO_HOME/bin/holochain --version 2>/dev/null || echo "  Version unknown"
    exit 0
fi

# Run installation in background
echo "📦 Starting Holochain installation in background..."
echo "  This will take 10-15 minutes. You can continue working."
echo ""

# Create installation script
cat > /tmp/install-holochain-bg.sh << 'EOF'
#!/bin/bash
export CARGO_HOME="$(pwd)/.cargo"
export RUSTUP_HOME="$(pwd)/.rustup"
export PATH="$CARGO_HOME/bin:$PATH"

echo "$(date): Starting Holochain installation..." > holochain-install.log

# Try latest beta version first
cargo install holochain --version 0.3.0-beta-dev.43 --locked >> holochain-install.log 2>&1
if [ $? -eq 0 ]; then
    echo "$(date): ✅ Holochain 0.3.0-beta installed" >> holochain-install.log
else
    # Fall back to stable
    cargo install holochain --version 0.2.6 --locked >> holochain-install.log 2>&1
    if [ $? -eq 0 ]; then
        echo "$(date): ✅ Holochain 0.2.6 installed" >> holochain-install.log
    else
        echo "$(date): ❌ Holochain installation failed" >> holochain-install.log
    fi
fi

# Install CLI tools
cargo install holochain_cli --version 0.3.0-beta-dev.43 --locked >> holochain-install.log 2>&1 || \
cargo install holochain_cli --version 0.2.6 --locked >> holochain-install.log 2>&1

cargo install lair_keystore --version 0.4.4 --locked >> holochain-install.log 2>&1

echo "$(date): Installation complete!" >> holochain-install.log
EOF

chmod +x /tmp/install-holochain-bg.sh

# Start background installation
nohup bash /tmp/install-holochain-bg.sh > /dev/null 2>&1 &
INSTALL_PID=$!

echo "📋 Installation Details:"
echo "  Process ID: $INSTALL_PID"
echo "  Log file: holochain-install.log"
echo ""
echo "📊 Monitor progress with:"
echo "  tail -f holochain-install.log"
echo ""
echo "🚀 While Holochain installs, you can:"
echo "  1. Test the consciousness network without Holochain (demo mode)"
echo "  2. Build the TypeScript components"
echo "  3. Compile the Rust zomes"
echo ""
echo "Run: ./test-without-holochain.sh to test immediately!"