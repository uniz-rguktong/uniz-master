#!/bin/bash
# UniZ Production Setup - Only deploys missing services
# Already deployed: uniz-auth, uniz-user-service, uniz-outpass-service, uniz-mail-service, uniz-gateway

GITHUB_ORG="uniz-rguktong"
SCOPE="sreecharan-desus-projects"
ROOT_DIR=$(pwd)

mkdir -p "$ROOT_DIR/logs"

# Already deployed services (skip these)
ALREADY_DEPLOYED="uniz-auth uniz-user-service uniz-outpass-service uniz-mail-service uniz-gateway"

# Services to deploy: local_dir:vercel_project_name:github_repo_name
SERVICES="uniz-academics:uniz-academics-service:uniz-academics
uniz-notifications:uniz-notification-service:uniz-notifications
uniz-files:uniz-files-service:uniz-files
uniz-cron:uniz-cron-service:uniz-cron"

echo "🚀 UniZ Production Setup - Remaining Services"
echo "=================================================="
echo "Already deployed: $ALREADY_DEPLOYED"
echo ""

echo "$SERVICES" | while IFS=: read -r DIR PROJECT_NAME GITHUB_REPO; do
    if [ ! -d "$ROOT_DIR/$DIR" ]; then
        echo "⚠️  Directory $DIR not found, skipping."
        continue
    fi
    
    echo ""
    echo "📦 Processing $DIR -> $PROJECT_NAME"
    echo "----------------------------------------------------"
    cd "$ROOT_DIR/$DIR"
    
    # 1. Link project
    echo "   🔗 Linking Vercel project..."
    npx vercel link --yes --project "$PROJECT_NAME" --scope "$SCOPE" 2>/dev/null || true
    
    # 2. Add environment variables
    if [ -f ".env" ]; then
        echo "   📝 Importing .env variables..."
        grep -v '^#' .env | grep -v '^VERCEL_' | grep -v '^TURBO_' | grep -v '^NX_' | grep -v '^$' | while IFS='=' read -r KEY VALUE; do
            VALUE=$(echo "$VALUE" | sed 's/^"//;s/"$//')
            echo -n "$VALUE" | npx vercel env add "$KEY" production --force --scope "$SCOPE" 2>/dev/null || true
        done
    fi
    
    # 3. Connect GitHub
    echo "   🔗 Connecting GitHub: $GITHUB_ORG/$GITHUB_REPO..."
    npx vercel git connect "$GITHUB_ORG/$GITHUB_REPO" --yes --scope "$SCOPE" 2>/dev/null || echo "      (Manual setup may be needed)"
    
    # 4. Deploy
    echo "   🚀 Deploying..."
    DEPLOY_OUTPUT=$(npx vercel deploy --prod --yes --scope "$SCOPE" 2>&1)
    DEPLOY_URL=$(echo "$DEPLOY_OUTPUT" | grep -o 'https://[a-zA-Z0-9.-]*\.vercel\.app' | tail -1)
    
    if [ -n "$DEPLOY_URL" ]; then
        echo "   ✅ Deployed: $DEPLOY_URL"
        echo "$PROJECT_NAME=$DEPLOY_URL" >> "$ROOT_DIR/logs/deployed_urls.txt"
    else
        echo "   ⚠️  Check Vercel dashboard for status"
    fi
    
    cd "$ROOT_DIR"
done

echo ""
echo "=================================================="
echo "🎉 Done! Check logs/deployed_urls.txt for URLs"
echo "=================================================="
