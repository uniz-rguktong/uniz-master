#!/usr/bin/env bash
# Newcomer: install sops+age if needed, generate a local age key, print only the PUBLIC key.
# Run on your laptop. Never commit the private key.
set -euo pipefail

KEY_DIR="${UNIZ_AGE_DIR:-$HOME/.config/uniz}"
KEY_FILE="${UNIZ_AGE_KEY:-$KEY_DIR/age.key}"
PUB_FILE="${KEY_FILE}.pub"

need() { command -v "$1" >/dev/null 2>&1; }

install_hint() {
  echo "Install sops and age, then re-run this script:" >&2
  echo "  macOS:  brew install sops age" >&2
  echo "  Debian: sudo apt-get install -y age" >&2
  echo "          (sops: https://github.com/getsops/sops/releases)" >&2
}

if ! need age || ! need sops; then
  if need brew; then
    brew install sops age
  elif need apt-get && [ "$(id -u)" -eq 0 ]; then
    apt-get update -qq && apt-get install -y age
    echo "Install sops from https://github.com/getsops/sops/releases and re-run." >&2
    need sops || exit 1
  else
    install_hint
    need age && need sops || exit 1
  fi
fi

mkdir -p "$KEY_DIR"
chmod 700 "$KEY_DIR"
if [ ! -f "$KEY_FILE" ]; then
  age-keygen -o "$KEY_FILE"
  chmod 600 "$KEY_FILE"
fi
# Public key only — age-keygen -y prints the recipient, not the private key.
age-keygen -y "$KEY_FILE" | tee "$PUB_FILE"
chmod 600 "$KEY_FILE"
chmod 644 "$PUB_FILE" 2>/dev/null || true

echo
echo "Send the public key above to a UniZ admin (Sreehari)."
echo "Private key stays here: $KEY_FILE (mode 600). Do not copy it to chat or git."
echo "After an admin grants you access, run:  scripts/secrets-pull.sh"
echo "That defaults to the dev vault. Pass --env prod only when you need production."
