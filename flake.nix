{
  description = "Mycelix P2P Consciousness Network - Holochain Development Environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    
    # Use Holonix for Holochain development
    holonix = {
      url = "github:holochain/holonix/main";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    
    rust-overlay = {
      url = "github:oxalica/rust-overlay";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = { self, nixpkgs, holonix, rust-overlay }:
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
        # Default development shell using Holonix
        default = pkgs.mkShell {
          inputsFrom = [ 
            # Include the Holonix shell which provides all Holochain tools
            holonix.devShells.${system}.default or holonix.devShell.${system} or {}
          ];
          
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
          ];
          
          shellHook = ''
            echo "🍄 Mycelix Holonix Development Environment"
            echo "================================================"
            echo ""
            echo "Available commands:"
            echo "  hc              - Holochain CLI tool"
            echo "  cargo           - Rust package manager"
            echo "  wasm-pack       - Build WASM packages"
            echo ""
            echo "Quick start:"
            echo "  hc scaffold      - Create a new hApp"
            echo "  hc sandbox       - Launch development sandbox"
            echo "  cargo build --target wasm32-unknown-unknown"
            echo ""
            
            # Set up environment variables
            export CARGO_HOME="$PWD/.cargo"
            export RUSTUP_HOME="$PWD/.rustup"
            export PATH="$CARGO_HOME/bin:$PATH"
            
            echo "🌊 Ready for P2P consciousness networking!"
          '';
          
          # Environment variables
          RUST_BACKTRACE = 1;
          RUST_LOG = "info";
          WASM_BINDGEN_DWARF = 1;
        };
      };
    };
}