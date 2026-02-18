#!/bin/bash

# --- UI COLORS ---
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "${CYAN}${BOLD}"
echo "----------------------------------------------------"
echo "           UNIZ VPS DEPLOYMENT SEQUENCE             "
echo "----------------------------------------------------"
echo -e "${NC}"

# 1. Environment Setup
echo -e "${BOLD}[1/5] Checking Environment${NC}"
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        echo -e "${YELLOW}Creating .env from example...${NC}"
        cp .env.example .env
        echo -e "${YELLOW}Action Required: Please verify .env values if production secrets differ.${NC}"
    else
        echo -e "${RED}Error: No .env or .env.example found.${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}.env file detected.${NC}"
fi

# 2. Pull Images
echo -e "\n${BOLD}[2/5] Pulling Production Images${NC}"
echo -e "Source: docker.io/desusreecharan/..."
docker-compose -f docker-compose.prod.yml pull
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to pull images.${NC}"
    exit 1
fi
echo -e "${GREEN}Images synchronized.${NC}"

# 3. Start Services
echo -e "\n${BOLD}[3/5] Starting Services${NC}"
docker-compose -f docker-compose.prod.yml up -d
echo -e "${GREEN}Stack deployed.${NC}"

echo -e "Waiting for database readiness (10s)..."
sleep 10

# 4. Data Initialization
echo -e "\n${BOLD}[4/5] Initializing Database & Seed Data${NC}"
# We reuse the robust data reset script but mute it for minimal output
# Ensure script uses the variables loaded from .env which docker-compose also uses
npm run data:reset

# 5. Verification (Test Suite)
echo -e "\n${BOLD}[5/5] Verifying Deployment${NC}"
echo -e "Running E2E Health & Logic Check..."

# Export correct connection strings for the test runner on the host
# On VPS (assuming Linux), we might need to map differently or use host networking.
# But typically, if running from host, localhost:port works because ports are mapped 5432:5432 etc.
# However, if .env uses 'uniz-postgres', the node script running on HOST needs 'localhost'.
set -a
source .env
set +a

# Adjust URLs for host-side execution
export AUTH_DATABASE_URL=$(echo $AUTH_DATABASE_URL | sed 's/uniz-postgres/localhost/g')
export USER_DATABASE_URL=$(echo $USER_DATABASE_URL | sed 's/uniz-postgres/localhost/g')
export OUTPASS_DATABASE_URL=$(echo $OUTPASS_DATABASE_URL | sed 's/uniz-postgres/localhost/g')
export ACADEMICS_DATABASE_URL=$(echo $ACADEMICS_DATABASE_URL | sed 's/uniz-postgres/localhost/g')
export FILES_DATABASE_URL=$(echo $FILES_DATABASE_URL | sed 's/uniz-postgres/localhost/g')
export MAIL_DATABASE_URL=$(echo $MAIL_DATABASE_URL | sed 's/uniz-postgres/localhost/g')
export NOTIFICATION_DATABASE_URL=$(echo $NOTIFICATION_DATABASE_URL | sed 's/uniz-postgres/localhost/g')
export CRON_DATABASE_URL=$(echo $CRON_DATABASE_URL | sed 's/uniz-postgres/localhost/g')
export BASE_URL="http://localhost:80/api/v1" # Explicit port 80 for clarity

# Run the comprehensive test
AUTOMATED_TEST=true node tests/comprehensive_test.js

if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}${BOLD}DEPLOYMENT SUCCESSFUL: System is live and stable.${NC}"
    
    # Final Status Report
    echo -e "\n${CYAN}${BOLD}SYSTEM STATUS REPORT${NC}"
    echo -e "----------------------------------------------------"
    echo -e "Base URL   : ${BOLD}http://localhost/api/v1${NC}"
    
    HEALTH_JSON=$(curl -s http://localhost/api/v1/system/health)
    STATUS=$(echo $HEALTH_JSON | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    
    if [ "$STATUS" == "ok" ]; then
        echo -e "Health     : ${GREEN}OK${NC}"
        # detailed services
        echo -e "Services   :"
        echo -e "  • Gateway  : ${GREEN}Running${NC}"
        echo -e "  • Auth     : ${GREEN}Running${NC}"
        echo -e "  • User     : ${GREEN}Running${NC}"
        echo -e "  • Outpass  : ${GREEN}Running${NC}"
    else
        echo -e "Health     : ${YELLOW}${STATUS:-Unknown}${NC}"
        echo -e "Raw Output : $HEALTH_JSON"
    fi
    echo -e "----------------------------------------------------"
else
    echo -e "\n${RED}${BOLD}DEPLOYMENT WARNING: Tests reported issues. Check logs.${NC}"
    exit 1
fi
