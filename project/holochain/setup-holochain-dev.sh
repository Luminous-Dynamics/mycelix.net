#!/usr/bin/env bash

# 🍄 Mycelix Holochain Development Setup
# Sets up complete Holochain development environment using Holonix

set -e

echo "🍄 Mycelix Holochain Development Environment Setup"
echo "=================================================="

# Check if Nix is installed
if ! command -v nix-shell &> /dev/null; then
    echo "❌ Nix is not installed. Installing Nix..."
    curl --proto '=https' --tlsv1.2 -sSf -L https://install.determinate.systems/nix | sh -s -- install
    . /nix/var/nix/profiles/default/etc/profile.d/nix-daemon.sh
fi

# Create project structure
echo "📁 Creating Mycelix project structure..."
mkdir -p mycelix-holochain/{dnas,zomes,bridges,tests,ui}

cd mycelix-holochain

# Create flake.nix for Holonix
cat > flake.nix << 'EOF'
{
  description = "Mycelix - Consciousness Infrastructure for Robots";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    holochain.url = "github:holochain/holochain";
    holonix.url = "github:holochain/holonix";
  };

  outputs = { self, nixpkgs, holochain, holonix }:
    let
      system = "x86_64-linux";
      pkgs = nixpkgs.legacyPackages.${system};
    in
    {
      devShells.${system}.default = pkgs.mkShell {
        buildInputs = with pkgs; [
          # Holochain development tools
          holochain
          cargo
          rustc
          nodejs
          yarn
          
          # Additional tools for robotics integration
          python3
          python3Packages.websocket-client
          
          # ROS2 bridge development (optional)
          # ros2
        ];

        shellHook = ''
          echo "🍄 Mycelix Holochain Development Environment"
          echo "============================================"
          echo "Holochain version: $(holochain --version)"
          echo "Cargo version: $(cargo --version)"
          echo ""
          echo "Available commands:"
          echo "  hc scaffold   - Create new DNA/zome"
          echo "  hc dna pack   - Package DNA"
          echo "  hc sandbox    - Run local test network"
          echo ""
          echo "Quick start:"
          echo "  ./scaffold-consciousness-dna.sh"
          echo ""
        '';
      };
    };
}
EOF

# Alternative: Use Holonix directly without flake
cat > shell.nix << 'EOF'
{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  buildInputs = with pkgs; [
    # Use the Holonix development environment
    (import (fetchTarball "https://github.com/holochain/holonix/archive/main.tar.gz") {}).main
  ];
}
EOF

# Create scaffold script for consciousness DNA
cat > scaffold-consciousness-dna.sh << 'EOF'
#!/usr/bin/env bash

echo "🧬 Scaffolding Consciousness DNA..."

# Scaffold the main DNA
hc scaffold dna consciousness --no-spec

cd dnas/consciousness

# Scaffold the core zomes
echo "Creating consciousness integrity zome..."
hc scaffold zome consciousness_integrity --integrity consciousness_types --no-spec

echo "Creating consciousness coordinator zome..."
hc scaffold zome consciousness_coordinator --coordinator --no-spec

echo "Creating federated learning zome..."
hc scaffold zome federated_learning --integrity learning_types --coordinator --no-spec

echo "Creating safety validation zome..."
hc scaffold zome safety_validation --integrity safety_rules --coordinator --no-spec

echo "✅ DNA structure created!"
echo ""
echo "Next steps:"
echo "1. cd dnas/consciousness"
echo "2. Edit zome implementations"
echo "3. hc dna pack ."
echo "4. hc sandbox generate"
EOF

chmod +x scaffold-consciousness-dna.sh

# Create initial test script
cat > test-basic-network.sh << 'EOF'
#!/usr/bin/env bash

echo "🧪 Testing basic Holochain network..."

# Pack the DNA
cd dnas/consciousness
hc dna pack .

# Generate sandbox
hc sandbox generate ../workdir --run 8888

# Install app
hc sandbox call install-app consciousness

echo "✅ Basic network running on port 8888"
echo "Open http://localhost:8888 to view"
EOF

chmod +x test-basic-network.sh

echo "✅ Development environment setup complete!"
echo ""
echo "To enter the development shell:"
echo "  nix develop     # If using flake"
echo "  nix-shell       # If using shell.nix"
echo ""
echo "Then run:"
echo "  ./scaffold-consciousness-dna.sh"