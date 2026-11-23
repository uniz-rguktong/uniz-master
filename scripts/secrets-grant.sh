#!/usr/bin/env bash
# Admin: add an age public key as a SOPS recipient on the VPS and re-encrypt in place.
# Usage: scripts/secrets-grant.sh age1...
# Must be able to ssh as uniz-vps and decrypt with an existing recipient key.
set -euo pipefail

PUB="${1:-}"
if [[ ! "$PUB" =~ ^age1[a-z0-9]+$ ]]; then
  echo "Usage: $0 age1..." >&2
  exit 1
fi

SSH=(ssh -o BatchMode=yes uniz-vps)
SOPS_FILE="${UNIZ_SOPS_REMOTE:-/root/uniz-secrets.env.sops}"
RECIPIENTS_FILE="${UNIZ_RECIPIENTS_REMOTE:-/root/age/sops-age-recipients.txt}"

"${SSH[@]}" "set -euo pipefail
  test -f '$SOPS_FILE'
  test -f /root/age/uniz-vault.key
  grep -qxF '$PUB' '$RECIPIENTS_FILE' 2>/dev/null || echo '$PUB' >> '$RECIPIENTS_FILE'
  chmod 600 '$RECIPIENTS_FILE'
  recips=\$(grep -E '^age1' '$RECIPIENTS_FILE' | paste -sd, -)
  export SOPS_AGE_KEY_FILE=/root/age/uniz-vault.key
  tmp=\$(mktemp)
  chmod 600 \"\$tmp\"
  # Rotate recipients without printing plaintext: sops updatekeys after editing metadata.
  # Fallback: decrypt to temp, re-encrypt to sops file, shred temp.
  sops --input-type dotenv --output-type dotenv -d '$SOPS_FILE' > \"\$tmp\"
  # shellcheck disable=SC2086
  sops --age \"\$recips\" --input-type dotenv --output-type dotenv -e \"\$tmp\" > '${SOPS_FILE}.new'
  chmod 600 '${SOPS_FILE}.new'
  mv '${SOPS_FILE}.new' '$SOPS_FILE'
  shred -u \"\$tmp\"
  echo 'Granted. Recipients:'
  grep -E '^age1' '$RECIPIENTS_FILE' | wc -l
"
echo "Ask the newcomer to run: scripts/secrets-pull.sh"
