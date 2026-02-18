#!/bin/bash
# Smart Docker Startup Script
# Detects if running in a full Monorepo (Dev) or Standalone (Prod/VPS) environment

GREEN='\033[0;32m'
YELLOW='\133[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

if [ -d "../uniz-auth" ]; then
  echo -e "${GREEN}[DEV] Development environment detected.${NC}"
  echo -e "${CYAN}Starting services using local build context (docker-compose.yml)...${NC}"
  docker-compose up -d
else
  echo -e "${YELLOW}[PROD] Standalone environment detected (Infrastructure-only).${NC}"
  echo -e "${CYAN}Starting services using production images (docker-compose.prod.yml)...${NC}"
  
  if [ ! -f "docker-compose.prod.yml" ]; then
    echo -e "${YELLOW}Warning: docker-compose.prod.yml not found. Attempting valid fallback...${NC}"
    # In some git clones, maybe it wasn't pulled? But it should be there.
    # Fallback or error
  fi

  # Pull latest images first to ensure freshness
  echo -e "Pulling latest images..."
  docker-compose -f docker-compose.prod.yml pull -q
  
  docker-compose -f docker-compose.prod.yml up -d
fi
