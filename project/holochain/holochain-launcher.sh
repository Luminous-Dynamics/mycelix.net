#!/usr/bin/env bash

# Alternative approach: Use Holochain Launcher AppImage
set -e

echo "🧬 Installing Holochain Launcher (AppImage)"
echo "==========================================="
echo ""
echo "This provides a complete Holochain runtime with GUI"
echo ""

LAUNCHER_VERSION="v0.11.5"
LAUNCHER_URL="https://github.com/holochain/launcher/releases/download/${LAUNCHER_VERSION}/holochain-launcher-${LAUNCHER_VERSION}-x86_64.AppImage"

if [ ! -f "holochain-launcher.AppImage" ]; then
    echo "Downloading Holochain Launcher..."
    curl -L -o holochain-launcher.AppImage "$LAUNCHER_URL"
    chmod +x holochain-launcher.AppImage
    echo "✅ Downloaded Holochain Launcher"
else
    echo "✅ Holochain Launcher already downloaded"
fi

# Extract the AppImage to get the binaries
if [ ! -d "holochain-launcher-extracted" ]; then
    echo "Extracting Holochain binaries..."
    ./holochain-launcher.AppImage --appimage-extract
    mv squashfs-root holochain-launcher-extracted
    echo "✅ Extracted Holochain binaries"
fi

# Find the holochain binary
HOLOCHAIN_BIN=$(find holochain-launcher-extracted -name "holochain" -type f -executable 2>/dev/null | head -n1)
HC_BIN=$(find holochain-launcher-extracted -name "hc" -type f -executable 2>/dev/null | head -n1)

if [ -n "$HOLOCHAIN_BIN" ]; then
    echo "✅ Found holochain at: $HOLOCHAIN_BIN"
    $HOLOCHAIN_BIN --version || echo "Version check failed"
else
    echo "⚠️  Holochain binary not found in AppImage"
fi

if [ -n "$HC_BIN" ]; then
    echo "✅ Found hc at: $HC_BIN"
    $HC_BIN --version || echo "Version check failed"
else
    echo "⚠️  HC CLI not found in AppImage"
fi

echo ""
echo "Alternative: Run the full Launcher GUI:"
echo "  ./holochain-launcher.AppImage"
echo ""
echo "This will start a complete Holochain environment with:"
echo "  - Conductor running"
echo "  - Admin interface"
echo "  - App management GUI"
echo ""