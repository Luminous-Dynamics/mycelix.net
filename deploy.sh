#!/usr/bin/env bash

# Deploy mycelix.luminousdynamics.io to GitHub Pages
# Usage: ./deploy.sh

set -e  # Exit on error

echo "🚀 Deploying mycelix.luminousdynamics.io..."

# Check if we're in the right directory
if [ ! -f "index.html" ]; then
    echo "❌ Error: index.html not found. Run this script from the mycelix.luminousdynamics.io-pogq directory."
    exit 1
fi

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📦 Initializing git repository..."
    git init
fi

# Stage all files
echo "📝 Staging files..."
git add .

# Commit changes
echo "💾 Committing changes..."
git commit -m "🚀 Launch mycelix.luminousdynamics.io: Byzantine-Resistant Federated Learning

- 100% attack detection at 45% adversaries
- +23pp accuracy improvement over Multi-Krum
- HIPAA-compliant healthcare application
- Production-ready PostgreSQL backend
- PoGQ-focused landing page (not 5-layer protocol)
"

# Add remote if not already added
if ! git remote | grep -q "origin"; then
    echo "🔗 Adding remote origin..."
    git remote add origin git@github.com:Luminous-Dynamics/mycelix.luminousdynamics.io.git
fi

# Push to GitHub
echo "🚢 Pushing to GitHub..."
git branch -M main
git push -u origin main

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Go to https://github.com/Luminous-Dynamics/mycelix.luminousdynamics.io/settings/pages"
echo "2. Source: Deploy from a branch"
echo "3. Branch: main / (root)"
echo "4. Click 'Save'"
echo ""
echo "🌐 Your site will be live at https://mycelix.luminousdynamics.io in 2-3 minutes!"
echo ""
echo "📊 Monitor GitHub Pages build:"
echo "   https://github.com/Luminous-Dynamics/mycelix.luminousdynamics.io/actions"
