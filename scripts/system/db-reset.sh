#!/bin/bash

# Database Connection Base
DB_BASE="postgresql://neondb_owner:npg_5ulZqX3YDptG@ep-frosty-mud-ahwpoi10-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require"

push_schema() {
  SERVICE_PATH=$1
  SCHEMA=$2
  echo "------------------------------------------------"
  echo " Pushing schema for $SERVICE_PATH to schema: $SCHEMA"
  echo "------------------------------------------------"
  
  if [ -d "$SERVICE_PATH" ]; then
    cd "$SERVICE_PATH" || exit
    export DATABASE_URL="$DB_BASE&schema=$SCHEMA"
    echo "Using DATABASE_URL: $DATABASE_URL"
    
    if [ -f "./node_modules/.bin/prisma" ]; then
      ./node_modules/.bin/prisma db push --accept-data-loss
    else
      npx prisma db push --accept-data-loss
    fi
    cd - > /dev/null
  else
    echo " Directory $SERVICE_PATH not found"
  fi
}

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT_DIR="$( cd "$SCRIPT_DIR/../.." && pwd )"

push_schema "$ROOT_DIR/apps/uniz-auth" "auth"
push_schema "$ROOT_DIR/apps/uniz-user" "users"
push_schema "$ROOT_DIR/apps/uniz-academics" "academics"
push_schema "$ROOT_DIR/apps/uniz-outpass" "outpass"
push_schema "$ROOT_DIR/apps/uniz-files" "academics"
push_schema "$ROOT_DIR/apps/uniz-cron" "outpass"

echo " All database schemas updated successfully."
