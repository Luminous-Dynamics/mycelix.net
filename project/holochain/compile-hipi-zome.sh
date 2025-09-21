#!/usr/bin/env bash

# Compile HIPI Zome with Real Holochain
set -e

echo "🧬 Compiling HIPI Zome with Holochain SDK"
echo "=========================================="
echo ""

# Add cargo to PATH
export PATH="$HOME/.cargo/bin:$PATH"

# Check if holochain is installed
if ! command -v holochain &> /dev/null; then
    echo "❌ Holochain not found in PATH"
    echo "Run: export PATH=\"\$HOME/.cargo/bin:\$PATH\""
    exit 1
fi

echo "✅ Using Holochain $(holochain --version)"
echo ""

# Update the Cargo.toml for the zome
cd zomes/hipi

# Update dependencies to match installed Holochain version
cat > Cargo.toml << 'EOF'
[package]
name = "hipi"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib", "rlib"]

[dependencies]
hdk = "0.3.2"
serde = { version = "1.0", features = ["derive"] }

[profile.release]
opt-level = "z"
lto = true
codegen-units = 1
panic = "abort"
EOF

echo "📦 Updated Cargo.toml for Holochain 0.3.2"

# Add WASM target if not already added
rustup target add wasm32-unknown-unknown 2>/dev/null || true

echo ""
echo "🔨 Building HIPI zome..."
cargo build --release --target wasm32-unknown-unknown

if [ -f "target/wasm32-unknown-unknown/release/hipi.wasm" ]; then
    echo "✅ WASM built successfully!"
    ls -lah target/wasm32-unknown-unknown/release/hipi.wasm
else
    echo "❌ WASM build failed"
    exit 1
fi

# Go back to project root
cd ../..

# Create the DNA configuration
echo ""
echo "📋 Creating DNA configuration..."

cat > dna.yaml << 'EOF'
---
manifest_version: "1"
name: mycelix-hipi
uid: 00000000-0000-0000-0000-000000000000
properties: ~
integrity:
  network_seed: ~
  origin_time: 2024-01-01T00:00:00.000000Z
  zomes:
    - name: hipi
      bundled: "zomes/hipi/target/wasm32-unknown-unknown/release/hipi.wasm"
coordinator:
  zomes:
    - name: hipi
      bundled: "zomes/hipi/target/wasm32-unknown-unknown/release/hipi.wasm"
      dependencies: []
EOF

echo "✅ DNA configuration created"

# Package the DNA
echo ""
echo "📦 Packaging DNA..."

if command -v hc &> /dev/null; then
    hc dna pack . -o mycelix.dna
    echo "✅ DNA packaged as mycelix.dna"
    ls -lah mycelix.dna
else
    echo "⚠️  hc CLI not found, creating manual DNA bundle..."
    # Manual DNA packaging
    mkdir -p .hc_tmp
    cp dna.yaml .hc_tmp/
    cp -r zomes .hc_tmp/
    cd .hc_tmp
    tar -czf ../mycelix.dna .
    cd ..
    rm -rf .hc_tmp
    echo "✅ DNA manually packaged as mycelix.dna"
fi

echo ""
echo "🎉 HIPI Zome Compilation Complete!"
echo ""
echo "Next steps:"
echo "1. Start Holochain conductor:"
echo "   holochain --config conductor-config.yaml"
echo ""
echo "2. Install the DNA:"
echo "   hc app install mycelix.dna"
echo ""
echo "3. Connect the gateway:"
echo "   cargo run --release"
echo ""