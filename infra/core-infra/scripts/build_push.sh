#!/bin/bash
set -e

# Ensure script is run from the correct directory
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$DIR/.."

if [ ! -f "$DIR/docker-compose.yml" ]; then
  echo "Error: docker-compose.yml not found in $DIR"
  exit 1
fi

echo "🚀 Starting Docker Build & Push Process for UniZ Platform..."

# Check Docker login status
if ! docker info > /dev/null 2>&1; then
  echo "Error: Docker is not running."
  exit 1
fi

# Optional: Prompt for Docker login if not logged in (simplified check)
# Ideally, check `docker system info` or try a pull/push.

echo "Building images (this may take a while)..."
# Build all services defined in docker-compose.yml
# Using --pull to ensure base images are up-to-date
cd "$DIR"
docker-compose build --pull

echo "✅ Build complete."

echo "Pushing images to Docker Hub..."
# Push all built images to the registry
docker-compose push

echo "🎉 All images pushed successfully!"
echo "Version: latest"
