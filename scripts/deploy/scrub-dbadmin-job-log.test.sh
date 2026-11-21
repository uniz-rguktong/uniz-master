#!/usr/bin/env bash
# A fake role-job log must not keep a long token or a password', 'value' argument.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
# shellcheck source=scrub-dbadmin-job-log.sh
source "$ROOT/scripts/deploy/scrub-dbadmin-job-log.sh"

HEX="$(python3 -c 'print("ab" * 32)')"
B64="$(python3 -c 'print("Abc+" * 10)')"
SHORT="abc-secret-value"

log="$(printf '%s\n' \
  " $HEX" \
  "SELECT set_config('uniz.dbadmin_password', '${HEX}', false);" \
  "password', '${SHORT}'" \
  "PASSWORD '${SHORT}'" \
  "DBADMIN_DB_PASSWORD=${SHORT}" \
  "$B64")"

out="$(printf '%s\n' "$log" | scrub_dbadmin_job_log)"

for secret in "$HEX" "$B64" "$SHORT"; do
  if printf '%s' "$out" | grep -F -q -- "$secret"; then
    echo "leak test failed" >&2
    exit 1
  fi
done

if printf '%s\n' "$out" | grep -E -q '[0-9a-fA-F]{32,}'; then
  echo "leak test failed: hex token remains" >&2
  exit 1
fi

if printf '%s\n' "$out" | grep -E -q '[A-Za-z0-9+/=_-]{32,}'; then
  echo "leak test failed: long token remains" >&2
  exit 1
fi

printf '%s\n' "$out"
echo "scrub-dbadmin-job-log: no leak"
