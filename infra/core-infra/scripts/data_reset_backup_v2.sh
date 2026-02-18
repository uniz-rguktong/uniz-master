#!/bin/bash

# Load .env variables
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

echo "--- 🔄 Resetting Local Databases ---"

# Function to reset a service's DB
reset_db_and_seed() {
  SERVICE_NAME=$1       # e.g., "Auth"
  DIR_NAME=$2           # e.g., "uniz-auth-service"
  CONTAINER_NAME=$3     # e.g., "uniz-auth-service"
  DB_URL_VAR=$4         # e.g., "AUTH_DATABASE_URL"
  SCHEMA_REL_PATH="../$DIR_NAME/prisma/schema.prisma"
  
  # Get the value of the variable name passed in DB_URL_VAR
  RAW_DB_URL="${!DB_URL_VAR}"
  
  if [ -z "$RAW_DB_URL" ]; then
    echo "  Skipping $SERVICE_NAME: $DB_URL_VAR is not set."
    return
  fi

  # MODE 1: Monorepo Development (Source code exists locally)
  if [ -d "../$DIR_NAME" ] && [ -f "$SCHEMA_REL_PATH" ]; then
    # Replace 'uniz-postgres' with 'localhost' so the host machine can connect
    DB_URL="${RAW_DB_URL/uniz-postgres/localhost}"
    
    echo "🗑  Resetting $SERVICE_NAME (Local Source)..."
    FORCE_COLOR=1 DATABASE_URL="$DB_URL" npx prisma db push --schema="$SCHEMA_REL_PATH" --force-reset --accept-data-loss > /dev/null 2>&1
    
    # Seeding
    if [ -f "../$DIR_NAME/prisma/seed.ts" ]; then
      echo "🌱 Seeding $SERVICE_NAME..."
      (cd "../$DIR_NAME" && DATABASE_URL="$DB_URL" npx ts-node prisma/seed.ts > /dev/null 2>&1)
    fi

  # MODE 2: Standalone/VPS Deployment (Source code missing, rely on Docker)
  else
    # Check if container is running
    if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
      echo "🗑  Resetting $SERVICE_NAME (Docker Container)..."
      # DB_URL inside container is already correct (uniz-postgres), executed inside
      docker exec -e FORCE_COLOR=1 "$CONTAINER_NAME" npx prisma db push --schema=prisma/schema.prisma --force-reset --accept-data-loss > /dev/null 2>&1
      
      # Seeding
      # Check if seed file exists inside container before running
      if docker exec "$CONTAINER_NAME" test -f prisma/seed.ts; then
        echo "🌱 Seeding $SERVICE_NAME..."
        docker exec -e FORCE_COLOR=1 "$CONTAINER_NAME" npx ts-node prisma/seed.ts > /dev/null 2>&1
      fi
    else
      echo "  Skipping $SERVICE_NAME: Source code not found locally AND container '$CONTAINER_NAME' is not running."
      echo "   To fix: Run 'npm run docker:up' or 'npm run deploy:vps' to start containers first."
    fi
  fi
}

# Reset each service
reset_db_and_seed "Auth" "uniz-auth-service" "uniz-auth-service" "AUTH_DATABASE_URL"
reset_db_and_seed "User" "uniz-user" "uniz-user-service" "USER_DATABASE_URL"
reset_db_and_seed "Outpass" "uniz-outpass" "uniz-outpass-service" "OUTPASS_DATABASE_URL"
reset_db_and_seed "Academics" "uniz-academics" "uniz-academics-service" "ACADEMICS_DATABASE_URL"
reset_db_and_seed "Files" "uniz-files" "uniz-files-service" "FILES_DATABASE_URL"
reset_db_and_seed "Cron" "uniz-cron" "uniz-cron-service" "CRON_DATABASE_URL"
reset_db_and_seed "Mail" "uniz-mail" "uniz-mail-service" "MAIL_DATABASE_URL"
reset_db_and_seed "Notifications" "uniz-notifications" "uniz-notification-service" "NOTIFICATION_DATABASE_URL"

echo " Database schema reset & seed operations complete."
