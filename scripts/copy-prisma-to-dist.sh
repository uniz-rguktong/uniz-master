#!/usr/bin/env bash
# Prisma generates under src/generated; compiled JS in dist/ imports ../generated/prisma.
set -euo pipefail
if [ -d src/generated ]; then
  mkdir -p dist
  rm -rf dist/generated
  cp -r src/generated dist/generated
  echo "[build] Copied Prisma client to dist/generated"
fi
