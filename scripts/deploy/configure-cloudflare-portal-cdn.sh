#!/usr/bin/env bash
# Legacy helper: portal/landing no longer originate on the VPS.
# DNS + HTML are served from Cloudflare Pages; this script only ensures
# that FE hostnames stay pointed at Pages (idempotent cutover).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
echo "[cf-cdn] Frontends are on Cloudflare Pages — ensuring DNS cutover (not VPS origin)."
bash "$ROOT/cutover-frontends-to-pages-dns.sh"
echo "[cf-cdn] Done — portal/landing origin is Pages; api-uniz + landing-api remain on VPS."
