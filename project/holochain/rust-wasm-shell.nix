{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  buildInputs = with pkgs; [
    rustc
    cargo
    wasm-pack
    wasm-bindgen-cli
    binaryen
  ];

  shellHook = ''
    echo "🦀 Rust WASM Development Shell"
    echo "================================"
    echo "Tools available:"
    echo "  • rustc - Rust compiler"
    echo "  • cargo - Rust package manager"
    echo "  • wasm-pack - WASM packaging tool"
    echo "  • wasm-bindgen - WASM bindings generator"
    echo "  • wasm-opt - WASM optimizer"
    echo ""
    echo "Note: For wasm32-unknown-unknown target, you may need to:"
    echo "  cargo install wasm32-unknown-unknown"
    echo "Or use wasm-pack which handles this automatically"
  '';
}
