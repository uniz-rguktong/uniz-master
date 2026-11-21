#!/usr/bin/env bash
# Ensure /root/uniz-secrets.env has a non-empty DBADMIN_DB_PASSWORD.
# Does not print the value.
# A vault that already has a password but no current version marker is rotated
# once: a new random password is written and DBADMIN_DB_PASSWORD_VERSION=2 is
# recorded. Later runs leave that pair alone.
# When the password line is missing or empty, an already-exported
# DBADMIN_DB_PASSWORD (for example an Actions secret) is stored as-is;
# otherwise a random value is generated on this machine. That write also
# records the version marker so the new value is not rotated on the next run.
set -euo pipefail

VAULT="${1:-/root/uniz-secrets.env}"

python3 - "$VAULT" <<'PY'
import os, shlex, subprocess, sys, tempfile

vault = sys.argv[1]
key = "DBADMIN_DB_PASSWORD"
version_key = "DBADMIN_DB_PASSWORD_VERSION"
target_version = 2
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

def line_key(line: str):
    body = line.strip()
    if not body or body.startswith("#") or "=" not in body:
        return None
    name, _, _ = body.partition("=")
    name = name.strip()
    if name.startswith("export "):
        name = name[len("export "):].strip()
    return name

def is_managed_line(line: str) -> bool:
    return line_key(line) in (key, version_key)

def current_value(text: str):
    found = False
    for line in text.splitlines():
        if line_key(line) != key:
            continue
        found = True
        raw = line.split("=", 1)[1]
        value = extract(raw)
        if value != "":
            return value
    return "" if found else None

def marker_is_current(text: str) -> bool:
    raw = None
    for line in text.splitlines():
        if line_key(line) != version_key:
            continue
        raw = extract(line.split("=", 1)[1])
    if raw is None or raw == "":
        return False
    try:
        return int(raw) >= target_version
    except ValueError:
        return False

def reject_empty(value: str) -> str:
    if value == "" or any(ch in value for ch in "\n\r\x00"):
        sys.stderr.write("Refusing to write an empty DBADMIN_DB_PASSWORD.\n")
        sys.exit(1)
    return value

def random_password() -> str:
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
    return reject_empty(value)

def new_password() -> str:
    supplied = os.environ.get(key, "")
    if supplied.strip() != "":
        return reject_empty(supplied)
    return random_password()

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

value = current_value(text)
current = marker_is_current(text)
if value and current:
    print(present_log)
    sys.exit(0)

# An existing password without the current marker was already written, and
# may already be in a job log. Replace it with a new random value and ignore
# any exported password, which could be the same leaked value.
if value and not current:
    password = random_password()
else:
    password = new_password()

kept = []
for line in text.splitlines(keepends=True):
    if is_managed_line(line):
        continue
    kept.append(line)
body = "".join(kept)
if body and not body.endswith("\n"):
    body += "\n"
body += key + "=" + shlex.quote(password) + "\n"
body += version_key + "=" + str(target_version) + "\n"
write_atomic(vault, body, uid, gid)
print(generated_log)
PY
