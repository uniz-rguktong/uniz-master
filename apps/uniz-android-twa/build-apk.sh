#!/usr/bin/env bash
# Rebuild the release APK with the saved keystore and copy it to the portal
# public download URL (same pattern as abcchess scripts/build-android-apk.sh).
#
# Prerequisites:
#   - apps/uniz-android-twa/android/ already initialized (npm run android:twa:init)
#   - keystore at the path in twa-manifest.json signingKey (never commit *.keystore)
#   - Bubblewrap CLI: npm install -g @bubblewrap/cli
#   - JDK 17+ and Android SDK
#
# Usage (from repo root):
#   npm run android:apk
#   # or: bash apps/uniz-android-twa/build-apk.sh
set -euo pipefail

ROOT="$(CDPATH= cd -- "$(dirname "$0")/../.." && pwd)"
TWA_DIR="$ROOT/apps/uniz-android-twa"
OUT_DIR="$ROOT/apps/uniz-portal/public/download"
OUT_APK="$OUT_DIR/uniz.apk"

cd "$TWA_DIR"

if [[ ! -d android ]]; then
  echo "error: android/ missing. Run: npm run android:twa:init" >&2
  exit 1
fi

if ! command -v bubblewrap >/dev/null 2>&1; then
  echo "error: bubblewrap not found. Install: npm install -g @bubblewrap/cli" >&2
  exit 1
fi

# Optional: load passwords from keystore.properties (gitignored) if present.
# Bubblewrap also accepts BUBBLEWRAP_KEYSTORE_PASSWORD / BUBBLEWRAP_KEY_PASSWORD.
if [[ -f android/keystore.properties ]]; then
  # shellcheck disable=SC1091
  set -a
  # shellcheck disable=SC1091
  . ./android/keystore.properties
  set +a
  if [[ -n "${storePassword:-}" ]]; then
    export BUBBLEWRAP_KEYSTORE_PASSWORD="$storePassword"
  fi
  if [[ -n "${keyPassword:-}" ]]; then
    export BUBBLEWRAP_KEY_PASSWORD="$keyPassword"
  fi
fi

echo "Building TWA release with Bubblewrap…"
bubblewrap build

SIGNED=""
for candidate in \
  "app-release-signed.apk" \
  "android/app/build/outputs/apk/release/app-release-signed.apk" \
  "android/app/build/outputs/apk/release/app-release.apk"
do
  if [[ -f "$candidate" ]]; then
    SIGNED="$candidate"
    break
  fi
done

if [[ -z "$SIGNED" ]]; then
  echo "error: signed APK not found after bubblewrap build" >&2
  find android -name '*.apk' 2>/dev/null | head -20 >&2 || true
  exit 1
fi

mkdir -p "$OUT_DIR"
cp -f "$SIGNED" "$OUT_APK"
echo "Wrote $OUT_APK"
echo "Serve path: https://uniz.rguktong.in/download/uniz.apk"
echo "Commit the APK when ready so Cloudflare Pages ships the download."
