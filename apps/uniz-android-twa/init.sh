#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
TWA_DIR="$(cd "$(dirname "$0")" && pwd)"

cd "$TWA_DIR"

if ! command -v bubblewrap >/dev/null 2>&1; then
  echo "Installing @bubblewrap/cli globally..."
  npm install -g @bubblewrap/cli
fi

if [[ -d android ]]; then
  echo "android/ already exists. Run 'bubblewrap update' or remove android/ to re-init."
  exit 1
fi

echo "Initializing TWA from twa-manifest.json..."
bubblewrap init --manifest="$TWA_DIR/twa-manifest.json"

echo ""
echo "Done. Next steps:"
echo "  1. bash apps/uniz-android-twa/sync-assetlinks.sh"
echo "  2. Deploy portal (assetlinks.json must be live)"
echo "  3. bash apps/uniz-android-twa/verify-assetlinks.sh"
echo "  4. cd apps/uniz-android-twa && bubblewrap build"
