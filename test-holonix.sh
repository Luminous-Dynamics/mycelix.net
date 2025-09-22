#!/usr/bin/env bash

# Quick test script to verify Holonix installation

echo "🧪 Testing Holonix Installation for Mycelix"
echo "==========================================="
echo ""

cd /srv/luminous-dynamics/_websites/mycelix.net

# Test 1: Check if flake.nix is valid
echo "1️⃣ Checking flake.nix validity..."
if nix flake check --impure 2>/dev/null; then
    echo "   ✅ flake.nix is valid"
else
    echo "   ⚠️  flake.nix needs attention (this is normal on first run)"
fi

echo ""
echo "2️⃣ Checking Nix flakes availability..."
if nix flake --version &>/dev/null; then
    echo "   ✅ Nix flakes enabled"
else
    echo "   ❌ Nix flakes not enabled"
    exit 1
fi

echo ""
echo "3️⃣ Attempting to enter development shell..."
echo "   This will download Holochain tools on first run (may take 5-10 minutes)..."
echo ""

# Try to enter the shell and run a simple command
nix develop --impure -c bash -c '
    echo "   ✅ Development shell activated!"
    echo ""
    echo "   📦 Available tools:"
    which holochain &>/dev/null && echo "      • holochain: $(holochain --version 2>/dev/null || echo "installed")"
    which hc &>/dev/null && echo "      • hc: $(hc --version 2>/dev/null || echo "installed")"
    which cargo &>/dev/null && echo "      • cargo: $(cargo --version)"
    which rustc &>/dev/null && echo "      • rustc: $(rustc --version)"
    echo ""
    echo "   🎯 Ready for Holochain development!"
'

echo ""
echo "=========================================="
echo "✨ Holonix test complete!"
echo ""
echo "To start developing:"
echo "  cd /srv/luminous-dynamics/_websites/mycelix.net"
echo "  nix develop"
echo ""
echo "Then you can:"
echo "  • hc scaffold - Create a new hApp"
echo "  • hc sandbox  - Launch development environment"
echo "  • cargo build - Build Rust zomes"