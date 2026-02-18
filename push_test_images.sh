#!/bin/bash
set -e

echo "Pushing uniz-auth-service..."
docker push desusreecharan/uniz-auth-service:latest

echo "Pushing uniz-user-service..."
docker push desusreecharan/uniz-user-service:latest

echo "Pushing uniz-outpass-service..."
docker push desusreecharan/uniz-outpass-service:latest

echo "Pushing uniz-academics-service..."
docker push desusreecharan/uniz-academics-service:latest

echo "Pushing uniz-files-service..."
docker push desusreecharan/uniz-files-service:latest

echo "Pushing uniz-mail-service..."
docker push desusreecharan/uniz-mail-service:latest

echo "Pushing uniz-notification-service..."
docker push desusreecharan/uniz-notification-service:latest

echo "Pushing uniz-cron-service..."
docker push desusreecharan/uniz-cron-service:latest

echo "Pushing uniz-gateway (nginx)..."
docker push desusreecharan/uniz-gateway:latest

echo "Pushing uniz-gateway-api..."
docker push desusreecharan/uniz-gateway-api:latest

echo "All images pushed successfully (Simulated GitHub Action)."
