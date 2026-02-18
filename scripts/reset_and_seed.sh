#!/bin/bash
# scripts/reset_and_seed.sh

PRISMA_SERVICES=(
  "uniz-auth-service"
  "uniz-user-service"
  "uniz-outpass-service"
  "uniz-academics-service"
  "uniz-files-service"
  "uniz-cron-service"
)

# 1. Git Push Everywhere
echo "🔄 Pushing all changes to Git..."
git add .
git commit -m "chore: push all logic before DB reset"
git push origin $(git branch --show-current)

for d in "${PRISMA_SERVICES[@]}"; do
  if [ -d "$d/.git" ]; then
    echo "Pushing $d..."
    (cd "$d" && git add . && git commit -m "chore: push logic before DB reset" && git push origin $(git branch --show-current))
  fi
done

# 2. Reset and Migrate DB
echo "⚠️ Resetting and Migrating Databases..."
for d in "${PRISMA_SERVICES[@]}"; do
    echo "------------------------------------------------"
    echo "🔨 Processing DB for $d..."
    echo "------------------------------------------------"
    cd "/Users/sreecharandesu/Projects/uniz-rguktong/$d" || continue
    
    # Non-interactive reset (force)
    npx prisma migrate reset --force
    
    # Re-run migration to establish schema cleanly
    npx prisma migrate dev --name init_schema --skip-seed
    
    # Generate client
    npx prisma generate
done

# 3. Seed Students and Admins
echo "🌱 Seeding Data..."
cd /Users/sreecharandesu/Projects/uniz-rguktong
node scripts/seed_students.js
node scripts/seed.js

echo "✅ All Done!"
