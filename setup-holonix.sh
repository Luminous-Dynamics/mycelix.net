#!/usr/bin/env bash

# Mycelix Holonix Setup Script
# Sets up Holochain development environment using Nix flakes

set -e

echo "🍄 Mycelix Holonix Setup"
echo "========================"
echo ""

# Check if Nix is installed
if ! command -v nix &> /dev/null; then
    echo "❌ Nix is not installed. Please install Nix first."
    echo "Visit: https://nixos.org/download.html"
    exit 1
fi

# Check if flakes are enabled
if ! nix flake --version &> /dev/null; then
    echo "⚠️  Nix flakes are not enabled. Enabling them now..."
    mkdir -p ~/.config/nix
    echo "experimental-features = nix-command flakes" >> ~/.config/nix/nix.conf
    echo "✅ Flakes enabled. You may need to restart your shell."
fi

echo "📦 Installing Holonix development environment..."
echo "This may take a while on first run as it downloads Holochain tools..."
echo ""

# Initialize git if not already
if [ ! -d .git ]; then
    git init
    git add flake.nix
    git commit -m "Add Holonix flake configuration"
fi

# Enter the development shell
echo "🚀 Entering Holonix development shell..."
echo ""

# Use nix develop to enter the shell
nix develop --impure -c bash -c '
    echo "✅ Holonix environment loaded!"
    echo ""
    echo "🧬 Creating example Holochain app structure..."
    
    # Create basic hApp structure if it doesn'"'"'t exist
    if [ ! -f "workdir/dna.yaml" ]; then
        mkdir -p workdir/zomes
        
        # Create a basic DNA config
        cat > workdir/dna.yaml <<EOF
manifest_version: "1"
name: mycelix_consciousness_network
properties: ~
zomes:
  - name: consciousness_field
    bundled: zomes/consciousness_field.wasm
EOF
        
        echo "📁 Created basic hApp structure in workdir/"
    fi
    
    echo ""
    echo "🎯 Next steps:"
    echo "  1. Run: nix develop"
    echo "  2. Use: hc scaffold to create a new hApp"
    echo "  3. Or: hc sandbox to launch the development environment"
    echo ""
    echo "📚 Resources:"
    echo "  - Holochain Docs: https://developer.holochain.org"
    echo "  - Holonix Guide: https://github.com/holochain/holonix"
    echo ""
    exec bash
'

echo ""
echo "💡 To re-enter the environment later, just run:"
echo "   cd $(pwd)"
echo "   nix develop"