#!/bin/bash
set -e

echo "Starting Docker Environment Setup..."

# Clean logs
mkdir -p logs
rm -rf logs/*.log

# Check Docker
if ! docker info > /dev/null 2>&1; then
  echo "Error: Docker is not running. Please start Docker/Colima first."
  exit 1
fi

# Build and Start Services
echo "Rebuilding and starting services..."
cd uniz-infrastructure
docker-compose up -d --build

echo "Waiting for services to become healthy (30s)..."
sleep 30

# Clean OTP Logs (to avoid rate limits)
# Assuming DATABASE_URL in uniz-auth/.env points to the correct DB used by Docker
echo "Cleaning OTP logs..."
cd ../uniz-auth
npx ts-node scripts/clean_otp.ts

# Run Test
echo "Running E2E Test..."
cd ..
BASE_URL="http://localhost:80/api/v1" node scripts/comprehensive_test.js

echo "Test Complete."
