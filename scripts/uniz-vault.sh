#!/bin/bash

# UniZ Vault Management Tool
# This tool handles secure secret synchronization between local dev and VPS.

VPS_IP="76.13.241.174"
REMOTE_SECRETS_PATH="/root/uniz-secrets.env"
LOCAL_SECRETS_BAK="infra/core-infra/kubernetes/base/secrets.yaml.bak"

function check_auth() {
    # Check if we can SSH into the VPS without manual password entry
    # This ensures only authorized devs with the SSH key can manage secrets
    ssh -o ConnectTimeout=5 -o BatchMode=yes root@$VPS_IP "echo 'Auth OK'" &>/dev/null
    if [ $? -ne 0 ]; then
        echo "❌ [Auth] Authorization failed. You must have the authorized SSH key to use the vault."
        exit 1
    fi
}

function get_secrets() {
    check_auth
    echo "📥 [Vault] Downloading secrets from VPS..."
    scp root@$VPS_IP:$REMOTE_SECRETS_PATH ./secrets.env
    echo "✅ [Vault] Secrets saved to ./secrets.env (Keep this file out of Git!)"
}

function set_secrets() {
    check_auth
    if [ ! -f "secrets.env" ]; then
        echo "❌ [Vault] Local secrets.env not found. Run 'get' first or create one."
        exit 1
    fi
    echo "📤 [Vault] Uploading secrets to VPS..."
    scp secrets.env root@$VPS_IP:$REMOTE_SECRETS_PATH
    echo "🚀 [Vault] Secrets updated on VPS. Deploy to apply changes."
}

case "$1" in
    get)
        get_secrets
        ;;
    set)
        set_secrets
        ;;
    *)
        echo "Usage: $0 {get|set}"
        exit 1
        ;;
esac
