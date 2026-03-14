#!/bin/sh
set -e

echo "[$(date)] Syncing database schema..."
npx prisma@6.19.2 db push --accept-data-loss

echo "[$(date)] Starting application..."
exec node server.js
