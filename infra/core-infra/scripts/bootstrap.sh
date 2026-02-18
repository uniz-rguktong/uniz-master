#!/bin/bash
# UniZ Microservices Bootstrap Script
# This script clones all required services from the uniz-rguktong organization.

REPOS=(
  "uniz-gateway"
  "uniz-auth-service"
  "uniz-user-service"
  "uniz-outpass-service"
  "uniz-notification-service"
  "uniz-cron-service"
  "uniz-shared"
  "uniz-client"
)

# Colors for better output
BLUE='\033[0;34m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}Bootstrapping UniZ Microservices Environment...${NC}"

# Ensure we are in the right directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR/.."

for repo in "${REPOS[@]}"; do
  if [ ! -d "../$repo" ]; then
    echo -e "Cloning $repo..."
    git clone "https://github.com/uniz-rguktong/$repo.git" "../$repo"
    if [ $? -ne 0 ]; then
      echo -e "Failed to clone $repo. Please check your permissions."
    fi
  else
    echo -e "${GREEN}$repo${NC} is already present."
  fi
done

echo -e "\n${GREEN}Bootstrap Complete!${NC}"
echo -e "You can now run ${BLUE}./start.sh${NC} to launch the system."
