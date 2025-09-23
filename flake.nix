{
  description = "Mycelix P2P Consciousness Network - Holochain Development Environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    
    rust-overlay = {
      url = "github:oxalica/rust-overlay";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = { self, nixpkgs, rust-overlay }:
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
      
      # Install Holochain binaries via cargo
      installHolochainScript = pkgs.writeShellScriptBin "install-holochain" ''
        echo "📦 Installing Holochain 0.5.3 tools..."
        
        if ! command -v holochain &> /dev/null; then
          echo "Installing holochain conductor..."
          cargo install holochain --version 0.5.3 --locked
        else
          echo "✅ holochain already installed: $(holochain --version)"
        fi
        
        if ! command -v hc &> /dev/null; then
          echo "Installing holochain CLI..."
          cargo install holochain_cli --version 0.5.0 --locked
        else
          echo "✅ hc already installed: $(hc --version)"
        fi
        
        if ! command -v lair-keystore &> /dev/null; then
          echo "Installing lair-keystore..."
          cargo install lair_keystore --version 0.5.1 --locked
        else
          echo "✅ lair-keystore already installed"
        fi
        
        echo ""
        echo "✨ Holochain tools installation complete!"
      '';
    in
    {
      devShells.${system}.default = pkgs.mkShell {
        buildInputs = with pkgs; [
          # Rust toolchain for WASM development
          rustToolchain
          wasm-pack
          wasm-bindgen-cli
          binaryen
          
          # Development tools
          cargo-watch
          cargo-edit
          cargo-expand
          
          # Node.js for UI development
          nodejs_20
          yarn
          
          # Build tools
          pkg-config
          openssl
          protobuf
          
          # Additional tools
          jq
          direnv
          
          # WebRTC and P2P networking
          libsodium
          
          # Installation script
          installHolochainScript
        ];
        
        shellHook = ''
          echo "🍄 Mycelix Holochain Development Environment"
          echo "============================================="
          echo ""
          
          # Set up environment variables
          export CARGO_HOME="$PWD/.cargo"
          export RUSTUP_HOME="$PWD/.rustup"
          export PATH="$CARGO_HOME/bin:$PATH"
          
          # Check if Holochain tools are installed
          if ! command -v holochain &> /dev/null; then
            echo "📦 Holochain tools not found!"
            echo ""
            echo "To install Holochain 0.5.3 tools, run:"
            echo "  install-holochain"
            echo ""
          else
            echo "✅ Holochain tools detected:"
            echo "   • holochain $(holochain --version 2>/dev/null || echo '(checking...)')"
            echo "   • hc $(hc --version 2>/dev/null || echo '(checking...)')"
            echo ""
          fi
          
          echo "🔧 Development Commands:"
          echo ""
          echo "  First time setup:"
          echo "   install-holochain        # Install Holochain 0.5.3 tools"
          echo ""
          echo "  Building Zomes:"
          echo "   cd zomes/consciousness_field"
          echo "   cargo build --release --target wasm32-unknown-unknown"
          echo ""
          echo "  hApp Management (after installing tools):"
          echo "   hc app pack              # Pack hApp for distribution"
          echo "   hc dna pack              # Pack DNA from zomes"
          echo ""
          echo "  Testing & Sandboxes:"
          echo "   hc sandbox generate      # Generate test sandbox"
          echo "   hc sandbox run           # Run sandbox conductor"
          echo "   hc sandbox clean         # Clean up sandbox"
          echo ""
          echo "📂 Project Structure:"
          echo "   zomes/                   # Holochain zomes (Rust)"
          echo "   ui/                      # User interface"
          echo "   happ.yaml                # hApp configuration"
          echo ""
          echo "🌊 P2P consciousness networking is ready to manifest!"
        '';
        
        # Environment variables
        RUST_BACKTRACE = 1;
        RUST_LOG = "info";
        WASM_BINDGEN_DWARF = 1;
      };
    };
}