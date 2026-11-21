#!/usr/bin/env bash
# Ensure /root/uniz-secrets.env has a non-empty DBADMIN_DB_PASSWORD.
# Writes the line only when it is missing or empty. Does not print the value.
# An already-exported DBADMIN_DB_PASSWORD (for example an Actions secret) is
# stored as-is; otherwise a random value is generated on this machine.
set -euo pipefail

VAULT="${1:-/root/uniz-secrets.env}"

python3 - "$VAULT" <<'PY'
import os, shlex, subprocess, sys, tempfile

vault = sys.argv[1]
key = "DBADMIN_DB_PASSWORD"
generated_log = "generated DBADMIN_DB_PASSWORD (new)"
present_log = "present"

def extract(raw: str) -> str:
    try:
        parts = shlex.split(raw, posix=True)
    except ValueError:
        return raw.strip()
    if len(parts) == 0:
        return ""
    if len(parts) == 1:
        return parts[0]
    return raw.strip()

def is_password_line(line: str) -> bool:
    body = line.strip()
    if not body or body.startswith("#") or "=" not in body:
        return False
    name, _, _ = body.partition("=")
    name = name.strip()
    if name.startswith("export "):
        name = name[len("export "):].strip()
    return name == key

def current_value(text: str):
    found = False
    for line in text.splitlines():
        if not is_password_line(line):
            continue
        found = True
        raw = line.split("=", 1)[1]
        value = extract(raw)
        if value != "":
            return value
    return "" if found else None

def new_password() -> str:
    supplied = os.environ.get(key, "")
    if supplied.strip() != "":
        value = supplied
    else:
        try:
            proc = subprocess.run(
                ["openssl", "rand", "-hex", "32"],
                check=True,
                capture_output=True,
                text=True,
            )
            value = proc.stdout.strip()
        except (OSError, subprocess.CalledProcessError):
            import secrets
            value = secrets.token_hex(32)
    if value == "" or any(ch in value for ch in "\n\r\x00"):
        sys.stderr.write("Refusing to write an empty DBADMIN_DB_PASSWORD.\n")
        sys.exit(1)
    return value

def write_atomic(path: str, text: str, uid, gid) -> None:
    directory = os.path.dirname(path) or "."
    fd, tmp = tempfile.mkstemp(prefix=".dbadmin-password.", dir=directory)
    try:
        os.write(fd, text.encode())
        os.fchmod(fd, 0o600)
        if uid is not None:
            os.fchown(fd, uid, gid)
        os.close(fd)
        fd = None
        os.replace(tmp, path)
        tmp = ""
    finally:
        if fd is not None:
            os.close(fd)
        if tmp:
            try:
                os.unlink(tmp)
            except FileNotFoundError:
                pass

if os.path.exists(vault):
    st = os.stat(vault)
    text = open(vault, "r", encoding="utf-8").read()
    uid, gid = st.st_uid, st.st_gid
else:
    text = ""
    uid, gid = os.getuid(), os.getgid()

if current_value(text):
    print(present_log)
    sys.exit(0)

password = new_password()
kept = []
for line in text.splitlines(keepends=True):
    if is_password_line(line):
        continue
    kept.append(line)
body = "".join(kept)
if body and not body.endswith("\n"):
    body += "\n"
body += key + "=" + shlex.quote(password) + "\n"
write_atomic(vault, body, uid, gid)
print(generated_log)
PY
