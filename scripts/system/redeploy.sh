#!/bin/bash
# Master script to trigger redeploy for all UniZ services

APPS=(
    "uniz-academics"
    "uniz-auth"
    "uniz-cron"
    "uniz-files"
    "uniz-gateway"
    "uniz-mail"
    "uniz-notifications"
    "uniz-outpass"
    "uniz-user"
)

INFRA=("core-infra")

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT_DIR="$( cd "$SCRIPT_DIR/../.." && pwd )"

echo " Initiating System-Wide Recovery Deployment (Structured)..."
echo "------------------------------------------------"

for app in "${APPS[@]}"; do
    DIR="$ROOT_DIR/apps/$app"
    if [ -d "$DIR" ]; then
        echo " Service: $app"
        cd "$DIR"
        if [ -f "./redeploy.sh" ]; then
            ./redeploy.sh || echo " Failed to trigger $app, continuing..."
        else
            echo " No redeploy.sh found in $app"
        fi
        echo "------------------------------------------------"
    fi
done

for i in "${INFRA[@]}"; do
    DIR="$ROOT_DIR/infra/$i"
    if [ -d "$DIR" ]; then
        echo " Infrastructure: $i"
        cd "$DIR"
        if [ -f "./redeploy.sh" ]; then
            ./redeploy.sh || echo " Failed to trigger $i, continuing..."
        fi
        echo "------------------------------------------------"
    fi
done

echo " All recovery deployments have been signaled."
echo "Wait a few minutes for Vercel to pick up and process the builds."
