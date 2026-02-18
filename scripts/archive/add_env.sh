#!/bin/bash
# Script to add environment variables from .env to a Vercel project
# Usage: ./add_env.sh <project_dir> <project_name>

PROJECT_DIR=$1
PROJECT_NAME=$2

if [ ! -d "$PROJECT_DIR" ]; then
    echo "Directory $PROJECT_DIR not found"
    exit 1
fi

cd "$PROJECT_DIR"

# Link if not already linked (this might prompt if no .vercel/project.json exists)
# But since we want to be automated, we will use vercel link --yes
npx vercel link --yes --project "$PROJECT_NAME"

while IFS= read -r line || [ -n "$line" ]; do
    # Skip comments and empty lines
    [[ "$line" =~ ^#.*$ ]] && continue
    [[ -z "$line" ]] && continue
    
    # Skip Vercel-generated variables
    [[ "$line" =~ ^VERCEL_.*$ ]] && continue
    [[ "$line" =~ ^TURBO_.*$ ]] && continue
    [[ "$line" =~ ^NX_.*$ ]] && continue
    
    # Extract Key and Value
    KEY=$(echo "$line" | cut -d'=' -f1)
    VALUE=$(echo "$line" | cut -d'=' -f2- | sed 's/^"//;s/"$//')
    
    echo "Adding $KEY to $PROJECT_NAME..."
    echo "$VALUE" | npx vercel env add "$KEY" production --force || true
done < .env
