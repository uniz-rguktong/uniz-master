#!/bin/bash

# Load environment variables
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}Checking enviroment configuration...${NC}"

# Logic to choose compose file
# Priority:
# 1. COMPOSE_FILE env var
# 2. NODE_ENV=production -> docker-compose.prod.yml
# 3. Fallback to docker-compose.yml (Dev)

if [ -n "$COMPOSE_FILE" ]; then
    TARGET_FILE="$COMPOSE_FILE"
    echo -e "${YELLOW}Using explicitly defined compose file: $TARGET_FILE${NC}"
elif [ "$NODE_ENV" == "production" ]; then
    TARGET_FILE="docker-compose.prod.yml"
    echo -e "${YELLOW}[PROD] Production environment detected (NODE_ENV=production). Using $TARGET_FILE${NC}"
else
    TARGET_FILE="docker-compose.yml"
    echo -e "${GREEN}[DEV] Development environment assumed. Using $TARGET_FILE${NC}"
fi

if [ -f "$TARGET_FILE" ]; then
    echo -e "${CYAN}Pulling latest images defined in $TARGET_FILE...${NC}"
    docker-compose -f "$TARGET_FILE" pull
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Successfully pulled latest images.${NC}"
    else
        echo -e "${RED}Failed to pull images. Please check your network or configuration.${NC}"
        exit 1
    fi
else
    echo -e "${RED}Error: Target compose file '$TARGET_FILE' not found!${NC}"
    exit 1
fi
