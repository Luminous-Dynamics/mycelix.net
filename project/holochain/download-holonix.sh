#!/usr/bin/env bash
# Download and cache Holonix environment in background

LOG_FILE="holonix-download.log"
LOCK_FILE="/tmp/holonix-download.lock"
STATUS_FILE="holonix-status.txt"

# Prevent multiple instances
if [ -f "$LOCK_FILE" ]; then
    echo "⚠️  Download already in progress (PID: $(cat $LOCK_FILE))"
    exit 0
fi

echo $$ > "$LOCK_FILE"
trap "rm -f $LOCK_FILE" EXIT

echo "🚀 Starting Holonix download..." | tee "$LOG_FILE"
echo "DOWNLOADING" > "$STATUS_FILE"
echo "Started: $(date)" >> "$LOG_FILE"

# Function to update status
update_status() {
    echo "$1" > "$STATUS_FILE"
    echo "[$(date '+%H:%M:%S')] $1" >> "$LOG_FILE"
}

# Phase 1: Update flake
update_status "Phase 1/3: Updating flake.lock..."
if ! nix flake update --extra-experimental-features 'nix-command flakes' >> "$LOG_FILE" 2>&1; then
    update_status "ERROR: Failed to update flake"
    exit 1
fi

# Phase 2: Download dependencies
update_status "Phase 2/3: Downloading Holonix (10-20 min)..."
if ! nix develop --extra-experimental-features 'nix-command flakes' --impure --profile holonix-profile --command echo "Downloaded" >> "$LOG_FILE" 2>&1; then
    update_status "ERROR: Failed to download Holonix"
    exit 1
fi

# Phase 3: Verify installation
update_status "Phase 3/3: Verifying installation..."
if nix develop --extra-experimental-features 'nix-command flakes' --impure --command bash -c 'holochain --version && hc --version' >> "$LOG_FILE" 2>&1; then
    HOLOCHAIN_VERSION=$(nix develop --extra-experimental-features 'nix-command flakes' --impure --command holochain --version 2>/dev/null)
    HC_VERSION=$(nix develop --extra-experimental-features 'nix-command flakes' --impure --command hc --version 2>/dev/null)
    
    update_status "SUCCESS"
    echo "" >> "$LOG_FILE"
    echo "✅ Holonix Ready!" >> "$LOG_FILE"
    echo "  Holochain: $HOLOCHAIN_VERSION" >> "$LOG_FILE"
    echo "  hc: $HC_VERSION" >> "$LOG_FILE"
    echo "Completed: $(date)" >> "$LOG_FILE"
else
    update_status "ERROR: Installation verification failed"
    exit 1
fi

rm -f "$LOCK_FILE"