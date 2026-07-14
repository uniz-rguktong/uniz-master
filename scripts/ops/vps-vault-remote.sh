#!/usr/bin/env bash
# Run on the VPS only — list/show production secrets with masking and audit logging.
set -euo pipefail

VAULT_FILE="${UNIZ_VAULT_FILE:-/root/uniz-secrets.env}"
AUDIT_LOG="${UNIZ_VAULT_AUDIT_LOG:-/var/log/uniz-vault-access.log}"

REQUIRED_KEYS=(
  JWT_SECURITY_KEY
  INTERNAL_SECRET
  AUTH_DATABASE_URL
  USER_DATABASE_URL
  ACADEMICS_DATABASE_URL
  AWS_ACCESS_KEY_ID
  AWS_SECRET_ACCESS_KEY
  SES_FROM_EMAIL
)

usage() {
  cat <<'EOF'
Usage: vps-vault-remote.sh <command> [args]

Commands:
  status          Vault file permissions and metadata (no values)
  list            Secret key names only
  show <KEY>      Masked value (safe for screen sharing)
  reveal <KEY>    Full value — logged to audit file
  audit           Check required keys exist
EOF
}

log_access() {
  local action="$1"
  local key="${2:-}"
  mkdir -p "$(dirname "$AUDIT_LOG")"
  printf '%s user=%s pid=%s action=%s key=%s\n' \
    "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
    "${USER:-unknown}" \
    "$$" \
    "$action" \
    "$key" >>"$AUDIT_LOG"
  chmod 600 "$AUDIT_LOG" 2>/dev/null || true
}

require_vault() {
  if [ ! -f "$VAULT_FILE" ]; then
    echo "[vault] Missing $VAULT_FILE" >&2
    exit 1
  fi
  local mode owner
  mode=$(stat -c '%a' "$VAULT_FILE" 2>/dev/null || stat -f '%OLp' "$VAULT_FILE")
  owner=$(stat -c '%U' "$VAULT_FILE" 2>/dev/null || stat -f '%Su' "$VAULT_FILE")
  if [ "$mode" != "600" ] && [ "$mode" != "400" ]; then
    echo "[vault] WARN: $VAULT_FILE mode is $mode (expected 600)" >&2
  fi
  if [ "$(id -u)" -eq 0 ] && [ "$owner" != "root" ]; then
    echo "[vault] WARN: $VAULT_FILE owned by $owner" >&2
  fi
}

read_key() {
  local key="$1"
  python3 - "$VAULT_FILE" "$key" <<'PY'
import re, sys
path, key = sys.argv[1], sys.argv[2]
with open(path, encoding="utf-8", errors="replace") as f:
    for line in f:
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        m = re.match(r"([A-Za-z_][A-Za-z0-9_]*)=(.*)$", line)
        if not m or m.group(1) != key:
            continue
        val = m.group(2)
        if len(val) >= 2 and val[0] == val[-1] and val[0] in "\"'":
            val = val[1:-1]
        print(val, end="")
        sys.exit(0)
sys.exit(2)
PY
}

mask_value() {
  local v="$1"
  local len=${#v}
  if [ -z "$v" ]; then
    echo "(empty)"
    return
  fi
  if [ "$len" -le 8 ]; then
    echo "**** (${len} chars)"
    return
  fi
  echo "${v:0:4}...${v: -4} (${len} chars)"
}

cmd_status() {
  require_vault
  local lines mtime
  lines=$(grep -cE '^[A-Za-z_][A-Za-z0-9_]*=' "$VAULT_FILE" || echo 0)
  mtime=$(stat -c '%y' "$VAULT_FILE" 2>/dev/null || stat -f '%Sm' "$VAULT_FILE")
  echo "file=$VAULT_FILE"
  echo "keys=$lines"
  echo "modified=$mtime"
  stat -c 'mode=%a owner=%U' "$VAULT_FILE" 2>/dev/null || stat -f 'mode=%OLp owner=%Su' "$VAULT_FILE"
  if [ -f "$AUDIT_LOG" ]; then
    echo "audit_log=$AUDIT_LOG"
    echo "last_access=$(tail -n 1 "$AUDIT_LOG" 2>/dev/null || true)"
  fi
}

cmd_list() {
  require_vault
  log_access list
  grep -E '^[A-Za-z_][A-Za-z0-9_]*=' "$VAULT_FILE" | cut -d= -f1 | sort
}

cmd_show() {
  local key="${1:?KEY required}"
  require_vault
  log_access show "$key"
  local val
  val=$(read_key "$key") || {
    echo "[vault] Key not found: $key" >&2
    exit 1
  }
  mask_value "$val"
}

cmd_reveal() {
  local key="${1:?KEY required}"
  if [ "${UNIZ_VAULT_CONFIRM:-}" != "1" ]; then
    echo "[vault] Set UNIZ_VAULT_CONFIRM=1 to reveal full secret values." >&2
    exit 1
  fi
  require_vault
  log_access reveal "$key"
  read_key "$key" || {
    echo "[vault] Key not found: $key" >&2
    exit 1
  }
}

cmd_audit() {
  require_vault
  log_access audit
  local missing=0
  for key in "${REQUIRED_KEYS[@]}"; do
    if ! grep -qE "^${key}=" "$VAULT_FILE"; then
      echo "MISSING $key"
      ((missing++)) || true
    fi
  done
  if [ "$missing" -eq 0 ]; then
    echo "OK: all required keys present"
  else
    echo "WARN: $missing required key(s) missing"
    exit 1
  fi
}

case "${1:-}" in
  status) cmd_status ;;
  list) cmd_list ;;
  show) shift; cmd_show "${1:-}" ;;
  reveal) shift; cmd_reveal "${1:-}" ;;
  audit) cmd_audit ;;
  -h|--help|help|"") usage ;;
  *) echo "[vault] Unknown command: $1" >&2; usage; exit 1 ;;
esac
