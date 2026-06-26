#!/usr/bin/env bash
# Sync canonical Mintlify docs (apps/uniz-docs) into the gateway static mirror.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/apps/uniz-docs"
DST="$ROOT/apps/uniz-gateway/public/docs-content"

rsync -a --delete \
  --exclude Dockerfile \
  --exclude package.json \
  --exclude help.txt \
  --exclude node_modules \
  --exclude .git \
  "$SRC/" "$DST/"

echo "[sync-docs] $SRC -> $DST"
