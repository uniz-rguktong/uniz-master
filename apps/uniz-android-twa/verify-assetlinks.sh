#!/usr/bin/env bash
set -euo pipefail

SITE="${ASSETLINKS_SITE:-https://uniz.rguktong.in}"
PACKAGE="${ANDROID_PACKAGE:-in.rguktong.uniz}"

echo "Checking Digital Asset Links for $SITE (package $PACKAGE)..."
echo ""

URL="https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=${SITE}/&relation=delegate_permission/common.handle_all_urls"

RESPONSE="$(curl -fsSL "$URL")"

if echo "$RESPONSE" | grep -q "$PACKAGE"; then
  echo "OK — Google sees asset link statements for $PACKAGE"
  echo "$RESPONSE" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{const j=JSON.parse(d);console.log(JSON.stringify(j,null,2));});"
else
  echo "NOT VERIFIED — $PACKAGE not linked yet."
  echo "Ensure assetlinks.json is deployed and SHA256 matches your signing key."
  echo "Raw response:"
  echo "$RESPONSE"
  exit 1
fi
