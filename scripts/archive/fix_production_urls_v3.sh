#!/bin/bash
# Fixed script to set production URLs correctly on Vercel (Take 3 - adding /health suffix)

# Production URLs (Base)
GATEWAY_BASE="https://uniz-gateway.vercel.app/api/v1"
AUTH_BASE="https://uniz-auth.vercel.app"
USER_BASE="https://uniz-user-service-five.vercel.app"
ACADEMICS_BASE="https://uniz-academics-service-beryl.vercel.app"
OUTPASS_BASE="https://uniz-outpass-service-snowy.vercel.app"
FILES_BASE="https://uniz-files-service-blush.vercel.app"
MAIL_BASE="https://uniz-mail.vercel.app"
NOTIFICATIONS_BASE="https://uniz-notification-service-sandy.vercel.app"
CRON_BASE="https://uniz-cron-service-theta.vercel.app"

PROJECTS=(
    "uniz-auth:uniz-auth"
    "uniz-user:uniz-user-service"
    "uniz-academics:uniz-academics-service"
    "uniz-outpass:uniz-outpass-service"
    "uniz-files:uniz-files-service"
    "uniz-mail:uniz-mail-service"
    "uniz-notifications:uniz-notification-service"
    "uniz-cron:uniz-cron-service"
    "uniz-gateway:uniz-gateway"
)

ROOT_DIR="$(pwd)"

set_env() {
    local project=$1
    local key=$2
    local value=$3
    echo "   ➕ Setting $key for $project..."
    echo "yes" | npx vercel env rm "$key" production --yes --project "$project" > /dev/null 2>&1 || true
    echo "$value" | npx vercel env add "$key" production --project "$project" > /dev/null 2>&1
}

echo " Fixing Production URLs on Vercel (Take 3 - Adding /health)..."
echo "------------------------------------------------"

for p in "${PROJECTS[@]}"; do
    dir=$(echo $p | cut -d':' -f1)
    name=$(echo $p | cut -d':' -f2)
    
    echo " Project: $name"
    
    # Global Gateway URL (Base only)
    set_env "$name" "GATEWAY_URL" "$GATEWAY_BASE"
    
    case "$name" in
        "uniz-gateway")
            # Gateway health check NEEDS the /health suffix in the code
            set_env "$name" "AUTH_SERVICE_URL" "${AUTH_BASE}/health"
            set_env "$name" "USER_SERVICE_URL" "${USER_BASE}/health"
            set_env "$name" "ACADEMICS_SERVICE_URL" "${ACADEMICS_BASE}/health"
            set_env "$name" "OUTPASS_SERVICE_URL" "${OUTPASS_BASE}/health"
            set_env "$name" "FILES_SERVICE_URL" "${FILES_BASE}/health"
            set_env "$name" "MAIL_SERVICE_URL" "${MAIL_BASE}/health"
            set_env "$name" "NOTIFICATION_SERVICE_URL" "${NOTIFICATIONS_BASE}/health"
            set_env "$name" "CRON_SERVICE_URL" "${CRON_BASE}/health"
            ;;
        "uniz-auth")
            set_env "$name" "USER_SERVICE_URL" "$USER_BASE"
            set_env "$name" "MAIL_SERVICE_URL" "$MAIL_BASE"
            ;;
        "uniz-academics-service"|"uniz-outpass-service"|"uniz-mail-service"|"uniz-notification-service")
            set_env "$name" "USER_SERVICE_URL" "$USER_BASE"
            ;;
    esac
    
    echo "    $name fixed."
    echo "------------------------------------------------"
done

echo " All production URLs have been updated with /health for Gateway."
echo "Triggering final redeploy..."
npm run redeploy:all
