#!/bin/bash
SECRET="uniz-core"
SERVICES=(
    "uniz-auth" "uniz-user-service" "uniz-academics-service" "uniz-outpass-service" 
    "uniz-files-service" "uniz-mail-service" "uniz-notification-service" "uniz-cron-service" "uniz-gateway"
)

echo " Syncing INTERNAL_SECRET to all services..."
for s in "${SERVICES[@]}"; do
    echo "  Setting for $s..."
    echo "yes" | npx vercel env rm INTERNAL_SECRET production --yes --project "$s" > /dev/null 2>&1 || true
    echo -n "$SECRET" | npx vercel env add INTERNAL_SECRET production --project "$s" > /dev/null 2>&1
done
echo " Secrets synced."
