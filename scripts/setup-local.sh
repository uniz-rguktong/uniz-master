#!/usr/bin/env bash
# UniZ local setup — cross-platform (macOS, Linux, WSL, headless VPS).
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

info()  { printf '%s\n' "$*"; }
warn()  { printf '⚠️  %s\n' "$*" >&2; }
fail()  { printf '❌ %b\n' "$*" >&2; exit 1; }

# --- OS detection ---
detect_os() {
  local uname_s
  uname_s="$(uname -s 2>/dev/null || echo unknown)"
  case "$uname_s" in
    Darwin) echo "darwin" ;;
    Linux)
      if [ -r /proc/version ] && grep -qiE 'microsoft|wsl' /proc/version 2>/dev/null; then
        echo "wsl"
      else
        echo "linux"
      fi
      ;;
    MINGW*|MSYS*|CYGWIN*) echo "windows" ;;
    *) echo "unknown" ;;
  esac
}

OS="$(detect_os)"

install_hint_node() {
  case "$OS" in
    darwin)  echo "Install Node 20+: https://nodejs.org/ or: brew install node@20" ;;
    wsl|linux) echo "Install Node 20+: https://nodejs.org/ or: curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt install -y nodejs" ;;
    windows) echo "Use WSL2 + Node 20: https://nodejs.org/" ;;
    *)       echo "Install Node.js 20+ from https://nodejs.org/" ;;
  esac
}

install_hint_docker() {
  case "$OS" in
    darwin)  echo "Install Docker Desktop: https://docs.docker.com/desktop/setup/install/mac-install/ — or Colima: brew install colima && colima start" ;;
    wsl)     echo "Install Docker Desktop for Windows with WSL2 integration: https://docs.docker.com/desktop/setup/install/windows-install/" ;;
    linux)   echo "Install Docker Engine: https://docs.docker.com/engine/install/ — then: sudo usermod -aG docker \$USER (re-login)" ;;
    windows) echo "Prefer WSL2; see docs/LOCAL_SETUP.md" ;;
    *)       echo "Install Docker: https://docs.docker.com/get-docker/" ;;
  esac
}

check_node() {
  if ! command -v node >/dev/null 2>&1; then
    fail "Node.js is not installed.\n   Fix: $(install_hint_node)"
  fi
  local major
  major="$(node -p "process.versions.node.split('.')[0]")"
  if [ "${major:-0}" -lt 20 ] 2>/dev/null; then
    fail "Node.js 20+ required (found $(node -v)).\n   Fix: $(install_hint_node)"
  fi
  if ! command -v npm >/dev/null 2>&1; then
    fail "npm is not installed (usually bundled with Node).\n   Fix: $(install_hint_node)"
  fi
}

check_docker_cli() {
  if ! command -v docker >/dev/null 2>&1; then
    fail "Docker is not installed.\n   Fix: $(install_hint_docker)"
  fi
}

# Try Colima (macOS), rootless socket (Linux), then verify daemon responds.
configure_docker_host() {
  if docker info >/dev/null 2>&1; then
    return 0
  fi

  if [ "$OS" = "darwin" ] && command -v colima >/dev/null 2>&1; then
    local colima_sock="${HOME}/.colima/default/docker.sock"
    if colima status >/dev/null 2>&1 && [ -S "$colima_sock" ]; then
      export DOCKER_HOST="unix://${colima_sock}"
      info "✅ Colima detected — using DOCKER_HOST=$DOCKER_HOST"
      docker info >/dev/null 2>&1 && return 0
    fi
    warn "Colima installed but not running. Try: colima start"
  fi

  if [ "$OS" = "linux" ] || [ "$OS" = "wsl" ]; then
    local uid sock
    uid="$(id -u 2>/dev/null || echo "")"
    for sock in \
      "${XDG_RUNTIME_DIR:-}/docker.sock" \
      "/run/user/${uid}/docker.sock"; do
      if [ -n "$sock" ] && [ -S "$sock" ]; then
        export DOCKER_HOST="unix://${sock}"
        info "✅ Rootless Docker socket: $DOCKER_HOST"
        docker info >/dev/null 2>&1 && return 0
      fi
    done
  fi

  fail "Docker daemon is not reachable.\n   Fix: start Docker Desktop / run 'colima start' / 'sudo systemctl start docker'\n   Docs: docs/LOCAL_SETUP.md#docker-is-not-running"
}

