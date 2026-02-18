#!/bin/bash
set -e

echo "Building uniz-auth-service..."
DOCKER_DEFAULT_PLATFORM=linux/amd64 docker build --no-cache -t desusreecharan/uniz-auth-service:latest -f uniz-auth/Dockerfile uniz-auth

echo "Building uniz-user-service..."
DOCKER_DEFAULT_PLATFORM=linux/amd64 docker build --no-cache -t desusreecharan/uniz-user-service:latest -f uniz-user/Dockerfile uniz-user

echo "Building uniz-outpass-service..."
DOCKER_DEFAULT_PLATFORM=linux/amd64 docker build --no-cache -t desusreecharan/uniz-outpass-service:latest -f uniz-outpass/Dockerfile uniz-outpass

echo "Building uniz-academics-service..."
DOCKER_DEFAULT_PLATFORM=linux/amd64 docker build --no-cache -t desusreecharan/uniz-academics-service:latest -f uniz-academics/Dockerfile uniz-academics

echo "Building uniz-files-service..."
DOCKER_DEFAULT_PLATFORM=linux/amd64 docker build --no-cache -t desusreecharan/uniz-files-service:latest -f uniz-files/Dockerfile uniz-files

echo "Building uniz-mail-service..."
DOCKER_DEFAULT_PLATFORM=linux/amd64 docker build --no-cache -t desusreecharan/uniz-mail-service:latest -f uniz-mail/Dockerfile uniz-mail

echo "Building uniz-notification-service..."
DOCKER_DEFAULT_PLATFORM=linux/amd64 docker build --no-cache -t desusreecharan/uniz-notification-service:latest -f uniz-notifications/Dockerfile uniz-notifications

echo "Building uniz-cron-service..."
DOCKER_DEFAULT_PLATFORM=linux/amd64 docker build --no-cache -t desusreecharan/uniz-cron-service:latest -f uniz-cron/Dockerfile uniz-cron

echo "Building uniz-gateway (nginx)..."
DOCKER_DEFAULT_PLATFORM=linux/amd64 docker build --no-cache -t desusreecharan/uniz-gateway:latest -f uniz-infrastructure/nginx/Dockerfile uniz-infrastructure/nginx

echo "Building uniz-gateway-api..."
DOCKER_DEFAULT_PLATFORM=linux/amd64 docker build --no-cache -t desusreecharan/uniz-gateway-api:latest -f uniz-gateway/Dockerfile uniz-gateway

echo "All images built successfully."
