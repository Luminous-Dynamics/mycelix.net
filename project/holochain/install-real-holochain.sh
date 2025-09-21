#!/usr/bin/env bash

# Install Real Holochain on NixOS
set -e

echo "🧬 Installing Real Holochain Development Environment"
echo "==================================================="
echo ""

# Colors for output
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

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

echo "Method 1: Using Nix Flakes with nixpkgs-holochain"
echo "-------------------------------------------------"

# Create a proper flake.nix for Holochain development
cat > flake.nix << 'EOF'
{
  description = "Mycelix Holochain Development Environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    holochain = {
      url = "github:holochain/holochain";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    rust-overlay.url = "github:oxalica/rust-overlay";
  };

  outputs = { self, nixpkgs, holochain, rust-overlay }:
    let
      system = "x86_64-linux";
      pkgs = import nixpkgs {
        inherit system;
        overlays = [ rust-overlay.overlays.default ];
      };
      
      rustToolchain = pkgs.rust-bin.stable.latest.default.override {
        extensions = [ "rust-src" "rustfmt" "clippy" ];
        targets = [ "wasm32-unknown-unknown" ];
      };
    in {
      devShells.${system}.default = pkgs.mkShell {
        buildInputs = with pkgs; [
          # Rust with WASM support
          rustToolchain
          
          # Try to get Holochain from the flake if available
          # holochain.packages.${system}.holochain
          
          # Fallback: Use cargo to install
          cargo-nextest
          cargo-watch
          
          # WASM tools
          wasm-pack
          wasm-bindgen-cli
          binaryen
          
          # Node.js for frontend
          nodejs_20
          
          # Build dependencies
          pkg-config
          openssl
          openssl.dev
          protobuf
          
          # Development tools
          jq
          websocat
          
          # Database
          sqlite
        ];
        
        shellHook = ''
          echo "🧬 Holochain Development Environment"
          echo "====================================="
          echo ""
          echo "Installing Holochain via cargo..."
          echo ""
          
          # Add WASM target
          rustup target add wasm32-unknown-unknown 2>/dev/null || true
          
          # Check if holochain is installed
          if ! command -v holochain &> /dev/null; then
            echo "Installing holochain..."
            cargo install holochain --version 0.2.6
            cargo install holochain_cli --version 0.2.6
            cargo install lair_keystore --version 0.4.4
          fi
          
          # Check if hc (holochain CLI) is installed
          if ! command -v hc &> /dev/null; then
            echo "Installing hc CLI..."
            cargo install holochain_cli_bundle --version 0.2.6
          fi
          
          echo ""
          echo "Available commands:"
          echo "  holochain --version  : Check Holochain version"
          echo "  hc --version        : Check CLI version"
          echo "  cargo build         : Build the zome"
          echo ""
        '';
        
        # Environment variables
        RUST_LOG = "info";
        CARGO_HOME = "./.cargo";
        RUSTUP_HOME = "./.rustup";
        RUST_SRC_PATH = "${rustToolchain}/lib/rustlib/src/rust/library";
      };
    };
}
EOF

print_info "Created flake.nix for Holochain development"

echo ""
echo "Method 2: Direct Installation via Cargo"
echo "---------------------------------------"

# Alternative: Install directly without flake
cat > install-direct.sh << 'EOF'
#!/usr/bin/env bash

# Direct installation method
echo "Installing Holochain directly via cargo..."

# Enter a nix shell with required dependencies
nix-shell -p \
  cargo \
  rustc \
  pkg-config \
  openssl \
  openssl.dev \
  protobuf \
  sqlite \
  --run "
    # Install Holochain components
    cargo install holochain --version 0.2.6
    cargo install holochain_cli --version 0.2.6
    cargo install lair_keystore --version 0.4.4
    cargo install holochain_cli_bundle --version 0.2.6
    
    echo 'Installation complete!'
    holochain --version
    hc --version
  "
EOF

chmod +x install-direct.sh

echo ""
echo "Method 3: Using Holonix (Official Holochain Nix Environment)"
echo "------------------------------------------------------------"

# Create Holonix setup
cat > holonix.nix << 'EOF'
let
  holonixPath = builtins.fetchTarball {
    url = "https://github.com/holochain/holonix/archive/main.tar.gz";
  };
  holonix = import (holonixPath) {
    includeHolochainBinaries = true;
  };
  nixpkgs = holonix.pkgs;
in nixpkgs.mkShell {
  inputsFrom = [ holonix.main ];
  packages = with nixpkgs; [
    nodejs_20
  ];
}
EOF

echo ""
print_success "Installation scripts prepared!"
echo ""
echo "Choose your installation method:"
echo "--------------------------------"
echo ""
echo "1. Nix Flake (Recommended for NixOS):"
echo "   ${GREEN}nix develop${NC}"
echo ""
echo "2. Direct Cargo Install:"
echo "   ${GREEN}./install-direct.sh${NC}"
echo ""
echo "3. Holonix (Official Holochain Nix):"
echo "   ${GREEN}nix-shell holonix.nix${NC}"
echo ""
echo "After installation, you can:"
echo "  - Build the HIPI zome: cargo build --target wasm32-unknown-unknown --release"
echo "  - Run Holochain: holochain --conductor-config conductor-config.yaml"
echo "  - Package DNA: hc dna pack . -o mycelix.dna"
echo ""