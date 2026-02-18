#!/bin/bash

# Define services
SEED_SERVICES=("uniz-user" "uniz-auth" "uniz-academics" "uniz-outpass")
ALL_SERVICES=("uniz-user" "uniz-auth" "uniz-academics" "uniz-outpass" "uniz-files" "uniz-cron")

echo "=========================================================="
echo "  UNIZ MULTI-SERVICE MONOLITHIC SYNC (V6 - SEED FOCUS)"
echo "=========================================================="

# 1. Create Union Schema
node scripts/merge-prisma.js
TEMP_PRISMA=".monolith.prisma"

echo " Synchronizing Monolith Schema to Neon..."
cp "$TEMP_PRISMA" uniz-user/prisma/monolith.prisma
cd uniz-user

# Try reset, if lock fails, push anyway.
npx prisma migrate reset --force --skip-seed --skip-generate --schema prisma/monolith.prisma || echo "  Advisory lock timeout on reset, proceeding with push-only sync..."

npx prisma db push --schema prisma/monolith.prisma --accept-data-loss
rm prisma/monolith.prisma
cd ..
rm "$TEMP_PRISMA"

# 2. Setup and Explicit Seed Loop
for SERVICE in "${ALL_SERVICES[@]}"; do
    echo "----------------------------------------------------------"
    echo " Finalizing $SERVICE..."
    cd "$SERVICE"
    
    # Remove migrations to avoid conflict
    rm -rf prisma/migrations
    
    # Generate client
    npx prisma generate
    
    # Explicitly check for seed script in package.json
    if grep -q '"seed":' package.json; then
        echo "🌱 Seeding $SERVICE..."
        npm run seed
    else
        echo "⏭  No seed script for $SERVICE, skipping."
    fi
    
    cd ..
    echo " $SERVICE ready."
done

echo "=========================================================="
echo "🎊 SYSTEM FULLY SYNCED AND SEEDED."
echo "=========================================================="

# Verification
echo " Verifying data in uniz-user..."
cd uniz-user
node count.js
cd ..
