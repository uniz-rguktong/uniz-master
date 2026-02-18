#!/bin/bash
set -e

echo "Starting Docker Environment Setup (Structured)..."

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"

# Clean logs
mkdir -p "$ROOT_DIR/logs"
rm -rf "$ROOT_DIR/logs"/*.log

# Check Docker
if ! docker info > /dev/null 2>&1; then
  echo "Error: Docker is not running. Please start Docker/Colima first."
  exit 1
fi

# Build and Start Services
echo "Rebuilding and starting services..."
cd "$ROOT_DIR/infra/core-infra"
docker-compose up -d --build

echo "Waiting for services to become healthy (30s)..."
sleep 30

# Clean OTP Logs
echo "Cleaning OTP logs..."
cd "$ROOT_DIR/apps/uniz-auth"
npx ts-node scripts/clean_otp.ts || echo "Skipping OTP cleanup"

# Run Test
echo "Running E2E Test..."
cd "$SCRIPT_DIR"
BASE_URL="http://localhost:80/api/v1" node comprehensive_test.js

echo "Test Complete."
