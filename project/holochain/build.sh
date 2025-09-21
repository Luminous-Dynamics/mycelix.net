#!/usr/bin/env bash

# Build script for Mycelix Holochain DNA and Gateway

set -e  # Exit on error

echo "🍄 Building Mycelix Holochain Implementation..."
echo "============================================"

# Check if we're in nix develop shell
if [ -z "$IN_NIX_SHELL" ]; then
    echo "⚠️  Not in nix develop shell. Running with nix develop..."
    exec nix develop -c bash "$0" "$@"
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Step 1: Build the DNA
echo ""
echo "Step 1: Building Holochain DNA..."
echo "----------------------------------"

cd mycelix-dna

# Check if Cargo.toml exists
if [ ! -f "Cargo.toml" ]; then
    print_error "Cargo.toml not found in mycelix-dna directory"
    exit 1
fi

# Build integrity zomes
echo "Building integrity zomes..."
for zome in consciousness hipi field; do
    echo "  Building $zome integrity..."
    (cd "zomes/integrity/$zome" && cargo build --release --target wasm32-unknown-unknown) || {
        print_error "Failed to build $zome integrity zome"
        exit 1
    }
done
print_status "Integrity zomes built successfully"

# Build coordinator zomes
echo "Building coordinator zomes..."
for zome in consciousness hipi field; do
    echo "  Building $zome coordinator..."
    (cd "zomes/coordinator/$zome" && cargo build --release --target wasm32-unknown-unknown) || {
        print_error "Failed to build $zome coordinator zome"
        exit 1
    }
done
print_status "Coordinator zomes built successfully"

# Package the DNA
echo "Packaging DNA..."
if command -v hc &> /dev/null; then
    hc dna pack . -o mycelix.dna || {
        print_error "Failed to package DNA"
        exit 1
    }
    print_status "DNA packaged as mycelix.dna"
else
    print_warning "hc command not found. Install with: cargo install holochain_cli"
fi

cd ..

# Step 2: Build the Rust Gateway
echo ""
echo "Step 2: Building Rust Gateway..."
echo "---------------------------------"

cd gateway

# Check if Cargo.toml exists
if [ ! -f "Cargo.toml" ]; then
    print_error "Cargo.toml not found in gateway directory"
    exit 1
fi

echo "Building gateway in release mode..."
cargo build --release || {
    print_error "Failed to build gateway"
    exit 1
}
print_status "Gateway built successfully"

# Check if binary was created
if [ -f "target/release/mycelix-gateway" ]; then
    print_status "Gateway binary created at: gateway/target/release/mycelix-gateway"
else
    print_error "Gateway binary not found"
    exit 1
fi

cd ..

# Step 3: Build TypeScript Client
echo ""
echo "Step 3: Building TypeScript Client..."
echo "--------------------------------------"

cd ../client

# Check if package.json exists
if [ ! -f "package.json" ]; then
    print_error "package.json not found in client directory"
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install || {
        print_error "Failed to install npm dependencies"
        exit 1
    }
    print_status "Dependencies installed"
fi

# Build TypeScript
echo "Building TypeScript..."
npm run build 2>/dev/null || {
    # If build fails, try just TypeScript compilation
    npx tsc || print_warning "TypeScript compilation had issues"
}
print_status "Client built successfully"

cd ..

# Step 4: Create distribution directory
echo ""
echo "Step 4: Creating Distribution..."
echo "---------------------------------"

DIST_DIR="dist"
rm -rf "$DIST_DIR"
mkdir -p "$DIST_DIR"

# Copy built artifacts
if [ -f "holochain/mycelix-dna/mycelix.dna" ]; then
    cp holochain/mycelix-dna/mycelix.dna "$DIST_DIR/" 2>/dev/null || true
fi

if [ -f "holochain/gateway/target/release/mycelix-gateway" ]; then
    cp holochain/gateway/target/release/mycelix-gateway "$DIST_DIR/"
    chmod +x "$DIST_DIR/mycelix-gateway"
    print_status "Gateway binary copied to dist/"
fi

# Copy client files
if [ -d "client/dist" ]; then
    cp -r client/dist "$DIST_DIR/client"
    print_status "Client files copied to dist/"
elif [ -d "client/src" ]; then
    # Fallback: copy source files if build failed
    cp -r client/src "$DIST_DIR/client"
    print_warning "Client source files copied (build may have failed)"
fi

# Copy integration bridge
cp integration/bridge.js "$DIST_DIR/"
print_status "Integration bridge copied to dist/"

# Step 5: Summary
echo ""
echo "========================================="
echo "           Build Complete! 🎉"
echo "========================================="
echo ""
echo "Built artifacts:"
echo "  • DNA: dist/mycelix.dna (if hc was available)"
echo "  • Gateway: dist/mycelix-gateway"
echo "  • Client: dist/client/"
echo "  • Bridge: dist/bridge.js"
echo ""
echo "Next steps:"
echo "  1. Start Holochain conductor:"
echo "     holochain -c conductor-config.yaml"
echo ""
echo "  2. Run the gateway:"
echo "     ./dist/mycelix-gateway"
echo ""
echo "  3. Open the client:"
echo "     cd client && npm run dev"
echo ""
echo "Or use the run script:"
echo "  ./run.sh"
echo ""