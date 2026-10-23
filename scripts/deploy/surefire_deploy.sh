#!/bin/bash
set -e

# Prefer GitHub Actions deploy over this script. Kept for emergency VPS rebuilds.
echo "🚀 Syncing local changes to GitHub..."
git add .
git commit -m "chore: surefire deployment [force build] $(date +'%Y-%m-%d %H:%M:%S')" || echo "No changes to commit"
git push origin main

echo "🌐 Starting VPS Deployment (Surefire Mode)..."
ssh -o StrictHostKeyChecking=no root@76.13.241.174 "/bin/bash -s" << 'EOF'
  cd /root/uniz-master

  echo "📥 Updating local repository on VPS..."
  git fetch origin main
  git reset --hard origin/main

  CURRENT_COMMIT=$(git rev-parse --short HEAD)
  COMMIT_MSG=$(git log -1 --pretty=%B)
  echo "✅ Current Deployment Commit: $CURRENT_COMMIT"

  # Secrets stay on VPS — never from git
  if [ ! -f /root/uniz-secrets.env ]; then
    echo "❌ Missing /root/uniz-secrets.env — aborting"
    exit 1
  fi
  chmod 600 /root/uniz-secrets.env

  export COMMIT_MSG
  export DEPLOY_CONTEXT=VPS
  bash scripts/deploy/deploy.sh "[rebuild all]"
EOF
