#!/bin/bash
set -e

echo "Building uniz-auth-service..."
DOCKER_DEFAULT_PLATFORM=linux/amd64 docker build --no-cache -t desusreecharan/uniz-auth-service:latest -f apps/uniz-auth/Dockerfile apps/uniz-auth

echo "Building uniz-user-service..."
DOCKER_DEFAULT_PLATFORM=linux/amd64 docker build --no-cache -t desusreecharan/uniz-user-service:latest -f apps/uniz-user/Dockerfile apps/uniz-user

echo "Building uniz-outpass-service..."
DOCKER_DEFAULT_PLATFORM=linux/amd64 docker build --no-cache -t desusreecharan/uniz-outpass-service:latest -f apps/uniz-outpass/Dockerfile apps/uniz-outpass

echo "Building uniz-academics-service..."
DOCKER_DEFAULT_PLATFORM=linux/amd64 docker build --no-cache -t desusreecharan/uniz-academics-service:latest -f apps/uniz-academics/Dockerfile apps/uniz-academics

echo "Building uniz-files-service..."
DOCKER_DEFAULT_PLATFORM=linux/amd64 docker build --no-cache -t desusreecharan/uniz-files-service:latest -f apps/uniz-files/Dockerfile apps/uniz-files

echo "Building uniz-mail-service..."
DOCKER_DEFAULT_PLATFORM=linux/amd64 docker build --no-cache -t desusreecharan/uniz-mail-service:latest -f apps/uniz-mail/Dockerfile apps/uniz-mail

echo "Building uniz-notification-service..."
DOCKER_DEFAULT_PLATFORM=linux/amd64 docker build --no-cache -t desusreecharan/uniz-notification-service:latest -f apps/uniz-notifications/Dockerfile apps/uniz-notifications

echo "Building uniz-cron-service..."
DOCKER_DEFAULT_PLATFORM=linux/amd64 docker build --no-cache -t desusreecharan/uniz-cron-service:latest -f apps/uniz-cron/Dockerfile apps/uniz-cron

echo "Building uniz-gateway (nginx)..."
DOCKER_DEFAULT_PLATFORM=linux/amd64 docker build --no-cache -t desusreecharan/uniz-gateway:latest -f infra/core-infra/nginx/Dockerfile infra/core-infra/nginx

echo "Building uniz-gateway-api..."
DOCKER_DEFAULT_PLATFORM=linux/amd64 docker build --no-cache -t desusreecharan/uniz-gateway-api:latest -f apps/uniz-gateway/Dockerfile apps/uniz-gateway

echo "All images built successfully."
