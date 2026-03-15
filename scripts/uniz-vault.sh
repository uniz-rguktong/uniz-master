#!/bin/bash

# --- UniZ Stealth Vault & Secret Manager ---
# This tool centralizes secret handling for both Local and VPS environments.

MASTER_FILE="secrets.env"
EXAMPLE_FILE="secrets.env.example"
VPS_IP="76.13.241.174"

# List of critical keys that MUST exist for a healthy system
REQUIRED_KEYS=(
  "JWT_SECURITY_KEY"
  "INTERNAL_SECRET"
  "AUTH_DATABASE_URL"
  "USER_DATABASE_URL"
  "ACADEMICS_DATABASE_URL"
  "AWS_ACCESS_KEY_ID"
  "AWS_SECRET_ACCESS_KEY"
  "SES_FROM_EMAIL"
  "LANDING_POSTGRES_USER"
  "LANDING_POSTGRES_PASSWORD"
)

usage() {
  echo "Usage: ./scripts/uniz-vault.sh [command]"
  echo ""
  echo "Commands:"
  echo "  audit         Check for missing or empty secrets in master vault"
  echo "  sync          Propagate master secrets to all microservices (.env files)"
  echo "  get <KEY>     Get a secret value from master vault"
  echo "  set <KEY=VAL> Set or update a secret in master vault"
  echo "  vps-audit     Check if VPS master vault matches local required keys"
  echo ""
}

log_info() { echo -e "[\033[0;34mINFO\033[0m] $1"; }
log_warn() { echo -e "[\033[0;33mWARN\033[0m] $1"; }
log_error() { echo -e "[\033[0;31mERROR\033[0m] $1"; }

audit() {
  log_info "Auditing Master Vault ($MASTER_FILE)..."
  if [ ! -f "$MASTER_FILE" ]; then
    log_error "Master vault file not found!"
    exit 1
  fi

  MISSING=0
  for key in "${REQUIRED_KEYS[@]}"; do
    val=$(grep "^${key}=" "$MASTER_FILE" | cut -d'=' -f2-)
    if [ -z "$val" ]; then
      log_warn "Missing or empty: $key"
      ((MISSING++))
    fi
  done

  if [ $MISSING -eq 0 ]; then
    log_info "✅ All critical secrets present."
  else
    log_warn "⚠️ Found $MISSING potential issues in vault."
  fi
}

sync_local() {
  log_info "Syncing secrets to all microservices..."
  # Re-use setup-local.sh logic or call it
  ./scripts/setup-local.sh
}

vps_audit() {
  log_info "Auditing VPS Vault (SSH: root@$VPS_IP)..."
  ssh -o ConnectTimeout=5 root@$VPS_IP "if [ -f /root/uniz-secrets.env ]; then echo 'FOUND'; else echo 'NOT_FOUND'; fi" | grep -q "FOUND" || {
    log_error "VPS vault /root/uniz-secrets.env NOT found on master host!"
    exit 1
  }
  
  log_info "Checking VPS keys..."
  # Run a remote check for the same required keys
  for key in "${REQUIRED_KEYS[@]}"; do
    ssh root@$VPS_IP "grep -q '^${key}=' /root/uniz-secrets.env" || log_warn "VPS Missing: $key"
  done
  log_info "✅ VPS Audit complete."
}

case "$1" in
  audit) audit ;;
  sync) sync_local ;;
  get) 
    grep "^$2=" "$MASTER_FILE" | cut -d'=' -f2-
    ;;
  set)
    key_val="$2"
    key="${key_val%%=*}"
    # Escaping for sed
    val="${key_val#*=}"
    if grep -q "^${key}=" "$MASTER_FILE"; then
      sed -i '' "s|^${key}=.*|${key}=${val}|" "$MASTER_FILE"
    else
      echo "${key}=${val}" >> "$MASTER_FILE"
    fi
    log_info "Updated $key"
    ;;
  vps-audit) vps_audit ;;
  *) usage ;;
esac
