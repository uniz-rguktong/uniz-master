#!/bin/bash
# Initialize git repos for all microservices and set correct remotes

set -e

SERVICES=(
    "uniz-mail"
    "uniz-academics"
    "uniz-outpass"
    "uniz-auth"
    "uniz-user"
    "uniz-files"
    "uniz-notifications"
    "uniz-cron"
    "uniz-gateway"
    "uniz-infrastructure"
)

ORG="uniz-rguktong"

echo "🔧 Initializing Git Repos for All Microservices"
echo "================================================"

for service in "${SERVICES[@]}"; do
    if [ -d "$service" ]; then
        echo "📦 Processing $service..."
        cd "$service"
        
        # Initialize git if not already done
        if [ ! -d ".git" ]; then
            echo "   🆕 Initializing git repository"
            git init
            git branch -M main
        fi
        
        # Set remote URL
        REPO_URL="https://github.com/$ORG/$service.git"
        
        if git remote | grep -q "^origin$"; then
            git remote set-url origin "$REPO_URL"
            echo "   ✅ Updated origin -> $REPO_URL"
        else
            git remote add origin "$REPO_URL"
            echo "   ✅ Added origin -> $REPO_URL"
        fi
        
        # Add initial commit if no commits exist
        if ! git rev-parse HEAD &>/dev/null; then
            git add .
            git commit -m "chore: initialize repository from monorepo"
            echo "   📝 Created initial commit"
        fi
        
        cd ..
    else
        echo "⚠️  $service directory not found, skipping..."
    fi
done

echo ""
echo "🎉 All microservices initialized successfully!"
echo "================================================"
echo "Verification:"
for service in "${SERVICES[@]}"; do
    if [ -d "$service/.git" ]; then
        cd "$service"
        CURRENT_URL=$(git remote get-url origin 2>/dev/null || echo "NOT SET")
        echo "✅ $service: $CURRENT_URL"
        cd ..
    else
        echo "❌ $service: No git repo"
    fi
done
