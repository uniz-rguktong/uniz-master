#!/bin/bash
set -e
# UniZ Production Redeploy Script
# Synchronizes infrastructure and pulls latest Docker images

echo " Starting Optimized Redeployment..."
cd ~/uniz-infrastructure

# Force fetch and reset to avoid "divergent branches" errors on the VPS
echo " Updating infrastructure configuration..."
git fetch origin main
git reset --hard origin/main

# Explicitly pull images to bypass Docker tag caching issues
echo "🐳 Pulling latest service images..."
docker compose -f docker-compose.prod.yml pull

# Recreate containers with the new images
echo "🔄 Restarting services..."
docker compose -f docker-compose.prod.yml up -d --force-recreate

# Clean up dangling images to save disk space
echo "🧹 Cleaning up old images..."
docker image prune -af --filter "until=24h"

echo " System Updated & Cleaned!"
