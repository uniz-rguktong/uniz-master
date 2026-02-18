#!/bin/bash
# scripts/deploy_vercel.sh

SERVICES=(
  "uniz-auth-service"
  "uniz-user-service"
  "uniz-outpass-service"
  "uniz-academics-service"
  "uniz-files-service"
  "uniz-notification-service"
  "uniz-mail-service"
  "uniz-cron-service"
  "uniz-production-gateway"
)

PROD_GATEWAY="https://uniz-gateway.vercel.app/api/v1"

for SERVICE in "${SERVICES[@]}"; do
    echo "------------------------------------------------"
    echo "🚀 Preparing deployment for $SERVICE..."
    echo "------------------------------------------------"
    
    cd "/Users/sreecharandesu/Projects/uniz-rguktong/$SERVICE" || { echo "Directory $SERVICE not found"; continue; }
    
    # 1. Sync Environment Variables
    if [ -f .env ]; then
        echo "Updating environment variables for $SERVICE from .env..."
        # Read .env line by line
        while IFS= read -r line || [ -n "$line" ]; do
            # Skip comments and empty lines
            [[ $line =~ ^#.* ]] && continue
            [[ -z $(echo "$line" | xargs) ]] && continue
            
            # Parse Key and Value
            if [[ "$line" == *"="* ]]; then
                KEY=$(echo "$line" | cut -d '=' -f 1 | xargs)
                VALUE=$(echo "$line" | cut -d '=' -f 2- | xargs | sed 's/^"//;s/"$//;s/'\''//g')
                
                # Skip internal Vercel/Turbo vars
                [[ $KEY == VERCEL_* ]] && continue
                [[ $KEY == NEXT_PUBLIC_VERCEL_* ]] && continue
                [[ $KEY == NX_* ]] && continue
                [[ $KEY == TURBO_* ]] && continue
                
                # Skip vars that are too long or strictly local
                [[ $KEY == VERCEL_OIDC_TOKEN ]] && continue
                
                echo "   + $KEY"
                echo -n "$VALUE" | vercel env add "$KEY" production --force > /dev/null 2>&1
            fi
        done < .env
        
        # Explicitly set/ensure GATEWAY_URL for microservices
        if [[ "$SERVICE" != "uniz-production-gateway" ]]; then
             echo "   + GATEWAY_URL (forced production)"
             echo -n "$PROD_GATEWAY" | vercel env add GATEWAY_URL production --force > /dev/null 2>&1
        fi
    else
        echo "⚠️ No .env found in $SERVICE, using existing Vercel envs."
    fi
    
    # 2. Production Deployment
    echo "Deploying $SERVICE to production..."
    vercel deploy --prod --yes
    
    echo "✅ Finished deployment for $SERVICE"
done

echo "------------------------------------------------"
echo "✨ All services deployed successfully!"
echo "------------------------------------------------"
