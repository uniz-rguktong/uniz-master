#!/bin/bash
# Fixed script to set production URLs correctly on Vercel

# Production URLs
GATEWAY="https://uniz-gateway.vercel.app/api/v1"
AUTH="https://uniz-auth.vercel.app"
USER="https://uniz-user-service-five.vercel.app"
ACADEMICS="https://uniz-academics-service-beryl.vercel.app"
OUTPASS="https://uniz-outpass-service-snowy.vercel.app"
FILES="https://uniz-files-service-blush.vercel.app"
MAIL="https://uniz-mail.vercel.app"
NOTIFICATIONS="https://uniz-notification-service-sandy.vercel.app"
CRON="https://uniz-cron-service-theta.vercel.app"

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
    # Suppress output but show results
    echo "yes" | npx vercel env rm "$key" production --yes --project "$project" > /dev/null 2>&1 || true
    echo "$value" | npx vercel env add "$key" production --project "$project" > /dev/null 2>&1
}

echo "🚀 Fixing Production URLs on Vercel (Take 2)..."
echo "------------------------------------------------"

for p in "${PROJECTS[@]}"; do
    dir=$(echo $p | cut -d':' -f1)
    name=$(echo $p | cut -d':' -f2)
    
    echo "📦 Project: $name"
    
    # Global Gateway URL
    set_env "$name" "GATEWAY_URL" "$GATEWAY"
    
    case "$name" in
        "uniz-gateway")
            set_env "$name" "AUTH_SERVICE_URL" "$AUTH"
            set_env "$name" "USER_SERVICE_URL" "$USER"
            set_env "$name" "ACADEMICS_SERVICE_URL" "$ACADEMICS"
            set_env "$name" "OUTPASS_SERVICE_URL" "$OUTPASS"
            set_env "$name" "FILES_SERVICE_URL" "$FILES"
            set_env "$name" "MAIL_SERVICE_URL" "$MAIL"
            set_env "$name" "NOTIFICATION_SERVICE_URL" "$NOTIFICATIONS"
            set_env "$name" "CRON_SERVICE_URL" "$CRON"
            ;;
        "uniz-auth")
            set_env "$name" "USER_SERVICE_URL" "$USER"
            set_env "$name" "MAIL_SERVICE_URL" "$MAIL"
            ;;
        "uniz-academics-service"|"uniz-outpass-service"|"uniz-mail-service"|"uniz-notification-service")
            set_env "$name" "USER_SERVICE_URL" "$USER"
            ;;
    esac
    
    echo "   ✅ $name fixed."
    echo "------------------------------------------------"
done

echo "🏆 All production URLs have been updated."
echo "Triggering redeploy for Gateway and critical services..."
npm run redeploy:all
