#!/usr/bin/env bash
# Pull the ENCRYPTED vault from the VPS (ssh uniz-vps) and decrypt locally.
# No plaintext leaves the VPS. Requires your age private key (see secrets-onboard.sh).
#
# Usage:
#   scripts/secrets-pull.sh                 # DEV vault (default) → ./secrets.env (mode 600)
#   scripts/secrets-pull.sh --env dev       # same as the default
#   scripts/secrets-pull.sh --env prod      # production vault
#   scripts/secrets-pull.sh --names         # print key names only
#   scripts/secrets-pull.sh --stdout        # decrypt to stdout (your terminal)
#   scripts/secrets-pull.sh -o PATH
set -euo pipefail

KEY_FILE="${UNIZ_AGE_KEY:-$HOME/.config/uniz/age.key}"
PROD_REMOTE="${UNIZ_SOPS_REMOTE:-/root/uniz-secrets.env.sops}"
DEV_REMOTE="${UNIZ_SOPS_DEV_REMOTE:-/root/uniz-secrets.dev.env.sops}"
ENV="dev"
OUT="secrets.env"
NAMES=0
STDOUT=0

while [ $# -gt 0 ]; do
  case "$1" in
    --env)
      ENV="${2:?}"
      case "$ENV" in
        dev|prod) ;;
        *) echo "Usage: $0 --env dev|prod" >&2; exit 1 ;;
      esac
      shift
      ;;
    --names|-n) NAMES=1 ;;
    --stdout) STDOUT=1 ;;
    -o|--out) OUT="${2:?}"; shift ;;
    -h|--help) sed -n '2,15p' "$0"; exit 0 ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
  shift
done

if [ "$ENV" = "prod" ]; then
  REMOTE_SOPS="$PROD_REMOTE"
else
  REMOTE_SOPS="$DEV_REMOTE"
fi

command -v sops >/dev/null || { echo "Install sops (https://github.com/getsops/sops/releases)" >&2; exit 1; }
command -v age >/dev/null || { echo "Install age (brew install age / apt-get install age)" >&2; exit 1; }
[ -f "$KEY_FILE" ] || { echo "Missing age key: $KEY_FILE (run scripts/secrets-onboard.sh)" >&2; exit 1; }

tmp=$(mktemp)
trap 'shred -u "$tmp" 2>/dev/null || rm -f "$tmp"' EXIT
# Encrypted file only
scp -o BatchMode=yes "uniz-vps:$REMOTE_SOPS" "$tmp"
chmod 600 "$tmp"

export SOPS_AGE_KEY_FILE="$KEY_FILE"
if [ "$NAMES" -eq 1 ]; then
  sops --input-type dotenv --output-type dotenv -d "$tmp" | awk -F= '/^[A-Za-z_][A-Za-z0-9_]*=/{print $1}'
  exit 0
fi
if [ "$STDOUT" -eq 1 ]; then
  sops --input-type dotenv --output-type dotenv -d "$tmp"
  exit 0
fi
umask 077
sops --input-type dotenv --output-type dotenv -d "$tmp" > "$OUT"
chmod 600 "$OUT"
echo "Wrote $OUT from the $ENV vault (mode 600). Do not commit this file."
