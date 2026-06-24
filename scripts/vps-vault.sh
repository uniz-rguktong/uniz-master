#!/usr/bin/env bash
# Secure VPS secrets access from your machine (SSH + masking + audit on VPS).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# Optional local overrides (never commit secrets.env)
if [ -f "$ROOT/secrets.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/secrets.env"
  set +a
fi

VPS_HOST="${UNIZ_VPS_HOST:-${VPS_IP:-}}"
VPS_USER="${UNIZ_VPS_USER:-root}"
VPS_SSH_KEY="${UNIZ_VPS_SSH_KEY:-}"
REMOTE_VAULT_SCRIPT="/root/uniz-master-main/scripts/vps-vault-remote.sh"
LOCAL_REMOTE_SCRIPT="$ROOT/scripts/vps-vault-remote.sh"

usage() {
  cat <<EOF
Usage: ./scripts/vps-vault.sh <command> [args]

Configure (in secrets.env on your laptop, never commit):
  UNIZ_VPS_HOST=76.13.241.174
  UNIZ_VPS_USER=root
  UNIZ_VPS_SSH_KEY=\$HOME/.ssh/your_deploy_key

Commands:
  status              Vault metadata on VPS (no secret values)
  list                Key names only
  show <KEY>          Masked value via SSH
  reveal <KEY>        Full value (prompts + VPS audit log)
  audit               Required keys on VPS
  pull-backup         Download vault to ./secrets.env.vps.backup (chmod 600)

Security:
  - Requires your VPS SSH private key (same as GitHub Actions deploy key holder)
  - reveal is logged on VPS at /var/log/uniz-vault-access.log
  - Never commit secrets.env or backup files
EOF
}

ssh_opts=(-o BatchMode=yes -o ConnectTimeout=12 -o StrictHostKeyChecking=accept-new)
if [ -n "$VPS_SSH_KEY" ]; then
  ssh_opts+=(-i "$VPS_SSH_KEY")
fi

require_host() {
  if [ -z "$VPS_HOST" ]; then
    echo "[vps-vault] Set UNIZ_VPS_HOST or VPS_IP in secrets.env" >&2
    exit 1
  fi
}

run_remote() {
  require_host
  if ssh "${ssh_opts[@]}" "${VPS_USER}@${VPS_HOST}" "test -f '$REMOTE_VAULT_SCRIPT'"; then
    ssh "${ssh_opts[@]}" "${VPS_USER}@${VPS_HOST}" bash "$REMOTE_VAULT_SCRIPT" "$@"
    return
  fi
  ssh "${ssh_opts[@]}" "${VPS_USER}@${VPS_HOST}" bash -s -- "$@" <"$LOCAL_REMOTE_SCRIPT"
}

run_remote_confirm() {
  require_host
  if ssh "${ssh_opts[@]}" "${VPS_USER}@${VPS_HOST}" "test -f '$REMOTE_VAULT_SCRIPT'"; then
    ssh "${ssh_opts[@]}" "${VPS_USER}@${VPS_HOST}" env UNIZ_VAULT_CONFIRM=1 bash "$REMOTE_VAULT_SCRIPT" "$@"
    return
  fi
  ssh "${ssh_opts[@]}" "${VPS_USER}@${VPS_HOST}" env UNIZ_VAULT_CONFIRM=1 bash -s -- "$@" <"$LOCAL_REMOTE_SCRIPT"
}

cmd_reveal() {
  local key="${1:?KEY required}"
  echo "This will log access on the VPS and print the full secret to your terminal."
  read -r -p "Reveal $key? Type yes: " ans
  if [ "$ans" != "yes" ]; then
    echo "Cancelled."
    exit 1
  fi
  UNIZ_VAULT_CONFIRM=1 run_remote_confirm reveal "$key"
}

cmd_pull_backup() {
  require_host
  local out="$ROOT/secrets.env.vps.backup"
  echo "[vps-vault] Downloading /root/uniz-secrets.env -> $out"
  scp "${ssh_opts[@]}" "${VPS_USER}@${VPS_HOST}:/root/uniz-secrets.env" "$out"
  chmod 600 "$out"
  echo "[vps-vault] Saved (mode 600). Add to .gitignore — do not commit."
}

case "${1:-}" in
  status) shift; run_remote status "$@" ;;
  list) shift; run_remote list "$@" ;;
  show) shift; run_remote show "$@" ;;
  reveal) shift; cmd_reveal "$@" ;;
  audit) shift; run_remote audit "$@" ;;
  pull-backup) cmd_pull_backup ;;
  -h|--help|help|"") usage ;;
  *) echo "[vps-vault] Unknown command: $1" >&2; usage; exit 1 ;;
esac
