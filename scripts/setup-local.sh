#!/bin/bash

# --- UniZ Universal Local Setup (V15) ---
# Goal: Sub-5ms latency, self-healing dependencies, perfect Prisma sync.
# Handles: Port clearing, Docker/Colima, DB Startup, Env Injection, Dependency Integrity.

echo "🚀 Starting UniZ Master Setup (Local Environment)..."

# Ensure we are in the root directory
cd "$(dirname "$0")/.." || exit 1

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
$COMPOSE_CMD -f infra/core-infra/docker-compose.yml stop uniz-redis uniz-postgres >/dev/null 2>&1 || true
$COMPOSE_CMD -f infra/core-infra/docker-compose.yml rm -f uniz-redis uniz-postgres >/dev/null 2>&1 || true

# Kill any standalone processes on DB ports (to ensure no conflicts)
if [[ "$OSTYPE" == "darwin"* ]]; then
    lsof -ti:5432 | xargs kill -9 >/dev/null 2>&1 || true
    lsof -ti:6379 | xargs kill -9 >/dev/null 2>&1 || true
fi

# 2. Infra Startup
echo "🏗️ Starting Core Infrastructure (Postgres & Redis)..."
# Create a dummy .env in core-infra if it doesn't exist to prevent compose warnings
touch infra/core-infra/.env
$COMPOSE_CMD -f infra/core-infra/docker-compose.yml up -d uniz-redis uniz-postgres

# --- CRITICAL: Wait for Postgres to be ready ---
echo "⏳ Waiting for Postgres to accept connections..."
MAX_RETRIES=30
RETRY_COUNT=0
until docker exec uniz-postgres pg_isready -U user -d uniz_db >/dev/null 2>&1 || [ $RETRY_COUNT -eq $MAX_RETRIES ]; do
  printf "."
  sleep 1
  ((RETRY_COUNT++))
done
printf "\n"

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "❌ Error: Postgres failed to start in time. Check 'docker logs uniz-postgres'."
    exit 1
fi
echo "✅ Postgres is ready!"

# 3. Environment Variable & Prisma Sync Logic
SERVICES=("apps/uniz-gateway" "apps/uniz-auth" "apps/uniz-user" "apps/uniz-academics" "apps/uniz-outpass" "apps/uniz-files" "apps/uniz-mail" "apps/uniz-notifications" "apps/uniz-cron" "apps/uniz-portal")
PREFIXES=("GATEWAY" "AUTH" "USER" "ACADEMICS" "OUTPASS" "FILES" "MAIL" "NOTIFICATION" "CRON" "VITE")

robust_sed() {
    local pattern="$1"
    local file="$2"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "$pattern" "$file"
    else
        sed -i "$pattern" "$file"
    fi
}

echo "🧬 Syncing Environment & Prisma Clients (Force Sub-5ms Ready)..."

# Ensure root has Prisma @ v6 for seeder
npm install --no-save prisma@6 @prisma/client@6 >/dev/null 2>&1

for i in "${!SERVICES[@]}"; do
    path="${SERVICES[$i]}"
    prefix="${PREFIXES[$i]}"
    
    if [ -d "$path" ]; then
        echo "  -> Processing $path..."
        
        # 1. Update Secrets
        if [ -f "secrets.env" ]; then
            cp secrets.env "$path/.env"
        fi
        
        # 2. Forced Overrides (127.0.0.1 bypasses macOS DNS latency)
        robust_sed 's/76.13.241.174/127.0.0.1/g' "$path/.env"
        robust_sed 's/uniz-redis/127.0.0.1/g' "$path/.env"
        robust_sed 's/uniz-postgres/127.0.0.1/g' "$path/.env"
        robust_sed 's/api.uniz.rguktong.in/127.0.0.1:3000/g' "$path/.env"
        robust_sed 's/https:\/\/127.0.0.1:3000/http:\/\/127.0.0.1:3000/g' "$path/.env"
        robust_sed 's/0x4AAAAAACnuFU49Yv6dqJum/1x00000000000000000000AA/g' "$path/.env"
        robust_sed 's/0x4AAAAAACnuFekEUpVCyieVWmdzFvQ9xwE/1x00000000000000000000000000000000/g' "$path/.env"
        
        # 3. Inject generic DATABASE_URL for Prisma
        db_var="${prefix}_DATABASE_URL"
        val=$(grep "^${db_var}=" "$path/.env" | head -n 1 | cut -d'=' -f2-)
        if [ -n "$val" ]; then
            val=$(echo "$val" | sed 's/localhost/127.0.0.1/g' | sed 's/uniz-postgres/127.0.0.1/g')
            echo "DATABASE_URL=$val" >> "$path/.env"
        fi
        
        # 4. Mandatory Routing Flags
        {
            echo "DOCKER_ENV=false"
            echo "GATEWAY_URL=http://127.0.0.1:3000/api/v1"
            echo "FORCE_GMAIL=true"
            echo "AUTH_SERVICE_URL=http://127.0.0.1:3001"
            echo "USER_SERVICE_URL=http://127.0.0.1:3002"
            echo "ACADEMICS_SERVICE_URL=http://127.0.0.1:3004"
            echo "OUTPASS_SERVICE_URL=http://127.0.0.1:3003"
            echo "FILES_SERVICE_URL=http://127.0.0.1:3005"
            echo "MAIL_SERVICE_URL=http://127.0.0.1:3006"
            echo "NOTIFICATION_SERVICE_URL=http://127.0.0.1:3007"
            echo "CRON_SERVICE_URL=http://127.0.0.1:3008"
        } >> "$path/.env"

        # 5. FIX PRISMA VERSION MISMATCH (Crucial for Node processes to start)
        if [ -f "$path/prisma/schema.prisma" ]; then
            echo "     💎 Updating Prisma Client for $path..."
            # Force Prisma 6 client generation in the service directory
            export DATABASE_URL="$val"
            (cd "$path" && yes | npx prisma@6 generate >/dev/null 2>&1)
            # Also push any schema changes (skip if not needed, but push is safe with --accept-data-loss)
            (cd "$path" && yes | npx prisma@6 db push --accept-data-loss >/dev/null 2>&1)
        fi
    fi
done

# 6. Global Tooling check
echo "📦 Finalizing development tools (ts-node, pg, etc)..."
npm install --no-save ts-node bcrypt @types/bcrypt pg @types/pg >/dev/null 2>&1

echo ""
echo "🔥 MISSION CONTROL IS SHIPYARD READY (V15)!"
echo "--------------------------------------------------------"
echo "1. SEED DATA:  npm run seed:local"
echo "2. LAUNCH ALL: npm run dev:all"
echo "--------------------------------------------------------"
