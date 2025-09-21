#!/usr/bin/env bash

# Install Holochain from pre-built binaries
set -e

echo "🧬 Installing Holochain from Binary Releases"
echo "============================================"
echo ""

# Create local bin directory
mkdir -p ./bin

# Check latest releases
echo "Checking available Holochain releases..."

# Download holochain binary directly
HOLOCHAIN_VERSION="holochain-0.2.6"
PLATFORM="x86_64-unknown-linux-gnu"

echo "Downloading Holochain ${HOLOCHAIN_VERSION}..."

# Try downloading from crates.io builds or GitHub releases
if [ ! -f "./bin/holochain" ]; then
    echo "Attempting to download pre-built holochain..."
    
    # Option 1: Try GitHub releases
    curl -L -o holochain.tar.gz \
        "https://github.com/holochain/holochain/releases/download/${HOLOCHAIN_VERSION}/${HOLOCHAIN_VERSION}-${PLATFORM}.tar.gz" 2>/dev/null || true
    
    if [ -f holochain.tar.gz ] && [ -s holochain.tar.gz ]; then
        tar -xzf holochain.tar.gz -C ./bin/
        rm holochain.tar.gz
        echo "✅ Downloaded from GitHub releases"
    else
        echo "GitHub release not available"
        rm -f holochain.tar.gz
        
        # Option 2: Build minimal version locally
        echo "Building minimal Holochain mock for development..."
        
        # Create a mock holochain executable for testing
        cat > ./bin/holochain << 'EOF'
#!/usr/bin/env bash
echo "Holochain Mock v0.2.6 (Development)"
echo "This is a mock for testing the gateway integration"

case "$1" in
    --version)
        echo "holochain 0.2.6-mock"
        ;;
    --help)
        echo "Mock Holochain conductor for development"
        echo "Usage: holochain [OPTIONS]"
        echo "Options:"
        echo "  --version    Show version"
        echo "  --help       Show this help"
        echo "  -c, --config Config file path"
        ;;
    -c|--config)
        echo "Starting mock conductor with config: $2"
        echo "WebSocket API available at: ws://localhost:4445"
        echo "Admin API available at: ws://localhost:4444"
        # Start the actual mock conductor
        node "$(dirname "$0")/../mock-conductor.js" &
        ;;
    *)
        echo "Mock conductor ready. Use --config to start."
        ;;
esac
EOF
        chmod +x ./bin/holochain
        echo "✅ Created development mock"
    fi
fi

# Create hc CLI tool
if [ ! -f "./bin/hc" ]; then
    cat > ./bin/hc << 'EOF'
#!/usr/bin/env bash
echo "Holochain CLI (hc) v0.2.6-mock"

case "$1" in
    --version)
        echo "hc 0.2.6-mock"
        ;;
    dna)
        case "$2" in
            pack)
                echo "Packing DNA (mock)..."
                echo "✅ Created mycelix.dna"
                touch mycelix.dna
                ;;
            *)
                echo "DNA commands: pack, unpack"
                ;;
        esac
        ;;
    app)
        case "$2" in
            install)
                echo "Installing app (mock)..."
                echo "✅ App installed with ID: mycelix"
                ;;
            *)
                echo "App commands: install, uninstall, list"
                ;;
        esac
        ;;
    *)
        echo "Available commands: dna, app, sandbox"
        ;;
esac
EOF
    chmod +x ./bin/hc
fi

echo ""
echo "✅ Installation complete!"
echo ""
echo "Binaries installed to ./bin/:"
ls -la ./bin/
echo ""
echo "To use these tools:"
echo "  export PATH=\"\$PWD/bin:\$PATH\""
echo "  holochain --version"
echo "  hc --version"
echo ""
echo "While we don't have the full Holochain yet, we can:"
echo "1. Use the mock conductor for testing the gateway"
echo "2. Develop the HIPI zome code"
echo "3. Test the integration patterns"
echo ""
echo "Next step: Let's compile the HIPI zome to WASM!"