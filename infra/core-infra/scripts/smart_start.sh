#!/bin/bash
# Smart Start Script
# Starts services and displays connection info without resetting data.

GREEN='\033[0;32m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "${CYAN}${BOLD}--- Starting UniZ Platform ---${NC}"

# 1. Start Services (Smart Up)
bash scripts/smart_up.sh

# 2. Status Report
echo -e "\n${GREEN}Services are running.${NC}"
echo -e "----------------------------------------------------"
echo -e "Base URL   : ${BOLD}http://localhost/api/v1${NC}"

# Optional: Health Check
echo -e "Checking health..."
HEALTH_JSON=$(curl -s http://localhost/api/v1/system/health)
STATUS=$(echo $HEALTH_JSON | grep -o '"status":"[^"]*"' | cut -d'"' -f4)

if [ "$STATUS" == "ok" ]; then
    echo -e "Health     : ${GREEN}OK${NC}"
else
    echo -e "Health     : ${CYAN}Initializing... (Try 'npm run health' in a moment)${NC}"
fi
echo -e "----------------------------------------------------"
