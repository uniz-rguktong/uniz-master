#!/bin/bash

# Define pairs of DIR:PROJECT
PAIRS=(
  "uniz-gateway:uniz-gateway"
  "uniz-mail:uniz-mail"
  "uniz-auth:uniz-auth"
  "uniz-cron:uniz-cron-service"
  "uniz-files:uniz-files-service"
  "uniz-outpass:uniz-outpass-service"
  "uniz-academics:uniz-academics-service"
  "uniz-user:uniz-user-service"
  "uniz-notifications:uniz-notification-service"
)

NEW_REDIS="rediss://default:Ac_yAAIncDI2MzgwNTNjMzEyMmU0MWI3OTNjMzlmYTZkOTIyMzIyOHAyNTMyMzQ@growing-unicorn-53234.upstash.io:6379"

for PAIR in "${PAIRS[@]}"; do
  DIR="${PAIR%%:*}"
  PROJECT="${PAIR#*:}"
  
  echo "----------------------------------------------------"
  echo " Processing $DIR -> Vercel Project: $PROJECT"
  
  if [ -d "$DIR" ]; then
    cd "$DIR"
    
    # 1. Link to project
    echo "🔗 Linking to Vercel..."
    vercel link --yes --project "$PROJECT"
    
    # 2. Update Environment Variables 
    echo "🔄 Updating REDIS_URL..."
    
    # Using 'env add' with --force to overwrite if possible, or rm+add
    # Vercel env add doesn't always handle force well for non-interactive
    # So we rm first.
    echo "y" | vercel env rm REDIS_URL production > /dev/null 2>&1 || true
    echo "y" | vercel env rm REDIS_URL preview > /dev/null 2>&1 || true
    echo "y" | vercel env rm REDIS_URL development > /dev/null 2>&1 || true
    
    printf "$NEW_REDIS" | vercel env add REDIS_URL production
    printf "$NEW_REDIS" | vercel env add REDIS_URL preview
    printf "$NEW_REDIS" | vercel env add REDIS_URL development
    
    # 3. Clean up
    rm -rf .vercel
    
    cd ..
    echo " $DIR ($PROJECT) successfully updated."
  else
    echo " Directory $DIR not found, skipping."
  fi
done

echo "===================================================="
echo "🎉 All Vercel project Environment Variables updated!"
echo "===================================================="
