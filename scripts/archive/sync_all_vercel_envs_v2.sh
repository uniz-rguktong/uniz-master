#!/bin/bash
# Master script to sync all local .env variables to Vercel production

SERVICES=(
    "uniz-academics:uniz-academics-service"
    "uniz-auth:uniz-auth"
    "uniz-cron:uniz-cron-service"
    "uniz-files:uniz-files-service"
    "uniz-gateway:uniz-gateway"
    "uniz-mail:uniz-mail-service"
    "uniz-notifications:uniz-notification-service"
    "uniz-outpass:uniz-outpass-service"
    "uniz-user:uniz-user-service"
)

ROOT_DIR="$(pwd)"

echo "🔄 Starting System-Wide Vercel Environment Sync..."
echo "------------------------------------------------"

for s in "${SERVICES[@]}"; do
    dir=$(echo $s | cut -d':' -f1)
    name=$(echo $s | cut -d':' -f2)
    
    if [ -d "$dir" ]; then
        echo " Processing $dir ($name)..."
        cd "$ROOT_DIR/$dir"
        
        # Determine which env file to use
        ENV_FILE=".env"
        if [ ! -f "$ENV_FILE" ]; then
            if [ -f ".env.local" ]; then
                ENV_FILE=".env.local"
            else
                echo "    No .env or .env.local found in $dir, skipping."
                cd "$ROOT_DIR"
                continue
            fi
        fi
        
        echo "   📄 Using $ENV_FILE"
        
        # Link to Vercel
        npx vercel link --yes --project "$name" > /dev/null 2>&1
        
        # Read env file into an array to avoid stdin issues with npx
        mapfile -t lines < "$ENV_FILE"
        
        for line in "${lines[@]}"; do
            # Skip comments and empty lines
            [[ "$line" =~ ^#.*$ ]] && continue
            [[ -z "$line" ]] && continue
            
            # Skip Vercel-generated and other system variables
            [[ "$line" =~ ^VERCEL_.*$ ]] && continue
            [[ "$line" =~ ^TURBO_.*$ ]] && continue
            [[ "$line" =~ ^NX_.*$ ]] && continue
            [[ "$line" =~ ^PORT=.*$ ]] && continue
            
            # Extract Key and Value
            KEY=$(echo "$line" | cut -d'=' -f1)
            VALUE=$(echo "$line" | cut -d'=' -f2- | sed 's/^"//;s/"$//;s/^\x27//;s/\x27$//')
            
            if [ -n "$KEY" ] && [ -n "$VALUE" ]; then
                echo "   ➕ Adding $KEY..."
                # Remove first to avoid duplicates/errors if it exists
                echo "yes" | npx vercel env rm "$KEY" production --yes > /dev/null 2>&1 || true
                echo "$VALUE" | npx vercel env add "$KEY" production > /dev/null 2>&1
            fi
        done
        
        echo "    $dir sync complete."
        cd "$ROOT_DIR"
        echo "------------------------------------------------"
    fi
done

echo " All environment variables have been synchronized to Vercel."
echo "Running a final redeploy for all services to apply changes..."
cd "$ROOT_DIR"
npm run redeploy:all
