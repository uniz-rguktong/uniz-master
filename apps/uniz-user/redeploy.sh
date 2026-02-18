#!/bin/bash
# UniZ Recovery Redeploy Script
# Forces a deployment by updating the REDEPLOY.md file

echo "🚀 Triggering recovery redeploy for $(basename $(pwd))..."
echo "Last trigger attempt: $(date)" > REDEPLOY.md
git add REDEPLOY.md
git commit -m "redeploy: recovery trigger $(date)" || git commit --allow-empty -m "redeploy: recovery trigger $(date)"
git push origin main
echo "✅ Redeploy signal sent to GitHub/Vercel."
