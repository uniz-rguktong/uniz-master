#!/bin/bash
ROOT_DIR=$(pwd)
declare -A REMOTES=(
    ["uniz-portal"]="https://github.com/uniz-rguktong/uniz-portal.git"
    ["uniz-mail"]="https://github.com/uniz-rguktong/uniz-mail.git"
    ["uniz-academics"]="https://github.com/uniz-rguktong/uniz-academics.git"
    ["uniz-outpass"]="https://github.com/uniz-rguktong/uniz-outpass.git"
    ["uniz-auth"]="https://github.com/uniz-rguktong/uniz-auth.git"
    ["uniz-user"]="https://github.com/uniz-rguktong/uniz-user-service.git"
    ["uniz-files"]="https://github.com/uniz-rguktong/uniz-files-service.git"
    ["uniz-notifications"]="https://github.com/uniz-rguktong/uniz-notification-service.git"
    ["uniz-cron"]="https://github.com/uniz-rguktong/uniz-cron-service.git"
    ["uniz-gateway"]="https://github.com/uniz-rguktong/uniz-production-gateway.git"
    ["uniz-infrastructure"]="https://github.com/uniz-rguktong/uniz-infrastructure.git"
)

for folder in "${!REMOTES[@]}"; do
    if [ -d "$folder" ]; then
        echo "Updating $folder -> ${REMOTES[$folder]}"
        cd "$folder"
        git remote remove origin 2>/dev/null || true
        git remote add origin "${REMOTES[$folder]}"
        git remote set-url origin "${REMOTES[$folder]}"
        git remote -v
        cd "$ROOT_DIR"
    fi
done
