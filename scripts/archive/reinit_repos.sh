#!/bin/bash
# Re-initialize individual git repositories for microservices
# Points them to their dedicated uniz-rguktong repositories.

ROOT_DIR=$(pwd)
ORG="uniz-rguktong"
SERVICES="uniz-auth uniz-user uniz-outpass uniz-academics uniz-mail uniz-notifications uniz-files uniz-cron uniz-gateway uniz-infrastructure uniz-portal"

echo " Re-initializing Service Repositories..."

fix_repo() {
    local svc=$1
    if [ -d "$ROOT_DIR/$svc" ]; then
        cd "$ROOT_DIR/$svc"
        
        # Check if git exists
        if [ ! -d ".git" ]; then
            echo " Initializing new git repo for $svc..."
            git init
            git branch -M main
        else
            echo "  Existing git repo found in $svc."
        fi
        
        # Configure Remote
        EXISTING_REMOTE=$(git remote get-url origin 2>/dev/null)
        TARGET_REMOTE="https://github.com/$ORG/$svc.git"
        
        if [ "$EXISTING_REMOTE" != "$TARGET_REMOTE" ]; then
            echo "   -> Updating remote to $TARGET_REMOTE"
            git remote remove origin >/dev/null 2>&1
            git remote add origin "$TARGET_REMOTE"
        else
            echo "   -> Remote already correct: $TARGET_REMOTE"
        fi
        
        # Ensure main branch tracking
        # If no commits exist, we commit current state
        if ! git rev-parse HEAD >/dev/null 2>&1; then
             git add .
             git commit -m "feat: initialize service repository" >/dev/null 2>&1 || true
        fi
        
        cd "$ROOT_DIR"
    fi
}

for svc in $SERVICES; do
    fix_repo "$svc"
done

echo " Repositories configured. Ready for 'npm run push'."
