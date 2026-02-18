#!/bin/bash
# Script to add redeploy triggers to all UniZ microservices
# This adds a mechanism to force a Vercel deployment without actual code changes.

SERVICES=(
    "uniz-academics"
    "uniz-auth"
    "uniz-cron"
    "uniz-files"
    "uniz-gateway"
    "uniz-infrastructure"
    "uniz-mail"
    "uniz-notifications"
    "uniz-outpass"
    "uniz-user"
)

ROOT_DIR="$(pwd)"

echo "🛠️ Setting up redeploy triggers for all services..."

for service in "${SERVICES[@]}"; do
    if [ -d "$service" ]; then
        echo "📦 Processing $service..."
        cd "$ROOT_DIR/$service"
        
        # 1. Create/Update REDEPLOY.md
        echo "# Redeploy Log" > REDEPLOY.md
        echo "This file is used to trigger Vercel deployments after rate limits expire." >> REDEPLOY.md
        echo "" >> REDEPLOY.md
        echo "Last trigger attempt: $(date)" >> REDEPLOY.md
        
        # 2. Add redeploy command to package.json if it exists
        if [ -f "package.json" ]; then
            node -e "
                const fs = require('fs');
                try {
                    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
                    pkg.scripts = pkg.scripts || {};
                    pkg.scripts['redeploy'] = 'bash redeploy.sh';
                    fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
                    console.log('   ✅ Added redeploy script to package.json');
                } catch (e) {
                    console.error('   ❌ Error updating package.json: ' + e.message);
                }
            "
        fi
        
        # 3. Create standalone redeploy.sh
        cat > redeploy.sh << 'EOF'
#!/bin/bash
# UniZ Recovery Redeploy Script
# Forces a deployment by updating the REDEPLOY.md file

echo "🚀 Triggering recovery redeploy for $(basename $(pwd))..."
echo "Last trigger attempt: $(date)" > REDEPLOY.md
git add REDEPLOY.md
git commit -m "redeploy: recovery trigger $(date)" || git commit --allow-empty -m "redeploy: recovery trigger $(date)"
git push origin main
echo "✅ Redeploy signal sent to GitHub/Vercel."
EOF
        chmod +x redeploy.sh
        echo "   ✅ Created redeploy.sh"
    fi
done

# 4. Update root package.json
cd "$ROOT_DIR"
node -e "
    const fs = require('fs');
    try {
        const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        pkg.scripts = pkg.scripts || {};
        pkg.scripts['redeploy:all'] = 'bash scripts/redeploy_all_trigger.sh';
        fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
        console.log('✅ Added redeploy:all to root package.json');
    } catch (e) {
        console.error('❌ Error updating root package.json: ' + e.message);
    }
"

# 5. Create the root master trigger script
cat > scripts/redeploy_all_trigger.sh << 'EOF'
#!/bin/bash
# Master script to trigger redeploy for all UniZ services

SERVICES=(
    "uniz-academics"
    "uniz-auth"
    "uniz-cron"
    "uniz-files"
    "uniz-gateway"
    "uniz-mail"
    "uniz-notifications"
    "uniz-outpass"
    "uniz-user"
    "uniz-infrastructure"
)

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT_DIR="$( dirname "$SCRIPT_DIR" )"

echo "🚀 Initiating System-Wide Recovery Deployment..."
echo "------------------------------------------------"

for service in "${SERVICES[@]}"; do
    if [ -d "$ROOT_DIR/$service" ]; then
        echo "🌐 Service: $service"
        cd "$ROOT_DIR/$service"
        if [ -f "./redeploy.sh" ]; then
            ./redeploy.sh || echo "⚠️ Failed to trigger $service, continuing..."
        else
            echo "⚠️ No redeploy.sh found in $service"
        fi
        echo "------------------------------------------------"
    fi
done

echo "🏆 All recovery deployments have been signaled."
echo "Wait a few minutes for Vercel to pick up and process the builds."
EOF
chmod +x scripts/redeploy_all_trigger.sh

echo "✨ Setup complete. Use 'npm run redeploy:all' to trigger all services."
