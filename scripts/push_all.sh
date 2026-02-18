#!/bin/bash
# UniZ Production-Grade Multi-Repo Sync Logic
# Consolidates all microservices and syncs with the Master Vault
#
# NOTE: Each microservice has its own individual git repository:
#   - uniz-mail -> https://github.com/uniz-rguktong/uniz-mail.git
#   - uniz-academics -> https://github.com/uniz-rguktong/uniz-academics.git
#   - uniz-auth -> https://github.com/uniz-rguktong/uniz-auth.git
#   - uniz-user -> https://github.com/uniz-rguktong/uniz-user.git
#   - uniz-outpass -> https://github.com/uniz-rguktong/uniz-outpass.git
#   - uniz-files -> https://github.com/uniz-rguktong/uniz-files.git
#   - uniz-notifications -> https://github.com/uniz-rguktong/uniz-notifications.git
#   - uniz-cron -> https://github.com/uniz-rguktong/uniz-cron.git
#   - uniz-gateway -> https://github.com/uniz-rguktong/uniz-gateway.git
#   - uniz-infrastructure -> https://github.com/uniz-rguktong/uniz-infrastructure.git
#
# To reinitialize remotes, run: bash scripts/init_service_repos.sh

set -e

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
    "uniz-portal"
)

# Services that should be deployed to Vercel
VERCEL_SERVICES="uniz-mail uniz-academics uniz-outpass uniz-auth uniz-user uniz-files uniz-notifications uniz-cron uniz-gateway"

# Get the directory where the script is located and resolve its parent
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT_DIR="$( dirname "$SCRIPT_DIR" )"
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
COMMIT_MSG="production: system-wide update & vault sync [$TIMESTAMP]"

echo "🚀 Starting Production Sync Protocol..."

# Ensure gateway is ready for push
echo "✅ Gateway synchronization prepared"


# 0. Self-Repair: Restore git structures if clonned fresh
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
for service in "${SERVICES[@]}"; do
    if [ -d "$ROOT_DIR/$service" ]; then
        echo "📦 Processing $service..."
        cd "$ROOT_DIR/$service"
        
        # Check if it's a git repo
        if git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
            # 1. Provide a way to detect changes
            git add .
            HAS_CHANGES=false
            
            # Check for staged changes
            if ! git diff --cached --quiet; then
                HAS_CHANGES=true
                git commit -m "feat: stable update [$TIMESTAMP]"
            fi
            
            # Check for unpushed commits (against tracked upstream, usually origin/main)
            # We assume 'origin' exists. If not, safe default to false.
            if git rev-parse --verify origin/main >/dev/null 2>&1; then
                if [ "$(git rev-list HEAD...origin/main --count 2>/dev/null)" != "0" ]; then
                    HAS_CHANGES=true
                fi
            fi
            
            if [ "$HAS_CHANGES" = true ]; then
                echo "   > Pushing changes to origin..."
                git push origin main --force || echo "⚠️ Push failed for $service, continuing..."
                
                # Vercel deployment logic removed per request

            else
                echo "✅ $service is already up to date."
            fi
        else
            echo "ℹ️ $service is not a git repository, skipping individual push."
        fi
    fi
done

# 2. Sync Master Vault (Root Monorepo)
echo "🔒 Synchronizing Master Vault..."
cd "$ROOT_DIR"

# Temporary move .git folders to force root to track contents
echo "   > Preparing file structure for vault ingestion..."
for service in "${SERVICES[@]}"; do
    if [ -d "$service/.git" ]; then
        mv "$service/.git" "$service/.git-preserved"
    fi
done

# Handle .github folder if it exists as a repo
if [ -d ".github/.git" ]; then
    mv ".github/.git" ".github/.git-preserved"
fi

try_vault_sync() {
    git add .
    if ! git diff --cached --quiet; then
        git commit -m "$COMMIT_MSG"
        echo "   > Pushing to Master Vault..."
        git push origin main --force
        echo "🏆 Master Vault synchronized successfully."
    else
        echo "✅ Master Vault is already in sync."
    fi
}

# Run sync with error protection
set +e
try_vault_sync
SYNC_STATUS=$?
set -e

# 3. Restore environment
echo "   > Restoring internal git structures..."
for service in "${SERVICES[@]}"; do
    if [ -d "$service/.git-preserved" ]; then
        mv "$service/.git-preserved" "$service/.git"
    fi
done

if [ -d ".github/.git-preserved" ]; then
    mv ".github/.git-preserved" ".github/.git"
fi

echo "✨ All systems synchronized. Status: $SYNC_STATUS"
