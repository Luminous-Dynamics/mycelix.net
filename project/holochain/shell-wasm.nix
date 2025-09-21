{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  buildInputs = with pkgs; [
    # Rust with WASM target
    (rust-bin.stable.latest.default.override {
      targets = [ "wasm32-unknown-unknown" ];
    })
    
    # Alternative: use rustc with wasm target
    cargo
    rustc
    
    # WASM tools
    wasm-pack
    wasm-bindgen-cli
    binaryen
    
    # Build dependencies
    pkg-config
    openssl
    
    # Additional tools
    nodejs_20
    jq
  ];
  
  shellHook = ''
    echo "🦀 Rust WASM Development Environment"
    echo "====================================="
    echo ""
    echo "Compiling HIPI zome to WASM..."
    echo ""
    
    # Add wasm target if using rustup
    if command -v rustup &> /dev/null; then
      rustup target add wasm32-unknown-unknown 2>/dev/null || true
    fi
  '';
}