resolve_compose_cmd() {
  if docker compose version >/dev/null 2>&1; then
    echo "docker compose"
  elif command -v docker-compose >/dev/null 2>&1; then
    echo "docker-compose"
  else
    fail "Neither 'docker compose' nor 'docker-compose' found.\n   Fix: install Docker Compose plugin — https://docs.docker.com/compose/install/"
  fi
}

robust_sed() {
  local pattern="$1"
  local file="$2"
  if [ "$OS" = "darwin" ]; then
    sed -i '' "$pattern" "$file"
  else
    sed -i "$pattern" "$file"
  fi
}

local_db_schema_for() {
  case "$1" in
    AUTH) echo "uniz_auth" ;;
    USER) echo "uniz_user" ;;
    ACADEMICS) echo "uniz_academics" ;;
    OUTPASS) echo "uniz_outpass" ;;
    FILES) echo "uniz_files" ;;
    MAIL) echo "uniz_mail" ;;
    NOTIFICATION) echo "uniz_notifications" ;;
    CRON) echo "uniz_cron" ;;
    *) echo "" ;;
  esac
}

local_database_url() {
  local schema="$1"
  echo "postgresql://user:password@127.0.0.1:5432/uniz_db?sslmode=disable&schema=${schema}"
}

free_port() {
  local port="$1"
  case "$OS" in
    darwin)
      if command -v lsof >/dev/null 2>&1; then
        lsof -ti:"$port" 2>/dev/null | xargs kill -9 2>/dev/null || true
      fi
      ;;
    linux|wsl)
      if command -v fuser >/dev/null 2>&1; then
        fuser -k "${port}/tcp" 2>/dev/null || true
      elif command -v lsof >/dev/null 2>&1; then
        lsof -ti:"$port" 2>/dev/null | xargs kill -9 2>/dev/null || true
      fi
      ;;
  esac
}

info "🚀 UniZ local setup (OS: $OS)"
info "   Full guide: docs/LOCAL_SETUP.md"
info ""

check_node
check_docker_cli
configure_docker_host

COMPOSE_CMD="$(resolve_compose_cmd)"
COMPOSE_FILE="infra/core-infra/docker-compose.yml"

info "🧹 Ensuring ports 5432 (Postgres) and 6379 (Redis) are free..."
$COMPOSE_CMD -f "$COMPOSE_FILE" stop uniz-redis uniz-postgres >/dev/null 2>&1 || true
$COMPOSE_CMD -f "$COMPOSE_FILE" rm -f uniz-redis uniz-postgres >/dev/null 2>&1 || true
free_port 5432
free_port 6379

info "🏗️  Starting Postgres & Redis..."
touch infra/core-infra/.env
export POSTGRES_USER="${POSTGRES_USER:-user}"
export POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-password}"
export POSTGRES_DB="${POSTGRES_DB:-uniz_db}"

if ! $COMPOSE_CMD -f "$COMPOSE_FILE" up -d uniz-redis uniz-postgres; then
  fail "Failed to start Docker containers.\n   Fix: docker logs uniz-postgres — see docs/LOCAL_SETUP.md#troubleshooting"
fi

info "⏳ Waiting for Postgres..."
MAX_RETRIES=30
RETRY_COUNT=0
until docker exec uniz-postgres pg_isready -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" >/dev/null 2>&1 || [ "$RETRY_COUNT" -eq "$MAX_RETRIES" ]; do
  printf '.'
  sleep 1
  RETRY_COUNT=$((RETRY_COUNT + 1))
done
printf '\n'

if [ "$RETRY_COUNT" -eq "$MAX_RETRIES" ]; then
  fail "Postgres did not become ready in time.\n   Fix: docker logs uniz-postgres"
fi
info "✅ Postgres is ready"

SERVICES=(
  "apps/uniz-gateway"
  "apps/uniz-auth"
  "apps/uniz-user"
  "apps/uniz-academics"
  "apps/uniz-outpass"
  "apps/uniz-files"
  "apps/uniz-mail"
  "apps/uniz-notifications"
  "apps/uniz-cron"
  "apps/uniz-portal"
)
PREFIXES=(
  "GATEWAY"
  "AUTH"
  "USER"
  "ACADEMICS"
  "OUTPASS"
  "FILES"
  "MAIL"
  "NOTIFICATION"
  "CRON"
  "VITE"
)

if [ ! -f "secrets.env" ]; then
  if [ -f "secrets.env.example" ]; then
    warn "secrets.env missing — copying from secrets.env.example"
    cp secrets.env.example secrets.env
  else
    fail "secrets.env and secrets.env.example are both missing."
  fi
