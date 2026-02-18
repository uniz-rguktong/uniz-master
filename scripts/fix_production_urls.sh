#!/bin/bash
# Script to fix production URLs for all UniZ services on Vercel

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
    echo "yes" | npx vercel env rm "$key" production --yes --project "$project" > /dev/null 2>&1 || true
    echo "$value" | npx vercel env add "$key" production --project "$project" > /dev/null 2>&1
}

echo "🚀 Fixing Production URLs on Vercel..."
echo "------------------------------------------------"

for p in "${PROJECTS[@]}"; do
    dir=$(echo $p | cut -d':' -f1)
    name=$(echo $p | cut -d':' -f2)
    
    echo "📦 Project: $name"
    
    # 1. Global Gateway URL (Almost everyone needs this)
    set_env "$name" "GATEWAY_URL" "$GATEWAY"
    
    # 2. Service Specific Overrides
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
        "uniz-academics-service")
            set_env "$name" "USER_SERVICE_URL" "$USER"
            ;;
        "uniz-outpass-service")
            set_env "$name" "USER_SERVICE_URL" "$USER"
            ;;
        "uniz-mail-service")
            set_env "$name" "USER_SERVICE_URL" "$USER"
            ;;
        "uniz-notification-service")
            set_env "$name" "USER_SERVICE_URL" "$USER"
            ;;
    esac
    
    echo "   ✅ $name fixed."
    echo "------------------------------------------------"
done

# Also fix the uniz-mail (alternate project)
echo "📦 Project: uniz-mail (alternate)"
set_env "uniz-mail" "GATEWAY_URL" "$GATEWAY"
set_env "uniz-mail" "USER_SERVICE_URL" "$USER"
echo "------------------------------------------------"

echo "🏆 All production URLs have been fixed on Vercel."
echo "Syncing local .env files to match to avoid future drift..."

# Update local .env files too
cat > scripts/update_local_envs.sh << 'EOF'
#!/bin/bash
GATEWAY="https://uniz-gateway.vercel.app/api/v1"
USER="https://uniz-user-service-five.vercel.app"
MAIL="https://uniz-mail.vercel.app"

for d in uniz-*; do
    if [ -f "$d/.env" ]; then
        sed -i '' "s|GATEWAY_URL=.*|GATEWAY_URL=\"$GATEWAY\"|g" "$d/.env"
        sed -i '' "s|USER_SERVICE_URL=.*|USER_SERVICE_URL=\"$USER\"|g" "$d/.env"
        sed -i '' "s|MAIL_SERVICE_URL=.*|MAIL_SERVICE_URL=\"$MAIL\"|g" "$d/.env"
    fi
done
EOF
bash scripts/update_local_envs.sh

echo "✨ Local .env files updated. Triggering final redeploy..."
npm run redeploy:all
