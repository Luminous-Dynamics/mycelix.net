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
        config = {
          # Allow the insecure libsoup package that Holonix depends on
          permittedInsecurePackages = [
            "libsoup-2.74.3"
          ];
        };
      };
      
      rustToolchain = pkgs.rust-bin.stable.latest.default.override {
        extensions = [ "rust-src" "rustfmt" "clippy" ];
        targets = [ "wasm32-unknown-unknown" ];
      };
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
          
          # For now, we'll install Holochain tools manually
          # Instructions will be provided in the shell
        ];
        
        shellHook = ''
          echo "🍄 Mycelix Holochain Development Environment"
          echo "================================================"
          echo ""
          
          # Set up environment variables
          export CARGO_HOME="$PWD/.cargo"
          export RUSTUP_HOME="$PWD/.rustup"
          export PATH="$CARGO_HOME/bin:$PATH"
          
          # Check if we have hc-install
          if ! command -v hc-install &> /dev/null; then
            echo "📦 Installing Holochain CLI tools..."
            echo ""
            
            # Install hc-install tool
            cargo install holochain_cli_bundle --version 0.3.0
            
            echo ""
            echo "✅ Holochain CLI installed!"
          fi
          
          echo "Available commands:"
          echo "  cargo           - Rust package manager"
          echo "  wasm-pack       - Build WASM packages"
          echo "  cargo build --target wasm32-unknown-unknown"
          echo ""
          echo "To compile the consciousness_field zome:"
          echo "  cd zomes/consciousness_field"
          echo "  cargo build --release --target wasm32-unknown-unknown"
          echo ""
          echo "The compiled WASM will be at:"
          echo "  target/wasm32-unknown-unknown/release/consciousness_field.wasm"
          echo ""
          echo "🌊 Ready for P2P consciousness networking!"
          echo ""
          echo "Note: Full Holochain conductor tools require additional setup."
          echo "For now, you can develop and compile WASM zomes."
        '';
        
        # Environment variables
        RUST_BACKTRACE = 1;
        RUST_LOG = "info";
        WASM_BINDGEN_DWARF = 1;
      };
    };
}