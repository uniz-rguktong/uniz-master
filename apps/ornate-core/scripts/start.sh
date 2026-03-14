#!/bin/sh
set -e

echo "[$(date)] Syncing database schema..."
prisma db push --accept-data-loss --skip-generate

echo "[$(date)] Starting application..."
exec node server.js
