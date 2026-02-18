#!/bin/bash
# Bring Backend Online & Report Status
# Auto-detects Colima/Docker state, starts services, and lists available APIs.

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

# 0. Fast Track Check
GATEWAY_URL="http://localhost/gateway-status"
if curl -s -f -o /dev/null "$GATEWAY_URL"; then
    echo -e "${GREEN}${BOLD}✔ System Already Online${NC}"
    URL_READY=true
else
    # 1. Check Docker/Colima Status
    echo -e "${BOLD}Checking Container Runtime...${NC}"
    if ! docker info > /dev/null 2>&1; then
    echo -e "${YELLOW}Docker is not running.${NC}"
    if command -v colima &> /dev/null; then
        echo -e "${CYAN}Starting Colima (Architecture: aarch64)...${NC}"
        colima start --arch aarch64 --cpu 4 --memory 8 --disk 50
        if [ $? -ne 0 ]; then
            echo -e "${RED}Failed to start Colima. Please check logs.${NC}"
            exit 1
        fi
    else
        echo -e "${RED}Colima not found and Docker is down. Please start Docker manually.${NC}"
        exit 1
    fi
    else
        echo -e "${GREEN}Docker is running.${NC}"
    fi

    # 2. Start Services (Smart Logic)
    echo -e "\n${BOLD}Bringing Up Backend Services...${NC}"
    bash scripts/smart_up.sh

    # 3. Fast Health Wait (Loop)
    echo -e "\n${BOLD}Waiting for Gateway...${NC}"
    GATEWAY_URL="http://localhost/gateway-status"
    MAX_RETRIES=30
    COUNT=0
    URL_READY=false

    while [ $COUNT -lt $MAX_RETRIES ]; do
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$GATEWAY_URL")
        if [ "$HTTP_CODE" == "200" ]; then
            URL_READY=true
            break
        fi
        echo -n "."
        sleep 2
        COUNT=$((COUNT+1))
    done
    echo ""
fi

if [ "$URL_READY" = true ]; then 
    echo -e "${GREEN}${BOLD}✔ System Online${NC}"
    echo -e "Base URL:   ${CYAN}http://localhost/api/v1${NC}"
    echo -e "Health URL: ${CYAN}http://localhost/api/v1/system/health${NC}"

    # 4. System Health Check
    echo -n "System Health: "
    HEALTH_JSON=$(curl -s http://localhost/api/v1/system/health)
    STATUS=$(echo $HEALTH_JSON | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    
    if [ "$STATUS" == "ok" ]; then
        echo -e "${GREEN}${BOLD}OK${NC}"
    else
        echo -e "${RED}${BOLD}$STATUS${NC}"
        # Optional: List unhealthy services if possible
        echo -e "${YELLOW}(Run 'npm run health' for details)${NC}"
    fi
    
    # 5. Parse Postman Collection for Summary
    COLLECTION_FILE="postman/UniZ Development Collection.postman_collection.json"
    if [ -f "$COLLECTION_FILE" ]; then
        echo -e "\n${BOLD}Available API Modules:${NC}"
        # Extract top-level folder names using grep/sed (simple parsing)
        grep -A 1 "\"name\":" "$COLLECTION_FILE" | grep -v "_postman_id" | grep -v "UniZ Development Collection" | grep "\"name\":" | head -n 10 | cut -d'"' -f4 | while read -r line; do
            echo -e "  • $line"
        done
        echo -e "\n(See Postman collection for full endpoint details)"
    fi
    
    echo -e "\n${GREEN}${BOLD}You are good to go! 🚀${NC}"
else
    echo -e "${RED}${BOLD}✘ Gateway failed to respond after 60s.${NC}"
    echo -e "Check logs with: ${YELLOW}npm run docker:logs${NC}"
    exit 1
fi
