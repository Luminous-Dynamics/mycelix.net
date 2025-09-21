#!/usr/bin/env bash

echo "🔨 Building Holochain WASM modules with Nix Rust"
echo "================================================"
echo ""

# Use Nix's Rust to build, but target WASM
export CARGO_HOME="$HOME/.cargo-wasm"
export RUSTUP_HOME="$HOME/.rustup-wasm"

# Create a simple WASM test
cd consciousness-happ/dna/zomes/consciousness_identity

# Try to compile with available tools
echo "Attempting build with cargo and wasm32 target..."

# First, let's check if we can use cargo with wasm32 directly
cargo build --target wasm32-unknown-unknown 2>&1 | head -20

echo ""
echo "Note: If this fails, we need to install the WASM target separately."
echo "On NixOS, the best approach is to use wasm-pack or a dedicated WASM toolchain."
