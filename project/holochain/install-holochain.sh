#!/usr/bin/env bash

# Holochain installation script for NixOS/Linux
set -e

echo "🧬 Installing Holochain Development Environment"
echo "=============================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check system
if command -v nix &> /dev/null; then
    print_success "Nix is installed"
else
    print_error "Nix is not installed. Please install Nix first:"
    echo "  curl -L https://nixos.org/nix/install | sh"
    exit 1
fi

# Method 1: Using Holochain's official Nix flake
print_info "Method 1: Installing via Holochain Nix flake..."

cat > flake.nix << 'EOF'
{
  description = "Holochain development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    holochain = {
      url = "github:holochain/holochain";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = { self, nixpkgs, holochain }:
    let
      system = "x86_64-linux";
      pkgs = nixpkgs.legacyPackages.${system};
    in
    {
      devShells.${system}.default = pkgs.mkShell {
        buildInputs = with pkgs; [
          # Holochain binaries from the flake
          holochain.packages.${system}.holochain
          holochain.packages.${system}.hc
          holochain.packages.${system}.lair-keystore
          
          # Rust toolchain for development
          cargo
          rustc
          rustfmt
          clippy
          
          # Additional tools
          nodejs_20
          yarn
          websocat
          jq
          
          # WASM target for zome compilation
          wasm-pack
          cargo-make
        ];
        
        shellHook = ''
          echo "🧬 Holochain Development Environment"
          echo "===================================="
          echo ""
          echo "Available commands:"
          echo "  holochain --version  - Holochain conductor"
          echo "  hc --version        - Development CLI"
          echo "  lair-keystore       - Key management"
          echo ""
          echo "To compile your zome:"
          echo "  cd zomes/hipi && cargo build --release --target wasm32-unknown-unknown"
          echo ""
          
          # Add wasm target if not present
          rustup target add wasm32-unknown-unknown 2>/dev/null || true
        '';
      };
    };
}
EOF

print_success "Created flake.nix"

# Method 2: Alternative using Holonix (older but stable)
print_info "Method 2: Creating alternative Holonix shell.nix..."

cat > shell-holonix.nix << 'EOF'
let
  holonixPath = builtins.fetchTarball {
    url = "https://github.com/holochain/holonix/archive/main.tar.gz";
  };
  holonix = import (holonixPath) {
    holochainVersionId = "v0_2_4";
  };
  nixpkgs = holonix.pkgs;
in holonix.main.makeShell {
  packages = with nixpkgs; [
    holochain
    lair-keystore
    nodejs_20
    yarn
    websocat
    cargo-make
    wasm-pack
  ];
  
  shellHook = ''
    echo "Holochain Development Environment (Holonix)"
    holochain --version
  '';
}
EOF

print_success "Created shell-holonix.nix"

# Method 3: Quick install using cargo (if Rust is available)
if command -v cargo &> /dev/null; then
    print_info "Method 3: Cargo is available for direct installation"
    echo ""
    echo "You can also install directly with cargo:"
    echo "  cargo install holochain --version 0.2.4"
    echo "  cargo install holochain_cli --version 0.2.4"
    echo "  cargo install lair_keystore --version 0.2.4"
fi

echo ""
echo "========================================"
echo "     Installation Methods Ready! 🎉"
echo "========================================"
echo ""
echo "Choose your installation method:"
echo ""
echo "1. Using Nix Flake (Recommended for NixOS):"
echo "   ${GREEN}nix develop${NC}"
echo ""
echo "2. Using Holonix (Alternative):"
echo "   ${GREEN}nix-shell shell-holonix.nix${NC}"
echo ""
echo "3. Using Cargo (if you have Rust):"
echo "   ${GREEN}cargo install holochain holochain_cli lair_keystore${NC}"
echo ""
echo "After installation, verify with:"
echo "  holochain --version"
echo "  hc --version"
echo ""

# Try to enter the development shell automatically
print_info "Attempting to enter development shell..."
if command -v nix &> /dev/null && [ -f "flake.nix" ]; then
    echo ""
    echo "Run this command to enter the Holochain environment:"
    echo ""
    echo "  ${GREEN}nix develop${NC}"
    echo ""
    echo "Or if that doesn't work:"
    echo "  ${GREEN}nix-shell shell-holonix.nix${NC}"
fi