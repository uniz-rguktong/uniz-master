#!/usr/bin/env bash
# Rebuild the release APK with the saved keystore and copy it to the portal
# public download URL (same pattern as abcchess scripts/build-android-apk.sh).
#
# Usage (from repo root):
#   npm run android:apk
#   # or: bash apps/uniz-android-twa/build-apk.sh
set -euo pipefail

ROOT="$(CDPATH= cd -- "$(dirname "$0")/../.." && pwd)"
TWA_DIR="$ROOT/apps/uniz-android-twa"
WORK="$TWA_DIR/android"
OUT_DIR="$ROOT/apps/uniz-portal/public/download"
OUT_APK="$OUT_DIR/uniz.apk"
LANDING_OUT_DIR="$ROOT/apps/uniz-landing/public/download"
LANDING_OUT_APK="$LANDING_OUT_DIR/uniz.apk"

if [[ ! -d "$WORK" ]]; then
  echo "error: android/ missing. Run: npm run android:twa:init" >&2
  exit 1
fi

if ! command -v bubblewrap >/dev/null 2>&1; then
  echo "error: bubblewrap not found. Install: npm install -g @bubblewrap/cli" >&2
  exit 1
fi

cd "$WORK"

if [[ -f keystore.properties ]]; then
  # shellcheck disable=SC1091
  set -a
  # shellcheck disable=SC1091
  . ./keystore.properties
  set +a
  if [[ -n "${storePassword:-}" ]]; then
    export BUBBLEWRAP_KEYSTORE_PASSWORD="$storePassword"
  fi
  if [[ -n "${keyPassword:-}" ]]; then
    export BUBBLEWRAP_KEY_PASSWORD="$keyPassword"
  fi
fi

# Keep manifest-checksum.txt in sync so headless builds do not block on prompt
node -e '
const fs = require("fs");
const crypto = require("crypto");
const sum = crypto.createHash("sha1").update(fs.readFileSync("twa-manifest.json")).digest("hex");
fs.writeFileSync("manifest-checksum.txt", sum);
'

echo "Building TWA release with Bubblewrap…"
bubblewrap build --skipPwaValidation "$@"

SIGNED=""
for candidate in \
  "$WORK/app-release-signed.apk" \
  "$WORK/app/build/outputs/apk/release/app-release-signed.apk" \
  "$WORK/app/build/outputs/apk/release/app-release.apk"
do
  if [[ -f "$candidate" ]]; then
    SIGNED="$candidate"
    break
  fi
done

if [[ -z "$SIGNED" ]]; then
  echo "error: signed APK not found after bubblewrap build" >&2
  find "$WORK" -name '*.apk' 2>/dev/null | head -20 >&2 || true
  exit 1
fi

mkdir -p "$OUT_DIR" "$LANDING_OUT_DIR"
cp -f "$SIGNED" "$OUT_APK"
cp -f "$SIGNED" "$LANDING_OUT_APK"
echo "Wrote $OUT_APK"
echo "Wrote $LANDING_OUT_APK"
echo "Serve path: https://uniz.rguktong.in/download/uniz.apk"
