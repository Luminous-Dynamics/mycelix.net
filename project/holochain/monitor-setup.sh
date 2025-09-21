#!/bin/bash
# Monitor Holonix setup progress

echo "📊 Holonix Setup Monitor"
echo "========================"
echo ""

# Check if setup is running
if ps -p 1884309 > /dev/null 2>&1; then
    echo "✅ Setup is running (PID: 1884309)"
    echo ""
    echo "📝 Latest output:"
    echo "---"
    tail -20 holonix-setup.log
    echo "---"
    echo ""
    echo "💡 To see full log: tail -f holonix-setup.log"
else
    echo "✨ Setup completed or stopped!"
    echo ""
    echo "📝 Final output:"
    echo "---"
    tail -30 holonix-setup.log
    echo "---"
    
    # Check if successful
    if grep -q "Setup Complete!" holonix-setup.log; then
        echo ""
        echo "🎉 SUCCESS! Holonix is ready."
        echo ""
        echo "Next steps:"
        echo "1. Enter dev shell: nix develop"
        echo "2. Create hApp: hc scaffold dna consciousness"
    elif grep -q "Failed to set up" holonix-setup.log; then
        echo ""
        echo "❌ Setup failed. Check holonix-setup.log for details."
    fi
fi

# Check disk usage
echo ""
echo "💾 Nix store usage:"
df -h /nix/store | tail -1

# Estimate time remaining
if ps -p 1884309 > /dev/null 2>&1; then
    START_TIME=$(stat -c %Y holonix-setup.log)
    CURRENT_TIME=$(date +%s)
    ELAPSED=$((CURRENT_TIME - START_TIME))
    
    echo ""
    echo "⏱️  Elapsed time: $((ELAPSED / 60)) minutes"
    echo "⏳ Estimated remaining: 10-15 minutes (first run)"
fi