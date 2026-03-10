#!/bin/bash

# --- UniZ Universal Local Setup (V14) ---
# Goal: Robust, non-interactive setup for ANY environment.
# Handles: Port clearing, Docker/Colima detection, DB Startup, Env Injection, Prisma Sync.

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
$COMPOSE_CMD -f infra/core-infra/docker-compose.yml down --remove-orphans >/dev/null 2>&1 || true

# Kill any standalone processes on DB ports (to ensure no conflicts)
if [[ "$OSTYPE" == "darwin"* ]]; then
    lsof -ti:5432 | xargs kill -9 >/dev/null 2>&1 || true
    lsof -ti:6379 | xargs kill -9 >/dev/null 2>&1 || true
fi

# 2. Infra Startup
echo "🏗️ Starting Core Infrastructure (Postgres & Redis)..."
# Create a dummy .env in core-infra if it doesn't exist to prevent compose warnings
touch infra/core-infra/.env
$COMPOSE_CMD -f infra/core-infra/docker-compose.yml up -d

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

# 3. Environment Variable Propagation
echo "🧬 Injecting environment variables..."

if [ ! -f "secrets.env" ]; then
    if [ -f "secrets.env.example" ]; then
        echo "⚠️ Missing secrets.env! Creating from example..."
        cp secrets.env.example secrets.env
    else
        echo "❌ Critical Error: No secrets.env.example found!"
        exit 1
    fi
fi

# We use separate lists to avoid associative array 'division by 0' bug in some bash versions
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

for i in "${!SERVICES[@]}"; do
    path="${SERVICES[$i]}"
    prefix="${PREFIXES[$i]}"
    
    if [ -d "$path" ]; then
        echo "  -> Processing $path..."
        cp secrets.env "$path/.env"
        printf "\n" >> "$path/.env"
        
        # Apply Overrides (127.0.0.1 for high speed)
        robust_sed 's/76.13.241.174/127.0.0.1/g' "$path/.env"
        robust_sed 's/uniz-redis/127.0.0.1/g' "$path/.env"
        robust_sed 's/uniz-postgres/127.0.0.1/g' "$path/.env"
        robust_sed 's/api.uniz.rguktong.in/127.0.0.1:3000/g' "$path/.env"
        robust_sed 's/https:\/\/127.0.0.1:3000/http:\/\/127.0.0.1:3000/g' "$path/.env"
        robust_sed 's/0x4AAAAAACnuFU49Yv6dqJum/1x00000000000000000000AA/g' "$path/.env"
        robust_sed 's/0x4AAAAAACnuFekEUpVCyieVWmdzFvQ9xwE/1x00000000000000000000000000000000/g' "$path/.env"
        
        # Inject generic DATABASE_URL for Prisma
        db_var="${prefix}_DATABASE_URL"
        val=$(grep "^${db_var}=" "$path/.env" | head -n 1 | cut -d'=' -f2-)
        if [ -n "$val" ]; then
            val=$(echo "$val" | sed 's/localhost/127.0.0.1/g' | sed 's/uniz-postgres/127.0.0.1/g')
            echo "DATABASE_URL=$val" >> "$path/.env"
        fi
        
        # Flags
        echo "DOCKER_ENV=false" >> "$path/.env"
        echo "GATEWAY_URL=http://127.0.0.1:3000/api/v1" >> "$path/.env"
        echo "FORCE_GMAIL=true" >> "$path/.env"
        
        # Gateway Mappings
        {
            echo "AUTH_SERVICE_URL=http://127.0.0.1:3001"
            echo "USER_SERVICE_URL=http://127.0.0.1:3002"
            echo "ACADEMICS_SERVICE_URL=http://127.0.0.1:3004"
            echo "OUTPASS_SERVICE_URL=http://127.0.0.1:3003"
            echo "FILES_SERVICE_URL=http://127.0.0.1:3005"
            echo "MAIL_SERVICE_URL=http://127.0.0.1:3006"
            echo "NOTIFICATION_SERVICE_URL=http://127.0.0.1:3007"
            echo "CRON_SERVICE_URL=http://127.0.0.1:3008"
        } >> "$path/.env"
    fi
done

# 4. Tooling Installation (Non-interactive)
echo "📦 Installing development tools (Prisma @ v6)..."
npm install --no-save ts-node bcrypt @types/bcrypt pg @types/pg prisma@6 @prisma/client@6

# 5. Schema Sync (Non-interactive)
echo "💎 Synchronizing Local Database Schemas..."
# We use 'yes' to auto-confirm any prisma prompts
if [ -d "apps/uniz-auth" ]; then
    export DATABASE_URL="postgresql://user:password@127.0.0.1:5432/uniz_db?sslmode=disable&schema=auth_v2"
    yes | npx prisma@6 db push --accept-data-loss --schema=apps/uniz-auth/prisma/schema.prisma
fi
if [ -d "apps/uniz-user" ]; then
    export DATABASE_URL="postgresql://user:password@127.0.0.1:5432/uniz_db?sslmode=disable&schema=user_v2"
    yes | npx prisma@6 db push --accept-data-loss --schema=apps/uniz-user/prisma/schema.prisma
fi

echo ""
echo "🔥 MISSION CONTROL IS SHIPYARD READY!"
echo "--------------------------------------------------------"
echo "1. SEED DATA:  npm run seed:local"
echo "2. LAUNCH ALL: npm run dev:all"
echo "--------------------------------------------------------"
