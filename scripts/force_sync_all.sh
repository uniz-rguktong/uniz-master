#!/bin/bash
SERVICES=("uniz-mail" "uniz-academics" "uniz-outpass" "uniz-auth" "uniz-user" "uniz-files" "uniz-notifications" "uniz-cron" "uniz-gateway" "uniz-infrastructure")

echo "🚀 Force Synchronizing All Repositories..."
for service in "${SERVICES[@]}"; do
  if [ -d "$service" ]; then
    echo "📦 Processing $service..."
    if (cd "$service" && git push origin main --force); then
        echo "✅ $service synced."
    else
        echo "⚠️ $service failed to sync."
    fi
  fi
done
echo "✨ Synchronization complete."
