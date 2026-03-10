#!/bin/bash

# --- UniZ Universal Local Setup (V13) ---
# Goal: Setup a 100% operational environment with sub-5ms latency.
# Handles: Port clearing, Docker/Colima detection, DB Startup, Env Injection.

echo "🚀 Starting UniZ Master Setup (Local Environment)..."

check_dep() {
    if ! command -v "$1" >/dev/null 2>&1; then
        echo "❌ Error: $1 is not installed. Please install it first."
        exit 1
    fi
}

check_dep node
check_dep npm
check_dep docker

# --- Colima Fix for macOS ---
if [[ "$OSTYPE" == "darwin"* ]]; then
    if ! docker ps >/dev/null 2>&1; then
        echo "🐳 Docker default socket unreachable. Checking for Colima..."
        if command -v colima >/dev/null 2>&1 && colima status >/dev/null 2>&1; then
            COLIMA_SOCKET="${HOME}/.colima/default/docker.sock"
            if [ -S "$COLIMA_SOCKET" ]; then
                echo "✅ Colima detected! Setting DOCKER_HOST to $COLIMA_SOCKET"
                export DOCKER_HOST="unix://$COLIMA_SOCKET"
            fi
        fi
    fi
fi

# Detect docker-compose flavor
COMPOSE_CMD="docker-compose"
if ! command -v docker-compose &> /dev/null; then
  COMPOSE_CMD="docker compose"
fi

# 1. Port Clearance (Nuclear)
echo "🧹 Clearing existing infrastructure (Guaranteeing Port 5432 & 6379)..."
$COMPOSE_CMD -f infra/core-infra/docker-compose.yml down --remove-orphans >/dev/null 2>&1
# Kill any standalone processes on DB ports
lsof -ti:5432 | xargs kill -9 >/dev/null 2>&1 || true
lsof -ti:6379 | xargs kill -9 >/dev/null 2>&1 || true

# 2. Infra Startup
echo "🏗️ Starting Core Infrastructure (Postgres & Redis)..."
$COMPOSE_CMD -f infra/core-infra/docker-compose.yml up -d
sleep 5 # Wait for PG to be ready

# 3. Environment Variable Propagation
echo "🧬 Injecting environment variables: apps/uniz-*, apps/uniz-portal, .env"

if [ ! -f "secrets.env" ]; then
    if [ -f "secrets.env.example" ]; then
        echo "⚠️ Missing secrets.env! Creating from example..."
        cp secrets.env.example secrets.env
    else
        echo "❌ Critical Error: No secrets.env.example found!"
        exit 1
    fi
fi

# Map of service directories to their env prefix
declare -A service_prefixes=(
    ["apps/uniz-gateway"]="GATEWAY"
    ["apps/uniz-auth"]="AUTH"
    ["apps/uniz-user"]="USER"
    ["apps/uniz-academics"]="ACADEMICS"
    ["apps/uniz-outpass"]="OUTPASS"
    ["apps/uniz-files"]="FILES"
    ["apps/uniz-mail"]="MAIL"
    ["apps/uniz-notifications"]="NOTIFICATION"
    ["apps/uniz-cron"]="CRON"
    ["apps/uniz-portal"]="VITE"
)

