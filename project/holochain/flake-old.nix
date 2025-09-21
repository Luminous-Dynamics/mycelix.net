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
        extensions = [ "rust-src" "rustfmt" "clippy" "rust-analyzer" ];
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
          cargo-edit
          
          # WASM tools
          wasm-pack
          wasm-bindgen-cli
          binaryen
          
          # Node.js and TypeScript for frontend
          nodejs_20
          nodePackages.typescript
          nodePackages.ts-node
          nodePackages.npm
          
          # Python and Poetry for potential scripts
          python311
          python311Packages.pip
          poetry
          
          # Build dependencies
          pkg-config
          openssl
          openssl.dev
          protobuf
          
          # Development tools
          jq
          websocat
          tmux
          ripgrep
          fd
          bat
          eza
          
          # Database
          sqlite
          
          # Process management
          screen
          moreutils
        ];
        
        shellHook = ''
          echo "🌐 Holochain P2P Consciousness Network Development Environment"
          echo "=============================================================="
          echo ""
          
          # Set up local directories
          export CARGO_HOME="$(pwd)/.cargo"
          export RUSTUP_HOME="$(pwd)/.rustup"
          export PATH="$CARGO_HOME/bin:$PATH"
          
          # Add WASM target
          echo "🔧 Setting up Rust WASM target..."
          rustup target add wasm32-unknown-unknown 2>/dev/null || true
          
          # Check if holochain is installed locally
          if [ ! -f "$CARGO_HOME/bin/holochain" ]; then
            echo "📦 Installing Holochain locally (this may take a while)..."
            cargo install holochain --version 0.3.0-beta-dev.43 --locked 2>/dev/null || \
            cargo install holochain --version 0.2.6 --locked || \
            echo "⚠️ Could not install Holochain. Will continue without it."
            
            cargo install holochain_cli --version 0.3.0-beta-dev.43 --locked 2>/dev/null || \
            cargo install holochain_cli --version 0.2.6 --locked || \
            echo "⚠️ Could not install Holochain CLI."
            
            cargo install lair_keystore --version 0.4.4 --locked || \
            echo "⚠️ Could not install Lair keystore."
          fi
          
          # Check installation status
          echo ""
          echo "📋 Installation Status:"
          echo "  Rust: $(rustc --version 2>/dev/null || echo 'Not found')"
          echo "  Cargo: $(cargo --version 2>/dev/null || echo 'Not found')"
          echo "  Node: $(node --version 2>/dev/null || echo 'Not found')"
          echo "  TypeScript: $(tsc --version 2>/dev/null || echo 'Not found')"
          echo "  Poetry: $(poetry --version 2>/dev/null || echo 'Not found')"
          
          if [ -f "$CARGO_HOME/bin/holochain" ]; then
            echo "  Holochain: $($CARGO_HOME/bin/holochain --version 2>/dev/null || echo 'Installed but version unknown')"
          else
            echo "  Holochain: Not installed (will run in demo mode)"
          fi
          
          # Check for Ollama and models
          echo ""
          if command -v ollama &> /dev/null; then
            echo "✅ Ollama detected. Checking for models..."
            if ollama list 2>/dev/null | grep -q "gemma"; then
              echo "  ✅ Gemma model available"
            else
              echo "  ⚠️ Gemma model not found. Run: ollama pull gemma"
            fi
            if ollama list 2>/dev/null | grep -q "mistral"; then
              echo "  ✅ Mistral model available"
            else
              echo "  ⚠️ Mistral model not found. Run: ollama pull mistral"
            fi
          else
            echo "⚠️ Ollama not found. LLM testing will be limited."
          fi
          
          echo ""
          echo "🚀 Quick Start Commands:"
          echo "  npm install              - Install TypeScript dependencies"
          echo "  cargo build --release    - Build Rust zomes"
          echo "  npm run test:simple      - Test without Holochain"
          echo "  npm run test:integration - Full integration test"
          echo ""
          echo "📚 Development Commands:"
          echo "  cargo watch              - Auto-rebuild on changes"
          echo "  tsc --watch             - TypeScript watch mode"
          echo "  tmux new -s holochain   - Start tmux session"
          echo ""
          
          # Set environment variables
          export RUST_LOG=info
          export CARGO_TARGET_DIR=target
          export WASM_TARGET=wasm32-unknown-unknown
          
          echo "🌊 Ready for P2P consciousness networking!"
          echo "=============================================================="
        '';
        
        # Environment variables
        RUST_LOG = "info";
        RUST_SRC_PATH = "${rustToolchain}/lib/rustlib/src/rust/library";
      };
    };
}
