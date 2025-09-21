#!/usr/bin/env bash

# Direct installation method
echo "Installing Holochain directly via cargo..."

# Enter a nix shell with required dependencies
nix-shell -p \
  cargo \
  rustc \
  pkg-config \
  openssl \
  openssl.dev \
  protobuf \
  sqlite \
  --run "
    # Install Holochain components
    cargo install holochain --version 0.2.6
    cargo install holochain_cli --version 0.2.6
    cargo install lair_keystore --version 0.4.4
    cargo install holochain_cli_bundle --version 0.2.6
    
    echo 'Installation complete!'
    holochain --version
    hc --version
  "
