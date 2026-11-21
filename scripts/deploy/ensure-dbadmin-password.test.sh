#!/usr/bin/env bash
# Mock the vault file. The password must never appear in command output.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SCRIPT="$ROOT/scripts/deploy/ensure-dbadmin-password.sh"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

PASS_A="present-value-not-for-logs"
PASS_B="env-value-not-for-logs"
GEN="generated-hex-not-for-logs"

mkdir -p "$TMP/bin"
cat >"$TMP/bin/openssl" <<EOF
#!/bin/sh
if [ "\$1" = "rand" ] && [ "\$2" = "-hex" ]; then
  printf '%s\n' "$GEN"
  exit 0
fi
echo "openssl should not be called" >&2
exit 1
EOF
chmod 755 "$TMP/bin/openssl"

assert_stdout() {
  local got="$1"
  local want="$2"
  if [ "$got" != "$want" ]; then
    printf 'stdout mismatch\nwant: %s\ngot: %s\n' "$want" "$got" >&2
    exit 1
  fi
}

assert_hidden() {
  local blob="$1"
  local secret="$2"
  if printf '%s' "$blob" | grep -F -q -- "$secret"; then
    echo "secret leaked into output" >&2
    exit 1
  fi
}

run_ensure() {
  local vault="$1"
  shift
  PATH="$TMP/bin:$PATH" env "$@" bash "$SCRIPT" "$vault"
}

# absent: file has other keys and no password line
VAULT="$TMP/absent.env"
printf 'JWT_SECURITY_KEY=%s\nUSER_DATABASE_URL=%s\n' 'kept' 'postgres://db' >"$VAULT"
chmod 640 "$VAULT"
OWNER="$(stat -c '%u:%g' "$VAULT")"
OUT="$(run_ensure "$VAULT" DBADMIN_DB_PASSWORD= 2>"$TMP/absent.err")"
assert_stdout "$OUT" "generated DBADMIN_DB_PASSWORD (new)"
assert_hidden "$OUT" "$GEN"
if [ -s "$TMP/absent.err" ]; then
  echo "stderr was not empty for absent" >&2
  exit 1
fi
grep -q '^JWT_SECURITY_KEY=kept$' "$VAULT"
grep -q "^DBADMIN_DB_PASSWORD=${GEN}$" "$VAULT"
grep -q '^DBADMIN_DB_PASSWORD_VERSION=2$' "$VAULT"
[ "$(stat -c '%a' "$VAULT")" = "600" ]
[ "$(stat -c '%u:%g' "$VAULT")" = "$OWNER" ]

# empty assignment, including a quoted empty value
VAULT="$TMP/empty.env"
printf 'OTHER=1\nDBADMIN_DB_PASSWORD=\nDBADMIN_DB_PASSWORD=""\n' >"$VAULT"
chmod 600 "$VAULT"
OUT="$(run_ensure "$VAULT" DBADMIN_DB_PASSWORD= 2>"$TMP/empty.err")"
assert_stdout "$OUT" "generated DBADMIN_DB_PASSWORD (new)"
assert_hidden "$OUT" "$GEN"
COUNT="$(grep -c '^DBADMIN_DB_PASSWORD=' "$VAULT")"
[ "$COUNT" = "1" ]
grep -q '^OTHER=1$' "$VAULT"
grep -q "^DBADMIN_DB_PASSWORD=${GEN}$" "$VAULT"
grep -q '^DBADMIN_DB_PASSWORD_VERSION=2$' "$VAULT"

# present at the current marker: leave the file alone and do not call openssl
VAULT="$TMP/present.env"
printf 'DBADMIN_DB_PASSWORD=%s\nDBADMIN_DB_PASSWORD_VERSION=2\nOTHER=1\n' "$PASS_A" >"$VAULT"
chmod 600 "$VAULT"
cp "$VAULT" "$TMP/present.before"
OUT="$(run_ensure "$VAULT" DBADMIN_DB_PASSWORD= 2>"$TMP/present.err")"
assert_stdout "$OUT" "present"
assert_hidden "$OUT" "$PASS_A"
cmp -s "$VAULT" "$TMP/present.before"

