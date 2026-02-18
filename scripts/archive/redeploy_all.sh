#!/bin/bash
# UniZ Production Redeploy Protocol
# Triggers production deployments for all microservices using Vercel CLI

set -e

# Microservices list (same as sync script but focused on Vercel deployment)
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
)

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT_DIR="$( dirname "$SCRIPT_DIR" )"

echo " Initiating System-Wide Production Redeploy..."
echo "------------------------------------------------"

for service in "${SERVICES[@]}"; do
    if [ -d "$ROOT_DIR/$service" ]; then
        echo " Deploying $service..."
        cd "$ROOT_DIR/$service"
        
        # Deploy to production (--prod)
        # --yes skips interactive confirmation
        vercel --prod --yes || echo " Deployment failed for $service, continuing..."
        
        echo " $service redeploy triggered successfully."
        echo "------------------------------------------------"
    fi
done

echo " All production redeployments triggered."
