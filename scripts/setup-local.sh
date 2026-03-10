#!/bin/bash

# --- UniZ Universal Local Setup (V17) ---
# Goal: 100% Reliability, Sub-5ms latency, Corruption-Free Envs.
# Fixes: Smashed .env lines, Prisma mismatches, Landing Page 500s.

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

if [[ "$OSTYPE" == "darwin"* ]]; then
    lsof -ti:5432 | xargs kill -9 >/dev/null 2>&1 || true
    lsof -ti:6379 | xargs kill -9 >/dev/null 2>&1 || true
fi

# 2. Infra Startup
echo "🏗️ Starting Core Infrastructure (Postgres & Redis)..."
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

# 3. Environment Variable & Dependency Synchronization
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

echo "🧬 Syncing Environment & Healing Dependencies..."

# Update root Prisma for seeder stability
npm install --no-save prisma@6 @prisma/client@6 >/dev/null 2>&1

for i in "${!SERVICES[@]}"; do
    path="${SERVICES[$i]}"
    prefix="${PREFIXES[$i]}"
    
    if [ -d "$path" ]; then
        echo "  -> Processing $path..."
        
        # A. Update Secrets with Newline Safety
        if [ -f "secrets.env" ]; then
            cp secrets.env "$path/.env"
            # Ensure file ends with newline to prevent smashing
            [ -n "$(tail -c1 "$path/.env")" ] && printf "\n" >> "$path/.env"
        fi
        
        # B. 127.0.0.1 Fast-Path Overrides
        robust_sed 's/76.13.241.174/127.0.0.1/g' "$path/.env"
        robust_sed 's/uniz-redis/127.0.0.1/g' "$path/.env"
        robust_sed 's/uniz-postgres/127.0.0.1/g' "$path/.env"
        robust_sed 's/api.uniz.rguktong.in/127.0.0.1:3000/g' "$path/.env"
        robust_sed 's/https:\/\/127.0.0.1:3000/http:\/\/127.0.0.1:3000/g' "$path/.env"
        robust_sed 's/0x4AAAAAACnuFU49Yv6dqJum/1x00000000000000000000AA/g' "$path/.env"
        robust_sed 's/REDACTED_TURNSTILE_SECRET/1x00000000000000000000000000000000/g' "$path/.env"
        
        # C. Inject DATABASE_URL & Health-Check Service URLs
        db_var="${prefix}_DATABASE_URL"
        val=$(grep "^${db_var}=" "$path/.env" | head -n 1 | cut -d'=' -f2-)
        if [ -n "$val" ]; then
            val=$(echo "$val" | sed 's/localhost/127.0.0.1/g' | sed 's/uniz-postgres/127.0.0.1/g')
            echo "DATABASE_URL=$val" >> "$path/.env"
        fi
        
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

        # D. HEAL PRISMA CLIENT
        if [ -f "$path/prisma/schema.prisma" ]; then
            echo "     💎 Healing Prisma Client for $path..."
            rm -rf "$path/node_modules/@prisma/client"
            (cd "$path" && npm install --no-save @prisma/client@6 prisma@6 >/dev/null 2>&1)
            
            export DATABASE_URL="$val"
            (cd "$path" && yes | npx prisma@6 generate >/dev/null 2>&1)
            (cd "$path" && yes | npx prisma@6 db push --accept-data-loss >/dev/null 2>&1)
        fi
    fi
done

echo "📦 Finalizing global development tools..."
npm install --no-save ts-node bcrypt @types/bcrypt pg @types/pg >/dev/null 2>&1

echo ""
echo "🔥 MISSION CONTROL IS SHIPYARD READY (V17)!"
echo "--------------------------------------------------------"
echo "1. SEED DATA:  npm run seed:local"
echo "2. LAUNCH ALL: npm run dev:all"
echo "--------------------------------------------------------"
