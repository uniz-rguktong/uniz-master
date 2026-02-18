#!/bin/bash
# robust_env_sync.sh
# Cleans and syncs env vars to Vercel avoiding newline issues.

SERVICE=$1
ENV_FILE=$2

if [ -z "$SERVICE" ] || [ -z "$ENV_FILE" ]; then
    echo "Usage: $0 <service-name> <env-file>"
    exit 1
fi

echo "🔄 Syncing $ENV_FILE to $SERVICE (cleaning newlines)..."

while IFS='=' read -r key value || [ -n "$key" ]; do
    # Skip comments and empty lines
    [[ "$key" =~ ^#.*$ ]] && continue
    [[ -z "$key" ]] && continue
    
    # Trim whitespace and newlines from value
    clean_key=$(echo "$key" | tr -d '\n\r' | xargs)
    clean_value=$(echo "$value" | tr -d '\n\r' | xargs)
    
    if [ -n "$clean_key" ]; then
        echo "   Adding $clean_key..."
        # Remove existing to be sure
        echo "yes" | npx vercel env rm "$clean_key" production --yes --project "$SERVICE" > /dev/null 2>&1 || true
        # Add with -n to prevent echo newline if piped, but vercel env add reads from stdin
        printf "%s" "$clean_value" | npx vercel env add "$clean_key" production --project "$SERVICE" > /dev/null 2>&1
    fi
done < "$ENV_FILE"

echo " Done with $SERVICE"
