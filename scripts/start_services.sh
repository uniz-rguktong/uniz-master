#!/bin/bash

# Get the root directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"
export NODE_OPTIONS="--max-old-space-size=512"

# Kill existing services
echo "Cleaning up ports 3000-3008..."
lsof -ti :3000-3008 | xargs kill -9 2>/dev/null || true

# Switch gateway to local mode
bash "$SCRIPT_DIR/swap_gateway_config.sh" local

mkdir -p "$ROOT_DIR/logs"
echo "Starting microservices via Node.js (No Vercel dependency)..."

# Ensure Prisma clients are generated
SERVICES=(uniz-auth uniz-user uniz-outpass uniz-academics uniz-files uniz-mail uniz-notifications uniz-cron)
for svc in "${SERVICES[@]}"; do
    DIR="$ROOT_DIR/apps/$svc"
    if [ -f "$DIR/prisma/schema.prisma" ]; then
        echo "- Generating Prisma client for $svc"
        (cd "$DIR" && npx prisma generate) > /dev/null 2>&1
    fi
done

# Start Services using ts-node or node
cd "$ROOT_DIR/apps/uniz-auth" && PORT=3001 npx ts-node src/index.ts > "$ROOT_DIR/logs/auth.log" 2>&1 &
echo "Auth Service started on 3001"
sleep 5

cd "$ROOT_DIR/apps/uniz-user" && PORT=3002 npx ts-node src/index.ts > "$ROOT_DIR/logs/user.log" 2>&1 &
echo "User Service started on 3002"
sleep 5

cd "$ROOT_DIR/apps/uniz-outpass" && PORT=3003 npx ts-node src/index.ts > "$ROOT_DIR/logs/outpass.log" 2>&1 &
echo "Outpass Service started on 3003"
sleep 5

cd "$ROOT_DIR/apps/uniz-academics" && PORT=3004 npx ts-node src/index.ts > "$ROOT_DIR/logs/academics.log" 2>&1 &
echo "Academics Service started on 3004"
sleep 5

cd "$ROOT_DIR/apps/uniz-files" && PORT=3005 npx ts-node src/index.ts > "$ROOT_DIR/logs/files.log" 2>&1 &
echo "Files Service started on 3005"
sleep 5

cd "$ROOT_DIR/apps/uniz-mail" && PORT=3006 npx ts-node src/index.ts > "$ROOT_DIR/logs/mail.log" 2>&1 &
echo "Mail Service started on 3006"
sleep 5

cd "$ROOT_DIR/apps/uniz-notifications" && PORT=3007 npx ts-node src/index.ts > "$ROOT_DIR/logs/notification.log" 2>&1 &
echo "Notification Service started on 3007"
sleep 5

cd "$ROOT_DIR/apps/uniz-cron" && PORT=3008 npx ts-node src/index.ts > "$ROOT_DIR/logs/cron.log" 2>&1 &
echo "Cron Service started on 3008"

# Start the Node-based Gateway API (which we built for Docker)
cd "$ROOT_DIR/apps/uniz-gateway" && PORT=3000 npx ts-node src/index.ts > "$ROOT_DIR/logs/gateway.log" 2>&1 &
echo "Gateway API started on 3000"

echo "Waiting for services to initialize (10s)..."
sleep 10

# Check health
echo "--- Health Checks ---"
for port in {3000..3008}; do
    if [ $port -eq 3000 ]; then
        curl -s http://localhost:3000/health | grep -q "ok" && echo "Port $port: OK" || echo "Port $port: FAIL"
    else
        curl -s http://localhost:$port/health | grep -q "ok" && echo "Port $port: OK" || echo "Port $port: FAIL"
    fi
done
echo "--------------------"
echo "Done. Local dev environment is running (without Vercel CLI)."
