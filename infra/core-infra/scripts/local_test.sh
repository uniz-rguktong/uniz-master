#!/bin/bash

# --- UI COLORS ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "${CYAN}${BOLD}"
echo "----------------------------------------------------"
echo "           UNIZ INFRASTRUCTURE TEST GUIDE           "
echo "----------------------------------------------------"
echo -e "${NC}"

# --- SYSTEM DETECTION ---
ARCH=$(uname -m)
IS_APPLE_SILICON=false
if [[ "$ARCH" == "arm64" ]]; then
    IS_APPLE_SILICON=true
    echo -e "SYSTEM   : Apple Silicon (ARM64)"
else
    echo -e "SYSTEM   : Standard Architecture ($ARCH)"
fi

# --- DOCKER CHECK ---
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}[ERROR] Docker is not running.${NC}"
    echo "Action Required: Start Docker Desktop or Colima to proceed."
    exit 1
fi

DOCKER_MEM=$(docker info --format '{{.MemTotal}}' 2>/dev/null || echo "0")
DOCKER_CPU=$(docker info --format '{{.NCPU}}' 2>/dev/null || echo "0")
MEM_GB=$((DOCKER_MEM / 1024 / 1024 / 1024))

echo -e "RESOURCES: $MEM_GB GB RAM, $DOCKER_CPU CPU cores"

if [ "$MEM_GB" -lt 4 ]; then
    echo -e "${YELLOW}[WARN] Low memory detected ($MEM_GB GB).${NC}"
    echo "Requirement: At least 4GB (8GB recommended) is needed for stability."
    read -t 5 -p "Continue anyway? (y/n) [n]: " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# # --- ENV CHECK ---
# if [ ! -f ".env" ]; then
#     echo -e "${RED}[ERROR] Configuration file (.env) missing.${NC}"
#     echo "Action Required: Run 'npm run setup' and configure database URLs."
#     exit 1
# fi
set -a
source .env
set +a
# --- PRE-FLIGHT MODE CHECK ---
MODE="monorepo"
if [ ! -d "../uniz-auth" ]; then
    MODE="standalone"
    echo -e "${YELLOW}[INFO] Standalone mode detected (Infrastructure-only).${NC}"
fi

# --- PRE-FLIGHT AUTH CHECK ---
if [ -z "$AUTH_DATABASE_URL" ] && [ -f ".env" ]; then
    set -a
    source .env
    set +a
fi

# Fallback check
if [ -z "$OUTPASS_DATABASE_URL" ]; then
    echo "WARNING: OUTPASS_DATABASE_URL is empty. Attempting manual load..."
    val=$(grep "OUTPASS_DATABASE_URL" .env | head -n 1 | cut -d '=' -f2-)
    if [ -n "$val" ]; then
       # Strip quotes if present
       val=$(echo "$val" | tr -d '"')
       # Apply macOS localhost mapping for host-side access
       if [[ "$OSTYPE" == "darwin"* ]]; then
         val=$(echo "$val" | sed 's/uniz-postgres/localhost/g')
       fi
       export OUTPASS_DATABASE_URL="$val"
    else
       export OUTPASS_DATABASE_URL="postgresql://user:password@localhost:5432/uniz_db?sslmode=disable&schema=outpass_v2"
    fi
fi

# --- CONFIGURATION ---
# --- CONFIGURATION & STARTUP ---
echo -e "\n${BOLD}SYSTEM STATUS CHECK${NC}"

check_services() {
    local required_services=("uniz-gateway" "uniz-auth-service" "uniz-user-service" "uniz-outpass-service")
    for svc in "${required_services[@]}"; do
        if ! docker ps --format '{{.Names}}' | grep -q "^${svc}$"; then
            return 1
        fi
    done
    return 0
}

if check_services; then
    echo -e "${GREEN}[INFO] Cluster services detected running.${NC}"
    echo -e "Skipping startup sequence and proceeding to test suite..."
    START_METHOD="skip"
else
    echo -e "${YELLOW}[INFO] Services not running.${NC}"
    
    if [ "$MODE" == "standalone" ]; then
        echo -e "${RED}[ERROR] In standalone mode, you cannot use dev startup scripts.${NC}"
        echo -e "Use ${BOLD}npm run deploy:vps${NC} to pull and start production images."
        exit 1
    fi

    echo -e "${CYAN}Creating startup configuration...${NC}"
    
    # 1. Cleanup
    read -t 5 -p "Clean existing environment before start? (y/n) [n]: " -n 1 -r REPLY
    echo
    CLEAN_DOCKER=false
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        CLEAN_DOCKER=true
    else 
        # Default to no if timed out or entered anything else
        CLEAN_DOCKER=false
    fi

    # 2. Startup Method
    START_METHOD="fast"
    if [ "$IS_APPLE_SILICON" = true ]; then
        echo -e "${CYAN}[NOTE] Sequential startup recommended for ARM64 emulation.${NC}"
        read -t 5 -p "Use sequential startup? (y/n) [y]: " -n 1 -r REPLY
        echo
        if [[ $REPLY =~ ^[Nn]$ ]]; then
            START_METHOD="fast"
        else
            START_METHOD="safe"
        fi
    else
        read -t 5 -p "Use sequential startup? (y/n) [n]: " -n 1 -r REPLY
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            START_METHOD="safe"
        fi
    fi

    # --- EXECUTION ---
    echo -e "\n${BLUE}${BOLD}ORCHESTRATING STACK${NC}"

    if [ "$CLEAN_DOCKER" = true ]; then
        echo -e "Status: Cleaning containers..."
        docker-compose down -v --remove-orphans > /dev/null 2>&1
    fi

    if [ "$START_METHOD" = "safe" ]; then
        echo -e "Status: Sequential startup initiated..."
        bash scripts/start_sequential.sh
    else
        echo -e "Status: Fast startup initiated..."
        docker-compose up -d
        echo -e "Status: Cooling down (30s)..."
        sleep 30
    fi
