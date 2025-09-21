#!/usr/bin/env bash

echo "🔨 Alternative: Building with cargo-web"
echo "========================================"
echo ""

cd consciousness-happ/dna/zomes/consciousness_identity

# Try using cargo-web which can compile to WASM
echo "Installing cargo-web..."
cargo install cargo-web --version 0.6.26 2>&1 | tail -5

echo ""
echo "Attempting WASM build with cargo-web..."
cargo web build --target wasm32-unknown-unknown 2>&1 | head -20

echo ""
echo "Note: This is an alternative approach for WASM compilation."
