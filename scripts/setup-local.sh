#!/bin/bash

# UniZ Universal Local Setup Script - V10 (The Bulletproof Tank)
# Built for RGUKT Ongole UniZ Ecosystem 2026.
# Focused on extreme robustness and cross-platform compatibility.

set -e

echo "🚀 Starting UniZ Master Setup (Local Environment)..."

# 1. System Check
check_dep() {
    if ! [ -x "$(command -v $1)" ]; then
        echo "❌ Error: $1 is not installed. Please install it to proceed." >&2
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
    if docker compose version &> /dev/null; then
        COMPOSE_CMD="docker compose"
    else
        echo "❌ Error: Neither 'docker-compose' nor 'docker compose' found."
        exit 1
    fi
fi

# 2. Nuclear Port & Name Clearance
echo "🧹 Clearing existing infrastructure (Guaranteeing Port 5432 & 6379)..."

# Forcefully remove containers by name to prevent "Conflict" errors
docker rm -f uniz-postgres uniz-redis >/dev/null 2>&1 || true
docker rm -f uniz-gateway uniz-gateway-api uniz-auth-service uniz-user-service uniz-academics-service \
          uniz-outpass-service uniz-files-service uniz-mail-service uniz-notification-service \
          uniz-cron-service >/dev/null 2>&1 || true

# Kill any local node processes using our core ports (3000-3008)
# We use a gentle approach first, then more aggressive if lsof is available
if [ -x "$(command -v lsof)" ]; then
    for port in {3000..3008}; do
        pid=$(lsof -t -iTCP:$port -sTCP:LISTEN 2>/dev/null || true)
        if [ -n "$pid" ]; then
            echo "   -> Cleaning up port $port (PID: $pid)"
            kill -9 $pid 2>/dev/null || true
        fi
    done
fi

# 3. Booting Core Infrastructure
echo "🏗️  Starting Core Infrastructure (Postgres & Redis)..."
if [ -f "infra/core-infra/docker-compose.yml" ]; then
    (cd infra/core-infra && $COMPOSE_CMD up -d uniz-postgres uniz-redis)
else
    $COMPOSE_CMD up -d uniz-postgres uniz-redis 2>/dev/null || $COMPOSE_CMD up -d
fi

# Verification loop for Postgres readiness
echo "⏳ Waiting for Postgres to wake up (Health Check)..."
MAX_TRIES=30
COUNT=0
until docker exec uniz-postgres pg_isready -U user -d uniz_db >/dev/null 2>&1 || [ $COUNT -eq $MAX_TRIES ]; do
    sleep 2
    ((COUNT++))
    echo -n "."
done
echo ""

if [ $COUNT -eq $MAX_TRIES ]; then
    echo "❌ Timeout waiting for Postgres. Check 'docker logs uniz-postgres'."
    exit 1
fi

# 4. Intelligent ENV Propagation
echo "🔐 Propagating secrets with LOCAL development overrides..."
if [ ! -f "secrets.env" ]; then
    echo "📄 secrets.env not found. Initializing from template..."
    cp secrets.env.example secrets.env 2>/dev/null || (echo "❌ secrets.env.example missing!" && exit 1)
fi

# Portable sed wrapper
gsed() {
  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "$@"
  else
    sed -i "$@"
  fi
}

SERVICES=(
  "apps/uniz-gateway:GATEWAY"
  "apps/uniz-auth:AUTH"
  "apps/uniz-user:USER"
  "apps/uniz-academics:ACADEMICS"
  "apps/uniz-outpass:OUTPASS"
  "apps/uniz-files:FILES"
  "apps/uniz-notifications:NOTIFICATION"
  "apps/uniz-mail:MAIL"
  "apps/uniz-cron:CRON"
  "apps/uniz-portal:PORTAL"
)

for entry in "${SERVICES[@]}"; do
    path="${entry%%:*}"
    prefix="${entry##*:}"
    
    if [ -d "$path" ]; then
        echo "   -> Injecting environment variables: $path/.env"
        cat secrets.env > "$path/.env"
        printf "\n" >> "$path/.env"
        
        # Localhost overrides for hybrid (on-host node + dockerized DB)
        gsed 's/76.13.241.174/localhost/g' "$path/.env"
        gsed 's/uniz-redis/localhost/g' "$path/.env"
        gsed 's/uniz-postgres/localhost/g' "$path/.env"
        gsed 's/api.uniz.rguktong.in/localhost:3000/g' "$path/.env"
        gsed 's/https:\/\/localhost:3000/http:\/\/localhost:3000/g' "$path/.env"
        gsed 's/0x4AAAAAACnuFU49Yv6dqJum/1x00000000000000000000AA/g' "$path/.env"
        gsed 's/REDACTED_TURNSTILE_SECRET/1x00000000000000000000000000000000/g' "$path/.env"
        
        # Map specific DB URL to generic DATABASE_URL for Prisma/Backend
        db_var="${prefix}_DATABASE_URL"
        val=$(grep "^${db_var}=" "$path/.env" | head -n 1 | cut -d'=' -f2-)
        
        if [ -n "$val" ]; then
            echo "DATABASE_URL=$val" >> "$path/.env"
        fi
        
        # Routing flags
        echo "DOCKER_ENV=false" >> "$path/.env"
        echo "GATEWAY_URL=http://localhost:3000/api/v1" >> "$path/.env"
        echo "FORCE_GMAIL=true" >> "$path/.env"

        # Inject Service URLs for Gateway Proxying (Localhost)
        echo "AUTH_SERVICE_URL=http://localhost:3001" >> "$path/.env"
        echo "USER_SERVICE_URL=http://localhost:3002" >> "$path/.env"
        echo "ACADEMICS_SERVICE_URL=http://localhost:3004" >> "$path/.env"
        echo "OUTPASS_SERVICE_URL=http://localhost:3003" >> "$path/.env"
        echo "FILES_SERVICE_URL=http://localhost:3005" >> "$path/.env"
        echo "MAIL_SERVICE_URL=http://localhost:3006" >> "$path/.env"
        echo "NOTIFICATION_SERVICE_URL=http://localhost:3007" >> "$path/.env"
        echo "CRON_SERVICE_URL=http://localhost:3008" >> "$path/.env"
    fi
done

# 5. Schema Sync & Seeder Preparation
echo "💎 Synchronizing Local Database Schemas..."
# Ensure DATABASE_URL is set in environment for Prisma push commands
if [ -d "apps/uniz-auth" ]; then
    export DATABASE_URL="postgresql://user:password@localhost:5432/uniz_db?sslmode=disable&schema=auth_v2"
    (cd apps/uniz-auth && npx prisma db push --accept-data-loss --skip-generate)
fi
if [ -d "apps/uniz-user" ]; then
    export DATABASE_URL="postgresql://user:password@localhost:5432/uniz_db?sslmode=disable&schema=user_v2"
    (cd apps/uniz-user && npx prisma db push --accept-data-loss --skip-generate)
fi

# 6. Final Tooling check
echo "📦 Installing development tools..."
npm install --no-save ts-node bcrypt @types/bcrypt pg @types/pg prisma @prisma/client

echo ""
echo "🔥 MISSION CONTROL IS SHIPYARD READY!"
echo "--------------------------------------------------------"
echo "1. SEED DATA:  npm run seed:local"
echo "2. LAUNCH ALL: npm run dev:all"
echo "--------------------------------------------------------"
