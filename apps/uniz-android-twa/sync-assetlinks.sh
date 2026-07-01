#!/usr/bin/env bash
set -euo pipefail

TWA_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$TWA_DIR/../.." && pwd)"
ASSETLINKS="$ROOT/apps/uniz-portal/public/.well-known/assetlinks.json"
PACKAGE="in.rguktong.uniz"

find_keystore() {
  find "$TWA_DIR" -maxdepth 2 \( -name '*.jks' -o -name '*.keystore' \) 2>/dev/null | head -1
}

KEYSTORE="${ANDROID_KEYSTORE_PATH:-$(find_keystore)}"
ALIAS="${ANDROID_KEY_ALIAS:-android}"

if [[ -z "$KEYSTORE" || ! -f "$KEYSTORE" ]]; then
  echo "No keystore found. Run init.sh first or set ANDROID_KEYSTORE_PATH."
  echo "Example:"
  echo "  ANDROID_KEYSTORE_PATH=./upload.jks ANDROID_KEYSTORE_PASSWORD=*** ANDROID_KEY_ALIAS=android bash sync-assetlinks.sh"
  exit 1
fi

if [[ -z "${ANDROID_KEYSTORE_PASSWORD:-}" ]]; then
  read -rsp "Keystore password: " ANDROID_KEYSTORE_PASSWORD
  echo
fi

SHA256="$(
  keytool -list -v \
    -keystore "$KEYSTORE" \
    -alias "$ALIAS" \
    -storepass "$ANDROID_KEYSTORE_PASSWORD" 2>/dev/null \
    | awk -F: '/SHA256:/ { gsub(/ /, "", $2); print $2; exit }'
)"

if [[ -z "$SHA256" ]]; then
  echo "Could not read SHA256. Check alias ($ALIAS) and password."
  exit 1
fi

# Merge fingerprint into assetlinks (replace placeholder or append)
node <<NODE
const fs = require('fs');
const path = '$ASSETLINKS';
const sha = '$SHA256';
const pkg = '$PACKAGE';
let data = JSON.parse(fs.readFileSync(path, 'utf8'));
const entry = data.find((e) => e.target?.package_name === pkg);
if (!entry) throw new Error('package entry missing in assetlinks.json');
const fps = new Set(entry.target.sha256_cert_fingerprints.filter((f) => !f.startsWith('REPLACE_')));
fps.add(sha);
entry.target.sha256_cert_fingerprints = [...fps];
fs.writeFileSync(path, JSON.stringify(data, null, 2) + '\n');
console.log('Updated assetlinks.json with SHA256:', sha);
NODE

echo "Redeploy the portal so https://uniz.rguktong.in/.well-known/assetlinks.json is updated."
