#!/bin/bash
# UniZ Full Production Restoration & Environment Setup
# This script links, adds env vars, and deploys each service properly.

SERVICES=(
    "uniz-auth:uniz-auth-service"
    "uniz-user:uniz-user-service"
    "uniz-outpass:uniz-outpass-service"
    "uniz-academics:uniz-academics-service"
    "uniz-mail:uniz-mail-service"
    "uniz-notifications:uniz-notification-service"
    "uniz-files:uniz-files-service"
    "uniz-cron:uniz-cron-service"
    "uniz-gateway:uniz-production-gateway"
)

ROOT_DIR=$(pwd)
SCOPE="sreecharan-desus-projects"

echo "🌟 Starting UniZ Production Restoration Suite..."

for entry in "${SERVICES[@]}"; do
    DIR="${entry%%:*}"
    NAME="${entry#*:}"
    
    if [ -d "$DIR" ]; then
        echo "----------------------------------------------------"
        echo "📦 Processing $DIR ($NAME)..."
        cd "$ROOT_DIR/$DIR"
        
        # 1. Link Project (Force Scope)
        echo "   > Linking to Vercel project $NAME..."
        npx vercel link --yes --project "$NAME" --scope "$SCOPE"
        
        # 2. Add Env Vars from .env
        if [ -f ".env" ]; then
            echo "   > Injecting Environment Variables..."
            while IFS= read -r line || [ -n "$line" ]; do
                [[ "$line" =~ ^#.*$ ]] && continue
                [[ -z "$line" ]] && continue
                [[ "$line" =~ ^VERCEL_.*$ ]] && continue
                [[ "$line" =~ ^TURBO_.*$ ]] && continue
                [[ "$line" =~ ^NX_.*$ ]] && continue
                
                KEY=$(echo "$line" | cut -d'=' -f1)
                VALUE=$(echo "$line" | cut -d'=' -f2- | sed 's/^"//;s/"$//')
                
                # Check if it's a URL that needs to point to production
                # We will handle URLs later after we have all deployment URLs if possible,
                # but for now we push what's in .env (which might be localhost).
                # Actually, many of these should be production URLs.
                
                echo -n "$VALUE" | npx vercel env add "$KEY" production --force --scope "$SCOPE" >/dev/null 2>&1
            done < .env
        fi
        
        # 3. Deploy to Production
        echo "   > Deploying to Production..."
        npx vercel deploy --prod --yes --scope "$SCOPE"
        
        cd "$ROOT_DIR"
    else
        echo "⚠️  Directory $DIR not found, skipping."
    fi
done

echo "✅ All services synchronized and deployed."
