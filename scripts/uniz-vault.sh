#!/bin/bash
# ==============================================================================
# UNIZ INFRASTRUCTURE - SECURE VAULT MANAGEMENT TOOL
# ==============================================================================
# Author: UNIZ Engineering
# Description: Orchestrates secret synchronization between Local Dev & VPS.
# Features: Batch Sync, App-specific Mapping, Remote State Retrieval.
# ==============================================================================

# ------------------------------------------------------------------------------
# 1. CONFIGURATION & STATE
# ------------------------------------------------------------------------------

VPS_IP="76.13.241.174"
REMOTE_SECRETS_PATH="/root/uniz-secrets.env"
LOCAL_SECRETS_BAK="infra/core-infra/kubernetes/base/secrets.yaml.bak"

# ------------------------------------------------------------------------------
# 2. SECURITY & AUTHORIZATION
# ------------------------------------------------------------------------------

function check_auth() {
    # CRITICAL: BatchMode=yes prevents the script from hanging on password prompts.
    # Access is strictly controlled via pre-authorized SSH keys on the VPS.
    ssh -o ConnectTimeout=5 -o BatchMode=yes root@$VPS_IP "echo 'Auth OK'" &>/dev/null
    if [ $? -ne 0 ]; then
        echo "❌ [Auth] Authorization failed. You must have the authorized SSH key to use the vault."
        exit 1
    fi
}

# ------------------------------------------------------------------------------
# 3. REMOTE STATE MANAGEMENT (FETCH/PUSH)
# ------------------------------------------------------------------------------

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

# ------------------------------------------------------------------------------
# 4. APP-LEVEL SECRET PROPAGATION
# ------------------------------------------------------------------------------

function sync_local_envs() {
    if [ ! -f "secrets.env" ]; then
        echo "❌ [Vault] secrets.env not found. Run 'get' first."
        exit 1
    fi
    echo "🔄 [Vault] Propagating secrets to all apps..."
    
    # Load secrets into environment for this script session
    export $(grep -v '^#' secrets.env | xargs)

    # SECRETS MAPPING REGISTRY
    # Defines how global secrets are distributed to microservice-specific .env files.
    # Format: folder:var1,target_var=source_var,var3...
    APPS=(
        "uniz-portal:VITE_API_URL,VITE_MAINTENANCE_MODE,VITE_CLOUDINARY_CLOUD_NAME=CLOUDINARY_CLOUD_NAME,VITE_CLOUDINARY_UPLOAD_PRESET=CLOUDINARY_UPLOAD_PRESET,VITE_SCRAPER_URL,VITE_TURNSTILE_SITE_KEY"
        "uniz-auth:JWT_SECURITY_KEY,DATABASE_URL=AUTH_DATABASE_URL,REDIS_URL,INTERNAL_SECRET,USER_SERVICE_URL,GATEWAY_URL,EMAIL_USER,EMAIL_PASS,TURNSTILE_SECRET_KEY"
        "uniz-user:CLOUDINARY_CLOUD_NAME,CLOUDINARY_UPLOAD_PRESET,DATABASE_URL=USER_DATABASE_URL,JWT_SECURITY_KEY,INTERNAL_SECRET,REDIS_URL,INTERNAL_BOT_SECRET"
        "uniz-academics:DATABASE_URL=ACADEMICS_DATABASE_URL,JWT_SECURITY_KEY,REDIS_URL,INTERNAL_SECRET,INSTITUTION_LOGO_URL"
        "uniz-mail:INTERNAL_SECRET,AWS_REGION,AWS_ACCESS_KEY_ID,AWS_SECRET_ACCESS_KEY,SES_FROM_EMAIL,EMAIL_USER,EMAIL_PASS,INSTITUTION_LOGO_URL"
        "uniz-files:DATABASE_URL=FILES_DATABASE_URL,JWT_SECURITY_KEY,REDIS_URL,EMAIL_USER,EMAIL_PASS"
        "uniz-notifications:INTERNAL_SECRET,MAIL_SERVICE_URL,VAPID_PUBLIC_KEY,VAPID_PRIVATE_KEY,EMAIL_USER,EMAIL_PASS"
        "uniz-outpass:DATABASE_URL=OUTPASS_DATABASE_URL,JWT_SECURITY_KEY,REDIS_URL,INTERNAL_SECRET"
        "uniz-cron:DATABASE_URL=CRON_DATABASE_URL,GATEWAY_URL,INTERNAL_SECRET,REDIS_URL"
        "ornate-core:DATABASE_URL=ORNATE_DATABASE_URL,DIRECT_URL=ORNATE_DIRECT_URL,NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,NEXTAUTH_URL,NEXTAUTH_SECRET,R2_ACCOUNT_ID,R2_ENDPOINT,R2_BUCKET_NAME,R2_ACCESS_KEY_ID,R2_SECRET_ACCESS_KEY,R2_PUBLIC_DOMAIN,UPSTASH_REDIS_REST_URL,UPSTASH_REDIS_REST_TOKEN,AWS_REGION,AWS_ACCESS_KEY_ID,AWS_SECRET_ACCESS_KEY,SES_FROM_EMAIL"
    )

    for item in "${APPS[@]}"; do
        IFS=':' read -r APP_DIR VARS <<< "$item"
        ENV_PATH="apps/$APP_DIR/.env"
        
        if [ ! -f "$ENV_PATH" ] && [ -f "$ENV_PATH.example" ]; then
            echo "   -> Initializing $APP_DIR/.env from example..."
            cp "$ENV_PATH.example" "$ENV_PATH"
        fi
        
        if [ -f "$ENV_PATH" ]; then
            echo "   -> Syncing $APP_DIR..."
            IFS=',' read -ra ADDR <<< "$VARS"
            for var_mapping in "${ADDR[@]}"; do
                if [[ $var_mapping == *"="* ]]; then
                    LOCAL_VAR="${var_mapping%%=*}"
                    MASTER_VAR="${var_mapping#*=}"
                else
                    LOCAL_VAR="$var_mapping"
                    MASTER_VAR="$var_mapping"
                fi
                
                VAL="${!MASTER_VAR}"
                if [ -n "$VAL" ]; then
                    # Escaping value for sed
                    ESCAPED_VAL=$(echo "$VAL" | sed 's/[\/&]/\\&/g')
                    sed -i '' "s|^$LOCAL_VAR=.*|$LOCAL_VAR=\"$ESCAPED_VAL\"|" "$ENV_PATH" 2>/dev/null || \
                    sed -i "s|^$LOCAL_VAR=.*|$LOCAL_VAR=\"$ESCAPED_VAL\"|" "$ENV_PATH"
                fi
            done
        fi
    done
    echo "✅ [Vault] Local apps synced with VPS secrets."
}

case "$1" in
    get)
        get_secrets
        ;;
    set)
        set_secrets
        ;;
    sync)
        sync_local_envs
        ;;
    *)
        echo "Usage: $0 {get|set|sync}"
        exit 1
        ;;
esac
