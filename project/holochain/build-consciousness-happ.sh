#!/bin/bash
# Build consciousness hApp without Holonix (using cargo directly)

echo "🧠 Building Mycelix Consciousness hApp"
echo "====================================="
echo ""

cd consciousness-happ

# Check if we have Rust installed
if ! command -v cargo &> /dev/null; then
    echo "❌ Cargo not found. Installing Rust..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source $HOME/.cargo/env
fi

# Add WASM target if not present
echo "📦 Ensuring WASM target is installed..."
rustup target add wasm32-unknown-unknown

# Build each zome
ZOMES=("consciousness_identity" "consensus_mechanism" "hx402_payments")

for zome in "${ZOMES[@]}"; do
    echo ""
    echo "🔨 Building $zome zome..."
    
    if [ -d "dna/zomes/$zome" ]; then
        cd "dna/zomes/$zome"
        
        # Build the zome
        cargo build --release --target wasm32-unknown-unknown 2>&1 | tail -5
        
        if [ $? -eq 0 ]; then
            echo "✅ $zome built successfully"
        else
            echo "⚠️  $zome build failed (might need Cargo.toml adjustments)"
        fi
        
        cd ../../../
    else
        echo "⏭️  Skipping $zome (not created yet)"
    fi
done

echo ""
echo "📋 Build Summary:"
echo "-----------------"
ls -la dna/zomes/*/target/wasm32-unknown-unknown/release/*.wasm 2>/dev/null || echo "No WASM files built yet"

echo ""
echo "💡 Next Steps:"
echo "1. Complete the remaining zome implementations"
echo "2. Create DNA manifest (dna.yaml)"
echo "3. Package with hc (when Holonix is ready)"
echo "4. Test with mock conductor"