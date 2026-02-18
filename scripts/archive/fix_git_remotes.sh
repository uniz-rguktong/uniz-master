#!/bin/bash
# Update git remotes for microservices to point to individual repos

ROOT_DIR=$(pwd)
ORG="uniz-rguktong"

fix_remote() {
    local svc=$1
    local repo=$svc
    
    if [ -d "$ROOT_DIR/$svc" ]; then
        cd "$ROOT_DIR/$svc"
        
        # Verify it is a git repo first
        if [ -d ".git" ]; then
             echo " Fixing remote for $svc..."
             
             # Remove existing origin
             git remote remove origin >/dev/null 2>&1
             
             # Add new origin pointing to individual repo
             git remote add origin "https://github.com/$ORG/$repo.git"
             
             echo "   -> Set origin to https://github.com/$ORG/$repo.git"
        else
             echo " $svc is not a git repository. Skipping."
             # Optional: git init? No, assume initialized.
        fi
        cd "$ROOT_DIR"
    fi
}

# List of all microservices
SERVICES="uniz-auth uniz-user uniz-outpass uniz-academics uniz-mail uniz-notifications uniz-files uniz-cron uniz-gateway uniz-infrastructure uniz-portal"

echo " Updating git remotes for all services..."

for svc in $SERVICES; do
    fix_remote "$svc"
done

echo " Remotes updated. You can now run 'npm run push' to push to individual repositories."
