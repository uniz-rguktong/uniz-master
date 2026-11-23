#!/usr/bin/env bash
# Admin: add an age public key as a SOPS recipient on the VPS and re-encrypt in place.
# Usage: scripts/secrets-grant.sh age1...
# Must be able to ssh as uniz-vps and decrypt with an existing recipient key.
# Re-encrypts the production vault and, when present, the dev vault so newcomers
# can run scripts/secrets-pull.sh (which defaults to dev).
set -euo pipefail

PUB="${1:-}"
if [[ ! "$PUB" =~ ^age1[a-z0-9]+$ ]]; then
  echo "Usage: $0 age1..." >&2
  exit 1
fi

SSH=(ssh -o BatchMode=yes uniz-vps)
SOPS_FILE="${UNIZ_SOPS_REMOTE:-/root/uniz-secrets.env.sops}"
DEV_SOPS_FILE="${UNIZ_SOPS_DEV_REMOTE:-/root/uniz-secrets.dev.env.sops}"
RECIPIENTS_FILE="${UNIZ_RECIPIENTS_REMOTE:-/root/age/sops-age-recipients.txt}"

"${SSH[@]}" "set -euo pipefail
  test -f '$SOPS_FILE'
  test -f /root/age/uniz-vault.key
  grep -qxF '$PUB' '$RECIPIENTS_FILE' 2>/dev/null || echo '$PUB' >> '$RECIPIENTS_FILE'
  chmod 600 '$RECIPIENTS_FILE'
  recips=\$(grep -E '^age1' '$RECIPIENTS_FILE' | paste -sd, -)
  export SOPS_AGE_KEY_FILE=/root/age/uniz-vault.key
  reencrypt() {
    local src=\"\$1\"
    test -f \"\$src\" || return 0
    tmp=\$(mktemp)
    chmod 600 \"\$tmp\"
    # Rotate recipients without printing plaintext: sops updatekeys after editing metadata.
    # Fallback: decrypt to temp, re-encrypt to sops file, shred temp.
    sops --input-type dotenv --output-type dotenv -d \"\$src\" > \"\$tmp\"
    # shellcheck disable=SC2086
    sops --age \"\$recips\" --input-type dotenv --output-type dotenv -e \"\$tmp\" > \"\${src}.new\"
    chmod 600 \"\${src}.new\"
    mv \"\${src}.new\" \"\$src\"
    shred -u \"\$tmp\"
  }
  reencrypt '$SOPS_FILE'
  reencrypt '$DEV_SOPS_FILE'
  echo 'Granted. Recipients:'
  grep -E '^age1' '$RECIPIENTS_FILE' | wc -l
"
echo "Ask the newcomer to run: scripts/secrets-pull.sh  (defaults to the dev vault)"
