#!/bin/bash
# Connect Vercel projects to GitHub repo

ROOT_DIR=$(pwd)
REPO_URL="https://github.com/uniz-rguktong/uniz-master-vault"

connect_project() {
    local svc=$1
    echo "🔗 Connecting $svc to GitHub..."
    if [ -d "$ROOT_DIR/$svc" ]; then
        cd "$ROOT_DIR/$svc"
        # Attempt to connect. 
        # Note: 'git connect' might be interactive. We use --yes but it might still ask for provider if URL isn't clear (though github.com is clear).
        npx vercel git connect "$REPO_URL" --yes || echo "   ❌ Failed to connect $svc"
        cd "$ROOT_DIR"
    fi
}

SERVICES="uniz-auth uniz-user uniz-outpass uniz-academics uniz-mail uniz-notifications uniz-files uniz-cron uniz-gateway"

echo "🚀 Connecting all Vercel projects to $REPO_URL..."

for svc in $SERVICES; do
    connect_project "$svc"
done

echo "✅ connection attempts finished."
