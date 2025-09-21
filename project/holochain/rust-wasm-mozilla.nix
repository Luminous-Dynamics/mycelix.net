{ pkgs ? import <nixpkgs> {} }:

let
  # Mozilla Rust overlay provides rustup-like functionality
  mozilla = pkgs.fetchFromGitHub {
    owner = "mozilla";
    repo = "nixpkgs-mozilla";
    rev = "80627b282705101e7b38e19ca6e8df105031b072";
    sha256 = "sha256-rL5r9E7/gz/1TZn9yfhHPGlYgWE6O1VqeTFWGqsBf5E=";
  };
  
  # Import the overlay
  rust-overlay = import mozilla;
  
  # Use the overlay with nixpkgs
  nixpkgs = import <nixpkgs> { overlays = [ rust-overlay ]; };
  
  # Get latest Rust with WASM target
  rust-wasm = nixpkgs.latest.rustChannels.stable.rust.override {
    targets = [ "wasm32-unknown-unknown" ];
  };

in
pkgs.mkShell {
  buildInputs = with pkgs; [
    rust-wasm
    pkg-config
    openssl
    wasm-bindgen-cli
    binaryen
  ];

  shellHook = ''
    echo "🦀 Rust with WASM Target Shell"
    echo "================================"
    echo "✅ wasm32-unknown-unknown target included!"
    echo ""
    rustc --version
    echo "Targets available:"
    rustc --print target-list | grep wasm32
    echo ""
    echo "Ready to build Holochain WASM modules!"
  '';
}
