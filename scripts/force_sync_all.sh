#!/bin/bash
APPS=("uniz-mail" "uniz-academics" "uniz-outpass" "uniz-auth" "uniz-user" "uniz-files" "uniz-notifications" "uniz-cron" "uniz-gateway" "uniz-portal")
INFRA=("core-infra")

echo "🚀 Force Synchronizing All Repositories (Structured)..."
for app in "${APPS[@]}"; do
  DIR="apps/$app"
  if [ -d "$DIR" ]; then
    echo "📦 Processing $app..."
    (cd "$DIR" && git push origin main --force) || echo "⚠️ $app failed."
  fi
done

for i in "${INFRA[@]}"; do
  DIR="infra/$i"
  if [ -d "$DIR" ]; then
    echo "🏗️ Processing $i..."
    (cd "$DIR" && git push origin main --force) || echo "⚠️ $i failed."
  fi
done
echo "✨ Synchronization complete."