# Loop through services and inject secrets
for path in "${!service_prefixes[@]}"; do
    if [ -d "$path" ]; then
        prefix="${service_prefixes[$path]}"
        echo "  -> Injecting environment variables: $path/.env"
        
        # Start fresh for local overrides
        cp secrets.env "$path/.env"
        printf "\n" >> "$path/.env"
        
        # Localhost overrides for hybrid (on-host node + dockerized DB)
        # Using 127.0.0.1 to avoid macOS DNS resolution latency (~30ms -> <1ms)
        gsed -i 's/76.13.241.174/127.0.0.1/g' "$path/.env" 2>/dev/null || sed -i '' 's/76.13.241.174/127.0.0.1/g' "$path/.env"
        gsed -i 's/uniz-redis/127.0.0.1/g' "$path/.env" 2>/dev/null || sed -i '' 's/uniz-redis/127.0.0.1/g' "$path/.env"
        gsed -i 's/uniz-postgres/127.0.0.1/g' "$path/.env" 2>/dev/null || sed -i '' 's/uniz-postgres/127.0.0.1/g' "$path/.env"
        gsed -i 's/api.uniz.rguktong.in/127.0.0.1:3000/g' "$path/.env" 2>/dev/null || sed -i '' 's/api.uniz.rguktong.in/127.0.0.1:3000/g' "$path/.env"
        gsed -i 's/https:\/\/127.0.0.1:3000/http:\/\/127.0.0.1:3000/g' "$path/.env" 2>/dev/null || sed -i '' 's/https:\/\/127.0.0.1:3000/http:\/\/127.0.0.1:3000/g' "$path/.env"
        gsed -i 's/0x4AAAAAACnuFU49Yv6dqJum/1x00000000000000000000AA/g' "$path/.env" 2>/dev/null || sed -i '' 's/0x4AAAAAACnuFU49Yv6dqJum/1x00000000000000000000AA/g' "$path/.env"
        gsed -i 's/0x4AAAAAACnuFekEUpVCyieVWmdzFvQ9xwE/1x00000000000000000000000000000000/g' "$path/.env" 2>/dev/null || sed -i '' 's/0x4AAAAAACnuFekEUpVCyieVWmdzFvQ9xwE/1x00000000000000000000000000000000/g' "$path/.env"
        
        # Map specific DB URL to generic DATABASE_URL for Prisma/Backend
        db_var="${prefix}_DATABASE_URL"
        val=$(grep "^${db_var}=" "$path/.env" | head -n 1 | cut -d'=' -f2-)
        
        if [ -n "$val" ]; then
            # Ensure DB URL also uses 127.0.0.1
            val=$(echo "$val" | sed 's/localhost/127.0.0.1/g' | sed 's/uniz-postgres/127.0.0.1/g')
            echo "DATABASE_URL=$val" >> "$path/.env"
        fi
        
        # Routing flags
        echo "DOCKER_ENV=false" >> "$path/.env"
        echo "GATEWAY_URL=http://127.0.0.1:3000/api/v1" >> "$path/.env"
        echo "FORCE_GMAIL=true" >> "$path/.env"

        # Inject Service URLs for Gateway Proxying (127.0.0.1)
        echo "AUTH_SERVICE_URL=http://127.0.0.1:3001" >> "$path/.env"
        echo "USER_SERVICE_URL=http://127.0.0.1:3002" >> "$path/.env"
        echo "ACADEMICS_SERVICE_URL=http://127.0.0.1:3004" >> "$path/.env"
        echo "OUTPASS_SERVICE_URL=http://127.0.0.1:3003" >> "$path/.env"
        echo "FILES_SERVICE_URL=http://127.0.0.1:3005" >> "$path/.env"
        echo "MAIL_SERVICE_URL=http://127.0.0.1:3006" >> "$path/.env"
        echo "NOTIFICATION_SERVICE_URL=http://127.0.0.1:3007" >> "$path/.env"
        echo "CRON_SERVICE_URL=http://127.0.0.1:3008" >> "$path/.env"
    fi
done

# 4. Tooling & Environment Finalization
echo "📦 Installing development tools..."
# Pinning Prisma to 6.x to avoid Prisma 7's breaking 'P1012' schema validation
npm install --no-save ts-node bcrypt @types/bcrypt pg @types/pg prisma@6 @prisma/client@6

# 5. Schema Sync & Seeder Preparation (Using pinned Prisma@6)
echo "💎 Synchronizing Local Database Schemas..."
if [ -d "apps/uniz-auth" ]; then
    export DATABASE_URL="postgresql://user:password@127.0.0.1:5432/uniz_db?sslmode=disable&schema=auth_v2"
    (cd apps/uniz-auth && npx prisma@6 db push --accept-data-loss)
fi
if [ -d "apps/uniz-user" ]; then
    export DATABASE_URL="postgresql://user:password@127.0.0.1:5432/uniz_db?sslmode=disable&schema=user_v2"
    (cd apps/uniz-user && npx prisma@6 db push --accept-data-loss)
fi

echo ""
echo "🔥 MISSION CONTROL IS SHIPYARD READY!"
echo "--------------------------------------------------------"
echo "1. SEED DATA:  npm run seed:local"
echo "2. LAUNCH ALL: npm run dev:all"
echo "--------------------------------------------------------"
