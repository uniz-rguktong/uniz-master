#!/bin/bash

# Configuration
DOCKER_USER="desusreecharan"
SERVICES=(
    "uniz-auth-service"
    "uniz-user-service"
    "uniz-outpass-service"
    "uniz-academics-service"
    "uniz-files-service"
    "uniz-mail-service"
    "uniz-notification-service"
    "uniz-cron-service",
    "uniz-gateway-api",
    "uniz-gateway"
)

# Login
echo "Logging in to Docker Hub..."
if [ -z "$DOCKER_PAT" ]; then
    echo "Error: DOCKER_PAT environment variable is not set."
    exit 1
fi

echo "$DOCKER_PAT" | docker login -u "$DOCKER_USER" --password-stdin

if [ $? -ne 0 ]; then
    echo "Docker login failed. Please check your DOCKER_PAT."
    exit 1
fi

echo " Starting Image Refresh and Push Protocol..."

# We use docker-compose commands which are cleaner since we've updated docker-compose.yml with image names
for SERVICE in "${SERVICES[@]}"; do
    echo " Building $SERVICE..."
    docker-compose build --pull "$SERVICE"
    
    echo "📤 Pushing $SERVICE..."
    docker-compose push "$SERVICE"
    
    if [ $? -eq 0 ]; then
        echo " $SERVICE pushed successfully."
    else
        echo "❌ Failed to process $SERVICE."
    fi
done

echo " All images processed."
