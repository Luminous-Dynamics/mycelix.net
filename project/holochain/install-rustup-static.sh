#!/usr/bin/env bash

echo "📦 Installing rustup via static binary for NixOS"
echo "==============================================="
echo ""

# Download static rustup binary
RUSTUP_DIR="$HOME/.local/rustup-static"
mkdir -p "$RUSTUP_DIR"

echo "Downloading static rustup binary..."
curl -L https://github.com/rust-lang/rustup/releases/latest/download/rustup-init-x86_64-unknown-linux-musl -o "$RUSTUP_DIR/rustup-init"
chmod +x "$RUSTUP_DIR/rustup-init"

echo ""
echo "Installing Rust with WASM target..."
CARGO_HOME="$HOME/.cargo" RUSTUP_HOME="$HOME/.rustup" "$RUSTUP_DIR/rustup-init" -y --default-toolchain stable --target wasm32-unknown-unknown

echo ""
echo "✅ Installation complete!"
echo ""
echo "To use rustup, run:"
echo "  source $HOME/.cargo/env"
echo "  rustup target list --installed"
