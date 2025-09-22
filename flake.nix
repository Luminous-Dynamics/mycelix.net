{
  description = "Mycelix P2P Consciousness Network - Holochain Development Environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    holochain = {
      url = "github:holochain/holochain?dir=versions/0_4";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    
    # Holonix - Holochain development environment
    holonix = {
      url = "github:holochain/holonix/main";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    
    rust-overlay = {
      url = "github:oxalica/rust-overlay";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = { self, nixpkgs, holochain, holonix, rust-overlay }:
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
    in
    {
      devShells.${system} = {
        # Default development shell with Holonix
        default = pkgs.mkShell {
          buildInputs = with pkgs; [
            # Holochain core tools
            holochain.packages.${system}.holochain
            holochain.packages.${system}.hc
            holochain.packages.${system}.lair-keystore
            
            # Rust toolchain for WASM development
            rustToolchain
            wasm-pack
            wasm-bindgen-cli
            binaryen
            
            # Development tools
            cargo-watch
            cargo-edit
            cargo-expand
            cargo-nextest
            
            # Node.js for UI development
            nodejs_20
            yarn
            
            # Build tools
            pkg-config
            openssl
            protobuf
            
            # Testing tools
            cargo-tarpaulin
            
            # Documentation
            mdbook
            
            # Additional tools
            jq
            yq
            direnv
          ];
          
          shellHook = ''
            echo "🍄 Mycelix Holonix Development Environment"
            echo "================================================"
            echo "Holochain version: $(holochain --version 2>/dev/null || echo 'checking...')"
            echo "hc version: $(hc --version 2>/dev/null || echo 'checking...')"
            echo "Rust version: $(rustc --version)"
            echo ""
            echo "Available commands:"
            echo "  holochain       - Run a Holochain conductor"
            echo "  hc              - Holochain CLI tool"
            echo "  lair-keystore   - Manage cryptographic keys"
            echo "  cargo           - Rust package manager"
            echo "  wasm-pack       - Build WASM packages"
            echo ""
            echo "Quick start:"
            echo "  hc scaffold      - Create a new hApp"
            echo "  hc sandbox       - Launch development sandbox"
            echo "  cargo watch      - Auto-rebuild on changes"
            echo ""
            
            # Set up environment variables
            export CARGO_HOME="$PWD/.cargo"
            export RUSTUP_HOME="$PWD/.rustup"
            export PATH="$CARGO_HOME/bin:$PATH"
            
            # Initialize lair-keystore if needed
            if [ ! -d "$HOME/.lair" ]; then
              echo "Initializing lair-keystore..."
              lair-keystore init
            fi
            
            echo "🌊 Ready for P2P consciousness networking!"
          '';
          
          # Environment variables
          RUST_BACKTRACE = 1;
          RUST_LOG = "info";
          WASM_BINDGEN_DWARF = 1;
        };
        
        # Minimal shell for CI/CD
        ci = pkgs.mkShell {
          buildInputs = with pkgs; [
            holochain.packages.${system}.holochain
            holochain.packages.${system}.hc
            rustToolchain
            cargo-nextest
          ];
        };
      };
    };
}