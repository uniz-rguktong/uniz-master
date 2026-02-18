#!/bin/bash

# Clean colors
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# Load and export environment variables from .env
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

SERVICES=(
  "uniz-user-service"
  "uniz-outpass-service"
  "uniz-academics-service"
  "uniz-files-service"
  "uniz-mail-service"
  "uniz-notification-service"
  "uniz-cron-service"
)

echo -e "${CYAN}--- Core Cluster ---${NC}"
docker-compose up -d uniz-auth-service uniz-gateway-api uniz-gateway

for SERVICE in "${SERVICES[@]}"; do
  echo -e "${CYAN}--- Deploying: $SERVICE ---${NC}"
  docker-compose up -d "$SERVICE"
  echo "Status: Waiting for stabilization..."
  sleep 15
done

echo -e "\n${BOLD}Deployment Complete. Current Cluster State:${NC}"
docker ps --format "table {{.Names}}\t{{.Status}}"
