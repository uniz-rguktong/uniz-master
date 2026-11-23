#!/usr/bin/env bash
# SOPS vault wins when the file and the sops binary exist. Plaintext is the fallback.
# Output must not contain secret values. CLOUDFLARE_TUNNEL_TOKEN stays empty.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SCRIPT="$ROOT/scripts/deploy/sync-k8s-secret-from-vault.sh"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

mkdir -p "$TMP/bin" "$TMP/vault"
SOPS_BODY=$'FOO=from-sops\nCLOUDFLARE_TUNNEL_TOKEN=\nAUTH_DATABASE_URL=postgresql://u:p@127.0.0.1:5432/db\n'
PLAIN_BODY=$'FOO=from-plain\nCLOUDFLARE_TUNNEL_TOKEN=should-not-win\n'
printf '%s' "$SOPS_BODY" >"$TMP/vault/secrets.env.sops"
printf '%s' "$PLAIN_BODY" >"$TMP/vault/secrets.env"
chmod 600 "$TMP/vault/secrets.env.sops" "$TMP/vault/secrets.env"

cat >"$TMP/bin/sops" <<'EOF'
#!/bin/sh
prev=""
for arg in "$@"; do
  if [ "$prev" = "-d" ]; then
    cat "$arg"
    exit 0
  fi
  prev="$arg"
done
echo "sops: missing -d" >&2
exit 1
EOF

cat >"$TMP/bin/kubectl" <<EOF
#!/bin/sh
out="$TMP/applied.env"
if [ "\$1" = "create" ]; then
  for arg in "\$@"; do
    case "\$arg" in
      --from-env-file=*)
        cp "\${arg#--from-env-file=}" "\$out"
        ;;
    esac
  done
  echo "kind: Secret"
  exit 0
fi
if [ "\$1" = "apply" ]; then
  cat >/dev/null
  exit 0
fi
echo "unexpected kubectl \$*" >&2
exit 1
EOF
chmod 755 "$TMP/bin/sops" "$TMP/bin/kubectl"

assert_hidden() {
  local blob="$1"
  if printf '%s' "$blob" | grep -F -q 'from-sops'; then
    echo "secret value leaked into output" >&2
    exit 1
  fi
  if printf '%s' "$blob" | grep -F -q 'should-not-win'; then
    echo "plaintext token leaked into output" >&2
    exit 1
  fi
}

run_sync() {
  # Restricted PATH so a host sops/kubectl cannot shadow the fakes.
  env -u DECRYPTED -u TMP \
    PATH="$TMP/bin:/usr/bin:/bin" \
    UNIZ_SOPS_VAULT="$TMP/vault/secrets.env.sops" \
    UNIZ_PLAIN_VAULT="$TMP/vault/secrets.env" \
    bash "$SCRIPT" "$TMP/vault/secrets.env" 2>&1
}

out="$(run_sync)"
assert_hidden "$out"
grep -q 'Decrypted SOPS vault' <<<"$out"
grep -qx 'FOO=from-sops' "$TMP/applied.env"
grep -qx 'CLOUDFLARE_TUNNEL_TOKEN=' "$TMP/applied.env"
if grep -q 'should-not-win' "$TMP/applied.env"; then
  echo "plaintext token was applied" >&2
  exit 1
fi
if ! grep -q '@10.42.0.1:5432' "$TMP/applied.env"; then
  echo "loopback database host was not rewritten" >&2
  exit 1
fi

# Decrypt failure must not apply the plaintext vault.
cat >"$TMP/bin/sops" <<'EOF'
#!/bin/sh
echo "decrypt failed" >&2
exit 1
EOF
chmod 755 "$TMP/bin/sops"
rm -f "$TMP/applied.env"
if run_sync; then
  echo "decrypt failure should exit non-zero" >&2
  exit 1
fi
if [ -f "$TMP/applied.env" ]; then
  echo "decrypt failure applied a secret" >&2
  exit 1
fi

# sops binary missing → plaintext fallback. Token in the plaintext file is preserved
# as stored (this case is the fallback file, not the SOPS file).
rm -f "$TMP/bin/sops" "$TMP/applied.env"
out="$(run_sync)"
assert_hidden "$out"
grep -q 'sops binary missing' <<<"$out"
grep -qx 'FOO=from-plain' "$TMP/applied.env"

# SOPS file absent → plaintext, no warning.
rm -f "$TMP/vault/secrets.env.sops" "$TMP/applied.env"
out="$(run_sync)"
assert_hidden "$out"
if grep -q 'sops binary missing' <<<"$out"; then
  echo "missing SOPS file should not warn about the binary" >&2
  exit 1
fi
grep -qx 'FOO=from-plain' "$TMP/applied.env"

echo "sync-k8s-secret-from-vault.test.sh ok"
