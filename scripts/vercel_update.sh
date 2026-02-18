#!/bin/bash

# Configuration
BASE_URL="postgresql://neondb_owner:npg_BP1it9EkDRGs@ep-red-queen-a12hqixj-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
REDIS_URL="rediss://default:AUjnAAIncDE0MTgwNzM4NjdjYzk0Nzg3YTg2NzIyN2VkMGI1YjRkYnAxMTg2NjM@cheerful-collie-18663.upstash.io:6379"

# Get root directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"

# Full services list
services=(
    "uniz-auth-service:auth"
    "uniz-user-service:users"
    "uniz-outpass-service:outpass"
    "uniz-academics-service:academics"
    "uniz-files-service:academics"
    "uniz-mail-service:none"
    "uniz-notification-service:none"
    "uniz-cron-service:outpass"
    "uniz-production-gateway:none"
)

for s in "${services[@]}"; do
  service=$(echo $s | cut -d':' -f1)
  schema=$(echo $s | cut -d':' -f2)
  FULL_URL="${BASE_URL}&schema=${schema}"
  
  echo "------------------------------------------------"
  echo "🚀 Deploying $service (Schema: $schema)"
  echo "------------------------------------------------"
  
  cd "$ROOT_DIR/$service" || { echo "❌ Directory $service not found"; continue; }
  
  if [ "$schema" != "none" ]; then
      echo "📡 Configuring environment variables..."
      # Use --yes to skip confirmation and handle potential "not found" errors gracefully
      npx vercel env rm DATABASE_URL production --yes 2>/dev/null || true
      echo "$FULL_URL" | npx vercel env add DATABASE_URL production
  fi

  # All services need REDIS_URL except gateway (though it doesn't hurt)
  if [ "$service" != "uniz-production-gateway" ]; then
      npx vercel env rm REDIS_URL production --yes 2>/dev/null || true
      echo "$REDIS_URL" | npx vercel env add REDIS_URL production
  fi
  
  echo "📦 Deploying to production..."
  npx vercel deploy --prod --yes
  
  cd "$ROOT_DIR"
done

echo "------------------------------------------------"
echo "✅ All services deployment triggered!"
echo "------------------------------------------------"