# missing or older marker: rotate the existing password, ignore the env value
VAULT="$TMP/rotate.env"
printf 'DBADMIN_DB_PASSWORD=%s\nOTHER=1\n' "$PASS_A" >"$VAULT"
chmod 600 "$VAULT"
OWNER="$(stat -c '%u:%g' "$VAULT")"
OUT="$(run_ensure "$VAULT" DBADMIN_DB_PASSWORD="$PASS_B" 2>"$TMP/rotate.err")"
assert_stdout "$OUT" "generated DBADMIN_DB_PASSWORD (new)"
assert_hidden "$OUT" "$PASS_A"
assert_hidden "$OUT" "$PASS_B"
assert_hidden "$OUT" "$GEN"
if [ -s "$TMP/rotate.err" ]; then
  echo "stderr was not empty for rotation" >&2
  exit 1
fi
grep -q '^OTHER=1$' "$VAULT"
grep -q "^DBADMIN_DB_PASSWORD=${GEN}$" "$VAULT"
grep -q '^DBADMIN_DB_PASSWORD_VERSION=2$' "$VAULT"
if grep -q "$PASS_A" "$VAULT" || grep -q "$PASS_B" "$VAULT"; then
  echo "rotation kept the old password or the env value" >&2
  exit 1
fi
[ "$(stat -c '%a' "$VAULT")" = "600" ]
[ "$(stat -c '%u:%g' "$VAULT")" = "$OWNER" ]
cp "$VAULT" "$TMP/rotate.after"
OUT="$(run_ensure "$VAULT" DBADMIN_DB_PASSWORD="$PASS_B" 2>"$TMP/rotate2.err")"
assert_stdout "$OUT" "present"
cmp -s "$VAULT" "$TMP/rotate.after"

VAULT="$TMP/old-version.env"
printf 'DBADMIN_DB_PASSWORD=%s\nDBADMIN_DB_PASSWORD_VERSION=1\n' "$PASS_A" >"$VAULT"
OUT="$(run_ensure "$VAULT" DBADMIN_DB_PASSWORD= 2>"$TMP/oldver.err")"
assert_stdout "$OUT" "generated DBADMIN_DB_PASSWORD (new)"
assert_hidden "$OUT" "$PASS_A"
assert_hidden "$OUT" "$GEN"
grep -q "^DBADMIN_DB_PASSWORD=${GEN}$" "$VAULT"
grep -q '^DBADMIN_DB_PASSWORD_VERSION=2$' "$VAULT"
if grep -q "$PASS_A" "$VAULT"; then
  echo "older marker kept the old password" >&2
  exit 1
fi

# Actions secret wins over generation when the vault line is empty
VAULT="$TMP/from-env.env"
printf 'DBADMIN_DB_PASSWORD=\n' >"$VAULT"
OUT="$(run_ensure "$VAULT" DBADMIN_DB_PASSWORD="$PASS_B" 2>"$TMP/env.err")"
assert_stdout "$OUT" "generated DBADMIN_DB_PASSWORD (new)"
assert_hidden "$OUT" "$PASS_B"
grep -q "^DBADMIN_DB_PASSWORD=${PASS_B}$" "$VAULT"
grep -q '^DBADMIN_DB_PASSWORD_VERSION=2$' "$VAULT"
if grep -q "$GEN" "$VAULT"; then
  echo "generated a password while an env value was set" >&2
  exit 1
fi

# missing file is created mode 600
VAULT="$TMP/missing.env"
OUT="$(run_ensure "$VAULT" DBADMIN_DB_PASSWORD= 2>"$TMP/missing.err")"
assert_stdout "$OUT" "generated DBADMIN_DB_PASSWORD (new)"
[ -f "$VAULT" ]
[ "$(stat -c '%a' "$VAULT")" = "600" ]
grep -q "^DBADMIN_DB_PASSWORD=${GEN}$" "$VAULT"
grep -q '^DBADMIN_DB_PASSWORD_VERSION=2$' "$VAULT"

echo "ensure-dbadmin-password: absent, empty, present, rotate, env ok"
