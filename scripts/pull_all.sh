#!/bin/bash

# Configuration
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

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT_DIR="$( dirname "$SCRIPT_DIR" )"

echo "🚀 Starting Global Pull Protocol..."

# 0. Self-Repair: Restore git structures if needed
echo "🔧 Checking for git structure restoration..."
for service in "${SERVICES[@]}"; do
    if [ -d "$ROOT_DIR/$service/.git-preserved" ] && [ ! -d "$ROOT_DIR/$service/.git" ]; then
        echo "   > Restoring .git for $service..."
        mv "$ROOT_DIR/$service/.git-preserved" "$ROOT_DIR/$service/.git"
    fi
done

if [ -d "$ROOT_DIR/.github/.git-preserved" ] && [ ! -d "$ROOT_DIR/.github/.git" ]; then
    echo "   > Restoring .git for .github..."
    mv "$ROOT_DIR/.github/.git-preserved" "$ROOT_DIR/.github/.git"
fi

# 1. Sync individual microservices
echo "📦 Pulling latest changes for microservices..."
for service in "${SERVICES[@]}"; do
    if [ -d "$ROOT_DIR/$service" ]; then
        echo "⬇️  Updating $service..."
        cd "$ROOT_DIR/$service"
        
        if [ -d ".git" ]; then
             echo "   > Pulling from origin/main..."
             git pull origin main || echo "⚠️  Pull failed for $service, continuing..."
        else
            echo "ℹ️  $service is not a git repository (or .git is missing)."
        fi
    fi
done

# 2. Sync Master Vault (Root Monorepo)
echo "🔒 Pulling Master Vault..."
cd "$ROOT_DIR"
if [ -d ".git" ]; then
    echo "   > Pulling uniz-master-vault..."
    git pull origin main || echo "⚠️  Pull failed for Master Vault."
else
    echo "ℹ️  Root is not a git repository."
fi

echo "✨ All repositories updated."
