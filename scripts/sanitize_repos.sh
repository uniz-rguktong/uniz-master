#!/bin/bash
# Script to forcefully sanitize microservice repositories
ROOT_DIR=$(pwd)
SERVICES=("uniz-portal" "uniz-mail" "uniz-academics" "uniz-outpass" "uniz-auth" "uniz-user" "uniz-files" "uniz-notifications" "uniz-cron" "uniz-gateway")

for svc in "${SERVICES[@]}"; do
    if [ -d "$svc" ]; then
        echo "🧼 Sanitizing $svc..."
        cd "$ROOT_DIR/$svc"
        
        # Check current remote
        REMOTE=$(git remote get-url origin)
        echo "   > Remote: $REMOTE"
        
        # Force a clean history on the local side pointing to this folder only
        git checkout --orphan sanitized-branch
        git add -A
        git commit -m "production: sanitized independent build [$(date)]"
        git branch -D main 2>/dev/null || true
        git branch -m main
        git push -f origin main
        
        cd "$ROOT_DIR"
    fi
done
