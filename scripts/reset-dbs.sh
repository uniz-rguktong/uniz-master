#!/bin/bash

# Database Connection Base
DB_BASE="postgresql://neondb_owner:npg_5ulZqX3YDptG@ep-frosty-mud-ahwpoi10-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require"

push_schema() {
  SERVICE=$1
  SCHEMA=$2
  echo "------------------------------------------------"
  echo "🚀 Pushing schema for $SERVICE to schema: $SCHEMA"
  echo "------------------------------------------------"
  
  cd $SERVICE || exit
  
  export DATABASE_URL="$DB_BASE&schema=$SCHEMA"
  echo "Using DATABASE_URL: $DATABASE_URL"
  
  if [ -f "./node_modules/.bin/prisma" ]; then
    ./node_modules/.bin/prisma db push --accept-data-loss
  else
    npx prisma db push --accept-data-loss
  fi
  
  cd ..
}

push_schema "uniz-auth-service" "auth"
push_schema "uniz-user-service" "users"
push_schema "uniz-academics-service" "academics"
push_schema "uniz-outpass-service" "outpass"

echo "✅ All database schemas updated successfully."
