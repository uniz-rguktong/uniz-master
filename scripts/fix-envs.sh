#!/bin/bash

# Function to clean and update env
update_env() {
  SERVICE=$1
  KEY=$2
  VALUE=$3
  echo "Updating $SERVICE: $KEY..."
  cd $SERVICE
  echo "y" | vercel env rm $KEY production > /dev/null 2>&1
  printf "$VALUE" | vercel env add $KEY production
  cd ..
}

DB_BASE="postgresql://neondb_owner:npg_5ulZqX3YDptG@ep-frosty-mud-ahwpoi10-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require"
JWT_KEY="uniz_vault_secure_2026_key"
REDIS="rediss://default:AUjnAAIncDE0MTgwNzM4NjdjYzk0Nzg3YTg2NzIyN2VkMGI1YjRkYnAxMTg2NjM@cheerful-collie-18663.upstash.io:6379"

# Auth Service
update_env "uniz-auth-service" "DATABASE_URL" "${DB_BASE}&schema=auth"
update_env "uniz-auth-service" "JWT_SECURITY_KEY" "$JWT_KEY"
update_env "uniz-auth-service" "REDIS_URL" "$REDIS"

# User Service
update_env "uniz-user-service" "DATABASE_URL" "${DB_BASE}&schema=users"
update_env "uniz-user-service" "JWT_SECURITY_KEY" "$JWT_KEY"

# Academics Service
update_env "uniz-academics-service" "DATABASE_URL" "${DB_BASE}&schema=academics"
update_env "uniz-academics-service" "JWT_SECURITY_KEY" "$JWT_KEY"

# Outpass Service
update_env "uniz-outpass-service" "DATABASE_URL" "${DB_BASE}&schema=outpass"
update_env "uniz-outpass-service" "JWT_SECURITY_KEY" "$JWT_KEY"

echo "✅ All Environment Variables Updated"
