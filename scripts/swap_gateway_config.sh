#!/bin/bash

# Script to swap gateway vercel.json between local and prod configurations

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"
GATEWAY_DIR="$ROOT_DIR/apps/uniz-gateway"

MODE="${1:-local}"

if [ "$MODE" = "local" ]; then
  echo "🔧 Switching gateway to LOCAL mode..."
  if [ -f "$GATEWAY_DIR/vercel.local.json" ]; then
    cp "$GATEWAY_DIR/vercel.local.json" "$GATEWAY_DIR/vercel.json"
    echo "✅ Gateway configured for localhost (ports 3001-3008)"
  else
    echo "⚠️  vercel.local.json not found, skipping swap."
  fi
elif [ "$MODE" = "prod" ]; then
  echo "🚀 Switching gateway to PRODUCTION mode..."
  cp "$GATEWAY_DIR/vercel.prod.json" "$GATEWAY_DIR/vercel.json"
  echo "✅ Gateway configured for production Vercel URLs"
else
  echo "❌ Invalid mode. Use: $0 [local|prod]"
  exit 1
fi
