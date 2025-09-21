{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  buildInputs = with pkgs; [
    # Rust with WASM support
    rustc
    cargo
    
    # Build dependencies
    pkg-config
    openssl
    openssl.dev
    
    # Additional tools
    nodejs_20
    jq
  ];
  
  shellHook = ''
    echo "🦀 Rust WASM Development Environment"
    echo "====================================="
    
    # Add WASM target
    export RUSTUP_HOME=$HOME/.rustup
    export CARGO_HOME=$HOME/.cargo
    export PATH="$CARGO_HOME/bin:$PATH"
    
    # Ensure WASM target is installed
    if command -v rustup &> /dev/null; then
      rustup target add wasm32-unknown-unknown 2>/dev/null || true
    else
      echo "Note: rustup not available, using system Rust"
      echo "WASM compilation may require additional setup"
    fi
    
    echo ""
    echo "Ready to compile HIPI zome!"
  '';
  
  # Environment variables
  RUST_LOG = "info";
  PKG_CONFIG_PATH = "${pkgs.openssl.dev}/lib/pkgconfig";
}