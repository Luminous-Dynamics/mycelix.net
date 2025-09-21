#!/bin/bash
# Real-time monitor for Holonix installation

clear
echo "🌊 Mycelix Consciousness Network - Holonix Installation Monitor"
echo "================================================================"
echo ""

# Function to get colorized status
get_status_color() {
    case "$1" in
        "SUCCESS") echo -e "\033[32m✅ SUCCESS\033[0m" ;;
        "ERROR"*) echo -e "\033[31m❌ ERROR\033[0m" ;;
        "DOWNLOADING") echo -e "\033[33m📥 DOWNLOADING\033[0m" ;;
        *) echo -e "\033[36m⏳ $1\033[0m" ;;
    esac
}

# Function to estimate progress
estimate_progress() {
    local total_packages=500  # Approximate
    local built=$(grep -c "^building '/nix/store/.*-cargo-package-" holonix-download.log 2>/dev/null || echo 0)
    local percent=$((built * 100 / total_packages))
    echo "$percent"
}

# Main monitoring loop
while true; do
    # Get current status
    STATUS=$(cat holonix-status.txt 2>/dev/null || echo "Not started")
    STATUS_COLOR=$(get_status_color "$STATUS")
    
    # Check if process is running
    if pgrep -f "download-holonix.sh" > /dev/null; then
        PROCESS_STATUS="🟢 Running"
    else
        PROCESS_STATUS="🔴 Stopped"
    fi
    
    # Get progress estimate
    PROGRESS=$(estimate_progress)
    
    # Display header
    clear
    echo "🌊 Mycelix Consciousness Network - Holonix Installation Monitor"
    echo "================================================================"
    echo ""
    echo "Status: $STATUS_COLOR"
    echo "Process: $PROCESS_STATUS"
    echo ""
    
    # Progress bar
    echo -n "Progress: ["
    for i in $(seq 1 20); do
        if [ $((i * 5)) -le $PROGRESS ]; then
            echo -n "█"
        else
            echo -n "░"
        fi
    done
    echo "] $PROGRESS%"
    echo ""
    
    # Current activity
    echo "Current Activity:"
    echo "----------------"
    if [ -f holonix-download.log ]; then
        tail -5 holonix-download.log | sed 's/^/  /'
    fi
    echo ""
    
    # Stats
    echo "Statistics:"
    echo "-----------"
    PACKAGES_BUILT=$(grep -c "^building" holonix-download.log 2>/dev/null || echo 0)
    LOG_SIZE=$(du -h holonix-download.log 2>/dev/null | cut -f1)
    ELAPSED_MIN=$(( ($(date +%s) - $(stat -c %Y holonix-download.log 2>/dev/null || date +%s)) / 60 ))
    
    echo "  📦 Packages built: $PACKAGES_BUILT"
    echo "  📄 Log size: ${LOG_SIZE:-0}"
    echo "  ⏱️ Elapsed time: ${ELAPSED_MIN} minutes"
    echo ""
    
    # Check for completion
    if [ "$STATUS" == "SUCCESS" ]; then
        echo "🎉 Installation Complete!"
        echo ""
        echo "Next Steps:"
        echo "1. Enter development environment: nix develop"
        echo "2. Create consciousness hApp: hc scaffold dna consciousness"
        echo "3. Implement zomes in Rust"
        echo "4. Connect AI agents via Ollama"
        break
    elif [[ "$STATUS" == ERROR* ]]; then
        echo "❌ Installation Failed!"
        echo ""
        echo "Check holonix-download.log for details"
        echo "Common fixes:"
        echo "  - Check internet connection"
        echo "  - Try different Nix cache: --option substituters 'https://cache.nixos.org'"
        echo "  - Use stable version: Edit flake.nix to use main-0.5"
        break
    fi
    
    echo "Press Ctrl+C to exit monitor (installation continues in background)"
    sleep 5
done