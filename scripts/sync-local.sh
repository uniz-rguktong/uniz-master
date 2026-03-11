#!/bin/bash
# --- UniZ Universal Sync & Setup (V1) ---
# Goal: Automate the repetitive Stash -> Pull -> Pop -> Setup workflow.

echo "🔄 Harmonizing local repository with origin..."

# Ensure we are in the root directory
cd "$(dirname "$0")/.." || exit 1

# 1. Stash changes
echo "📦 Stashing local changes..."
STASH_OUT=$(git stash 2>&1)
STASHED=false
if [[ "$STASH_OUT" != "No local changes to save" ]]; then
    STASHED=true
    echo "✅ Changes stashed."
else
    echo "ℹ️ No local changes to stash."
fi

# 2. Pull latest
echo "📥 Pulling latest changes from main..."
if ! git pull origin main; then
    echo "❌ git pull failed. Please resolve issues manually."
    exit 1
fi

# 3. Pop stash
if [ "$STASHED" = true ]; then
    echo "🔓 Restoring local changes..."
    if ! git stash pop; then
        echo "⚠️ Conflict detected during stash pop! Please resolve conflicts manually."
        echo "⚠️ Once resolved, you may need to run ./scripts/setup-local.sh"
        exit 1
    fi
    echo "✅ Stash restored successfully."
fi

# 4. Run setup
echo "🛠️ Re-aligning local environment..."
bash ./scripts/setup-local.sh
