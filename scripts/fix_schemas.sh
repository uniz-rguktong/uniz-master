#!/bin/bash
# Fix DATABASE_URL schema for each service

ROOT_DIR=$(pwd)
# Base connection string
DB_BASE="postgresql://neondb_owner:npg_BP1it9EkDRGs@ep-red-queen-a12hqixj-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

update_schema() {
    local svc=$1
    local schema=$2
    
    echo "🔧 Updating $svc to use schema=$schema..."
    if [ -d "$ROOT_DIR/$svc" ]; then
        cd "$ROOT_DIR/$svc"
        
        # Update DATABASE_URL with schema suffix
        # We rely on existing project link. If not linked, this might prompt or fail, 
        # but previously I linked them.
        
        echo -n "${DB_BASE}&schema=${schema}" | npx vercel env add DATABASE_URL production --force 
        
        # Trigger redeployment
        echo "   🚀 Redeploying $svc..."
        npx vercel deploy --prod --yes &
        
        cd "$ROOT_DIR"
    fi
}

update_schema "uniz-auth" "auth"
update_schema "uniz-user" "users"
update_schema "uniz-academics" "academics"
update_schema "uniz-outpass" "outpass"

echo "✅ Database schemas updated and redeployments triggered! Please wait for them to finish."
