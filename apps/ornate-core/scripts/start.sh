#!/bin/sh
set -e

echo "[$(date)] Running prisma migrate deploy..."
npx prisma migrate deploy

echo "[$(date)] Starting application..."
exec node server.js
