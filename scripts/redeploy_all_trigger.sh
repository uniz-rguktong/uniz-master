#!/bin/bash
# Master script to trigger redeploy for all UniZ services

SERVICES=(
    "uniz-academics"
    "uniz-auth"
    "uniz-cron"
    "uniz-files"
    "uniz-gateway"
    "uniz-mail"
    "uniz-notifications"
    "uniz-outpass"
    "uniz-user"
    "uniz-infrastructure"
)

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT_DIR="$( dirname "$SCRIPT_DIR" )"

echo "🚀 Initiating System-Wide Recovery Deployment..."
echo "------------------------------------------------"

for service in "${SERVICES[@]}"; do
    if [ -d "$ROOT_DIR/$service" ]; then
        echo "🌐 Service: $service"
        cd "$ROOT_DIR/$service"
        if [ -f "./redeploy.sh" ]; then
            ./redeploy.sh || echo "⚠️ Failed to trigger $service, continuing..."
        else
            echo "⚠️ No redeploy.sh found in $service"
        fi
        echo "------------------------------------------------"
    fi
done

echo "🏆 All recovery deployments have been signaled."
echo "Wait a few minutes for Vercel to pick up and process the builds."
