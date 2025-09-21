{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  buildInputs = with pkgs; [
    # Core build tools
    cargo
    rustc
    pkg-config
    openssl
    
    # For WASM compilation
    wasm-pack
    binaryen
    
    # Node.js for testing
    nodejs_20
    nodePackages.npm
    
    # Additional tools
    websocat
    jq
    
    # Download pre-built holochain binaries
    (pkgs.writeScriptBin "install-holochain-binary" ''
      #!${pkgs.bash}/bin/bash
      echo "Downloading pre-built Holochain binaries..."
      
      # Create local bin directory
      mkdir -p $HOME/.local/bin
      
      # Download holochain binary
      wget -q --show-progress -O $HOME/.local/bin/holochain \
        https://github.com/holochain/holochain/releases/download/holochain-0.2.4/holochain-x86_64-unknown-linux-gnu
      
      # Download hc binary
      wget -q --show-progress -O $HOME/.local/bin/hc \
        https://github.com/holochain/holochain/releases/download/holochain-0.2.4/hc-x86_64-unknown-linux-gnu
        
      # Make them executable
      chmod +x $HOME/.local/bin/holochain
      chmod +x $HOME/.local/bin/hc
      
      # Add to PATH
      export PATH=$HOME/.local/bin:$PATH
      
      echo "✅ Holochain binaries installed to ~/.local/bin"
      echo "Run: holochain --version"
    '')
  ];
  
  shellHook = ''
    echo "Holochain Development Shell"
    echo ""
    echo "First time setup:"
    echo "  install-holochain-binary"
    echo ""
    echo "Then you can use:"
    echo "  holochain --version"
    echo "  hc --version"
    echo ""
    
    # Add local bin to PATH
    export PATH=$HOME/.local/bin:$PATH
    
    # Add wasm target
    rustup target add wasm32-unknown-unknown 2>/dev/null || true
  '';
}