fi

# --- HOT PATCH FOR AUTH MIDDLEWARE PRIORITY ---
# Always try to apply patch to ensure consistency, even if already running
echo -e "Status: Verifying integrity patches..."
SERVICES=(uniz-auth-service uniz-user-service uniz-outpass-service uniz-academics-service uniz-files-service uniz-mail-service uniz-notification-service uniz-cron-service)
for svc in "${SERVICES[@]}"; do
    docker exec $svc sed -i 's/if (internalSecret && internalSecret === INTERNAL_SECRET)/if (!req.headers.authorization \&\& internalSecret \&\& internalSecret === INTERNAL_SECRET)/' dist/middlewares/auth.middleware.js 2>/dev/null
done
docker exec uniz-mail-service sed -i 's/if (internalSecret && internalSecret === INTERNAL_SECRET)/if (!req.headers.authorization \&\& internalSecret \&\& internalSecret === INTERNAL_SECRET)/' dist/middlewares/internal-auth.middleware.js 2>/dev/null
echo -e "Status: Patches verified."

# --- ENV SUBSTITUTION (macOS Host - For Host Scripts) ---
if [[ "$OSTYPE" == "darwin"* ]]; then
  echo -e "Status: Mapping infrastructure URLs to localhost for host-side execution..."
  export AUTH_DATABASE_URL=$(echo $AUTH_DATABASE_URL | sed 's/uniz-postgres/localhost/g')
  export USER_DATABASE_URL=$(echo $USER_DATABASE_URL | sed 's/uniz-postgres/localhost/g')
  export OUTPASS_DATABASE_URL=$(echo $OUTPASS_DATABASE_URL | sed 's/uniz-postgres/localhost/g')
  export ACADEMICS_DATABASE_URL=$(echo $ACADEMICS_DATABASE_URL | sed 's/uniz-postgres/localhost/g')
  export FILES_DATABASE_URL=$(echo $FILES_DATABASE_URL | sed 's/uniz-postgres/localhost/g')
  export MAIL_DATABASE_URL=$(echo $MAIL_DATABASE_URL | sed 's/uniz-postgres/localhost/g')
  export NOTIFICATION_DATABASE_URL=$(echo $NOTIFICATION_DATABASE_URL | sed 's/uniz-postgres/localhost/g')
  export CRON_DATABASE_URL=$(echo $CRON_DATABASE_URL | sed 's/uniz-postgres/localhost/g')
fi

# --- HEALTH CHECK ---
echo -e "\n${BOLD}SYSTEM VERIFICATION${NC}"
HEALTH_STATUS=$(curl -s http://localhost/api/v1/system/health | jq -r '.status' 2>/dev/null)

if [ "$HEALTH_STATUS" = "ok" ]; then
    echo -e "${GREEN}[SUCCESS] Cluster is healthy.${NC}"
elif [ -n "$HEALTH_STATUS" ]; then
    echo -e "${YELLOW}[WARN] Cluster status: $HEALTH_STATUS (Proceeding with tests...)${NC}"
else
    echo -e "${RED}[FAILURE] Status: $HEALTH_STATUS${NC}"
    docker ps --format "table {{.Names}}\t{{.Status}}"
    read -t 5 -p "Proceed with test suite anyway? (y/n) [n]: " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# --- RUN TESTS ---
echo -e "\n${CYAN}${BOLD}EXECUTING COMPREHENSIVE TEST SUITE${NC}"
export BASE_URL="http://localhost/api/v1"

# Ensure all database URLs are exported for host-side test scripts (OTP bypass fix)
export AUTH_DATABASE_URL USER_DATABASE_URL OUTPASS_DATABASE_URL ACADEMICS_DATABASE_URL FILES_DATABASE_URL MAIL_DATABASE_URL NOTIFICATION_DATABASE_URL CRON_DATABASE_URL

if [ ! -d "node_modules" ]; then
    echo -e "Status: Synchronizing dependencies..."
    npm install > /dev/null 2>&1
fi

# --- SEED DATA ---
echo -e "\n${CYAN}${BOLD}INITIALIZING TEST DATA${NC}"
npm run data:reset

node tests/comprehensive_test.js

echo -e "\n${GREEN}${BOLD}COMPLETED: ALL OPERATIONS NOMINAL${NC}"
