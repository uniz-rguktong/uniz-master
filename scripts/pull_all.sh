#!/bin/bash

# Configuration
APPS=(
    "uniz-mail"
    "uniz-academics"
    "uniz-outpass"
    "uniz-auth"
    "uniz-user"
    "uniz-files"
    "uniz-notifications"
    "uniz-cron"
    "uniz-gateway"
    "uniz-portal"
)

INFRA_SERVICES=(
    "core-infra"
)

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT_DIR="$( dirname "$SCRIPT_DIR" )"

echo "🚀 Starting Global Pull Protocol (Structured)..."

# 1. Sync Apps
echo "📦 Pulling latest changes for apps..."
for app in "${APPS[@]}"; do
    TARGET_DIR="$ROOT_DIR/apps/$app"
    if [ -d "$TARGET_DIR" ]; then
        echo "⬇️  Updating $app..."
        cd "$TARGET_DIR"
        if [ -d ".git" ]; then
             echo "   > Pulling from origin/main..."
             git pull origin main || echo "⚠️  Pull failed for $app, continuing..."
        else
            echo "ℹ️  $app is not a git repository."
        fi
    fi
done

# 2. Sync Infra
for infra in "${INFRA_SERVICES[@]}"; do
    TARGET_DIR="$ROOT_DIR/infra/$infra"
    if [ -d "$TARGET_DIR" ]; then
        echo "⬇️  Updating $infra..."
        cd "$TARGET_DIR"
        if [ -d ".git" ]; then
             echo "   > Pulling from origin/main..."
             git pull origin main || echo "⚠️  Pull failed for $infra, continuing..."
        fi
    fi
done

# 3. Sync Master Vault (Root Monorepo)
echo "🔒 Pulling Master Vault..."
cd "$ROOT_DIR"
if [ -d ".git" ]; then
    echo "   > Pulling uniz-master-vault..."
    git pull origin main || echo "⚠️  Pull failed for Master Vault."
else
    echo "ℹ️  Root is not a git repository."
fi

echo "✨ All repositories updated."
