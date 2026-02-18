#!/bin/bash
# UniZ Production-Grade Multi-Repo Sync Logic - Version 3.0 (Structured)
# Consolidates all microservices and syncs with the Master Vault
#
# NOTE: Structure has been organized into apps/ and infra/ folders.

set -e

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

# Get the directory where the script is located and resolve its parent
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT_DIR="$( cd "$SCRIPT_DIR/../.." && pwd )"
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
COMMIT_MSG="production: system-wide update & vault sync [$TIMESTAMP]"

echo " Starting Production Sync Protocol (Structured)..."

# 0. Self-Repair: Restore git structures
echo " Checking for git structure restoration..."
for app in "${APPS[@]}"; do
    TARGET_DIR="$ROOT_DIR/apps/$app"
    if [ -d "$TARGET_DIR/.git-preserved" ] && [ ! -d "$TARGET_DIR/.git" ]; then
        echo "   > Restoring .git for $app..."
        mv "$TARGET_DIR/.git-preserved" "$TARGET_DIR/.git"
    fi
done

for infra in "${INFRA_SERVICES[@]}"; do
    TARGET_DIR="$ROOT_DIR/infra/$infra"
    if [ -d "$TARGET_DIR/.git-preserved" ] && [ ! -d "$TARGET_DIR/.git" ]; then
        echo "   > Restoring .git for $infra..."
        mv "$TARGET_DIR/.git-preserved" "$TARGET_DIR/.git"
    fi
done

# 1. Sync individual microservices (Apps)
for app in "${APPS[@]}"; do
    TARGET_DIR="$ROOT_DIR/apps/$app"
    if [ -d "$TARGET_DIR" ]; then
        echo " Processing $app..."
        cd "$TARGET_DIR"
        
        if git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
            git add .
            HAS_CHANGES=false
            if ! git diff --cached --quiet; then
                HAS_CHANGES=true
                git commit -m "feat: stable update [$TIMESTAMP]"
            fi
            
            if git rev-parse --verify origin/main >/dev/null 2>&1; then
                if [ "$(git rev-list HEAD...origin/main --count 2>/dev/null)" != "0" ]; then
                    HAS_CHANGES=true
                fi
            fi
            
            if [ "$HAS_CHANGES" = true ]; then
                echo "   > Pushing changes to origin..."
                git push origin main --force || echo " Push failed for $app, continuing..."
            else
                echo " $app is already up to date."
            fi
        fi
    fi
done

# 2. Sync Infra Services
for infra in "${INFRA_SERVICES[@]}"; do
    TARGET_DIR="$ROOT_DIR/infra/$infra"
    if [ -d "$TARGET_DIR" ]; then
        echo " Processing $infra..."
        cd "$TARGET_DIR"
        if git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
            git add .
            if ! git diff --cached --quiet; then
                git commit -m "feat: infrastructure update [$TIMESTAMP]"
            fi
            echo "   > Pushing changes to origin..."
            git push origin main --force || echo " Push failed for $infra, continuing..."
        fi
    fi
done

# 3. Sync Master Vault (Root Monorepo)
echo " Synchronizing Master Vault..."
cd "$ROOT_DIR"

# Temporary move .git folders to force root to track contents
echo "   > Preparing file structure for vault ingestion..."
for app in "${APPS[@]}"; do
    if [ -d "apps/$app/.git" ]; then
        mv "apps/$app/.git" "apps/$app/.git-preserved"
    fi
done
for infra in "${INFRA_SERVICES[@]}"; do
    if [ -d "infra/$infra/.git" ]; then
        mv "infra/$infra/.git" "infra/$infra/.git-preserved"
    fi
done

git add .
if ! git diff --cached --quiet; then
    git commit -m "$COMMIT_MSG"
    echo "   > Pushing to Master Vault..."
    git push origin main --force
    echo " Master Vault synchronized successfully."
else
    echo " Master Vault is already in sync."
fi

# 4. Restore environment
echo "   > Restoring internal git structures..."
for app in "${APPS[@]}"; do
    if [ -d "apps/$app/.git-preserved" ]; then
        mv "apps/$app/.git-preserved" "apps/$app/.git"
    fi
done
for infra in "${INFRA_SERVICES[@]}"; do
    if [ -d "infra/$infra/.git-preserved" ]; then
        mv "infra/$infra/.git-preserved" "infra/$infra/.git"
    fi
done

echo " All systems synchronized."
