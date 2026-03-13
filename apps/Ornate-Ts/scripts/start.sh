#!/bin/sh

# Run migrations
echo "Running prisma migrate deploy..."
npx prisma migrate deploy

# Start the application
echo "Starting application..."
node server.js