fi

info "📦 Installing monorepo dependencies (npm install at repo root)..."
if ! npm install; then
  fail "npm install failed.\n   Fix: ensure Node 20+ and network access; delete node_modules and retry"
fi

info "🧬 Syncing .env files and Prisma schemas..."
PRISMA_ERRORS=0

for i in "${!SERVICES[@]}"; do
  path="${SERVICES[$i]}"
  prefix="${PREFIXES[$i]}"

  [ -d "$path" ] || continue
  info "  → $path"

  cp secrets.env "$path/.env"
  [ -n "$(tail -c1 "$path/.env" 2>/dev/null)" ] && printf '\n' >> "$path/.env"

  robust_sed 's/76.13.241.174/127.0.0.1/g' "$path/.env"
  robust_sed 's/uniz-redis/127.0.0.1/g' "$path/.env"
  robust_sed 's/uniz-postgres/127.0.0.1/g' "$path/.env"
  robust_sed 's/api.uniz.rguktong.in/127.0.0.1:3000/g' "$path/.env"
  robust_sed 's/https:\/\/127.0.0.1:3000/http:\/\/127.0.0.1:3000/g' "$path/.env"
  # Cloudflare Turnstile test keys (always pass) — keep site + secret paired for local login
  robust_sed 's/0x4AAAAAACnuFU49Yv6dqJum/1x00000000000000000000AA/g' "$path/.env"
  robust_sed 's/REDACTED_TURNSTILE_SECRET/1x0000000000000000000000000000000AA/g' "$path/.env"
  robust_sed 's/TURNSTILE_SECRET_KEY="[^"]*"/TURNSTILE_SECRET_KEY="1x0000000000000000000000000000000AA"/g' "$path/.env"
  robust_sed 's/VITE_TURNSTILE_SITE_KEY="[^"]*"/VITE_TURNSTILE_SITE_KEY="1x00000000000000000000AA"/g' "$path/.env"

  db_var="${prefix}_DATABASE_URL"
  schema="$(local_db_schema_for "$prefix")"
  if [ -n "$schema" ]; then
    val="$(local_database_url "$schema")"
    grep -v '^DATABASE_URL=' "$path/.env" > "$path/.env.tmp" 2>/dev/null || cp "$path/.env" "$path/.env.tmp"
    mv "$path/.env.tmp" "$path/.env"
    echo "DATABASE_URL=\"$val\"" >> "$path/.env"
  elif [ -n "$(grep "^${db_var}=" "$path/.env" 2>/dev/null || true)" ]; then
    val="$(grep "^${db_var}=" "$path/.env" 2>/dev/null | head -n 1 | cut -d'=' -f2- || true)"
    val="$(echo "$val" | sed 's/localhost/127.0.0.1/g' | sed 's/uniz-postgres/127.0.0.1/g')"
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
    echo "LANDING_API_URL=http://127.0.0.1:8000"
  } >> "$path/.env"

  if [ -f "$path/prisma/schema.prisma" ]; then
    unquoted_val="$(grep '^DATABASE_URL=' "$path/.env" | tail -1 | cut -d'=' -f2- | sed -e 's/^"//' -e 's/"$//')"
    export DATABASE_URL="$unquoted_val"
    if ! (cd "$path" && npx prisma generate >/dev/null 2>&1); then
      warn "Prisma generate failed for $path — re-run setup after Postgres is healthy"
      PRISMA_ERRORS=$((PRISMA_ERRORS + 1))
    elif ! (cd "$path" && npx prisma db push --accept-data-loss >/dev/null 2>&1); then
      warn "Prisma db push failed for $path — check DATABASE_URL in secrets.env"
      PRISMA_ERRORS=$((PRISMA_ERRORS + 1))
    fi
  fi
done

unset DATABASE_URL

info ""
info "✅ Local setup complete"
info "────────────────────────────────────────"
if [ "$PRISMA_ERRORS" -gt 0 ]; then
  warn "$PRISMA_ERRORS Prisma step(s) had issues — see messages above"
fi
info "Next steps:"
info "  1. npm run seed:local     # sample users (password: password123)"
info "  2. npm run dev:all        # start all services"
info "  3. Open http://localhost:5173"
info ""
info "Health check: curl -s http://127.0.0.1:3000/api/v1/system/health"
info "Full guide:    docs/LOCAL_SETUP.md"
info "────────────────────────────────────────"
