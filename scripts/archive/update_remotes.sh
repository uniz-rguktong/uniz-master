#!/bin/bash
# Update all microservice remotes to point to their individual repositories

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
ROOT_DIR="$(pwd)"

echo "🔗 Updating Git Remotes for All Microservices"
echo "=============================================="

for service in "${SERVICES[@]}"; do
    if [ -d "$ROOT_DIR/$service" ]; then
        cd "$ROOT_DIR/$service"
        
        REPO_URL="https://github.com/$ORG/$service.git"
        
        echo " $service -> $REPO_URL"
        
        # Check if remote exists
        if git remote | grep -q "^origin$"; then
            git remote set-url origin "$REPO_URL"
            echo "    Updated origin remote"
        else
            git remote add origin "$REPO_URL"
            echo "    Added origin remote"
        fi
    else
        echo "  $service directory not found, skipping..."
    fi
done

cd "$ROOT_DIR"

echo ""
echo "🎉 All remotes updated successfully!"
echo "=============================================="
echo "Verification:"
for service in "${SERVICES[@]}"; do
    if [ -d "$ROOT_DIR/$service" ]; then
        cd "$ROOT_DIR/$service"
        CURRENT_URL=$(git remote get-url origin 2>/dev/null || echo "NOT SET")
        echo "$service: $CURRENT_URL"
    fi
done

cd "$ROOT_DIR"
