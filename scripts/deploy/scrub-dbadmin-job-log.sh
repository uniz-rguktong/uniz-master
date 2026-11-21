#!/usr/bin/env bash
# Redact role-job log lines before they are printed.
# Covers connection URLs, PASSWORD clauses, and long hex or base64 tokens.
scrub_dbadmin_job_log() {
  sed -E \
    -e 's#postgres(ql)?://[^[:space:]]+#postgresql://***#g' \
    -e 's#(PASSWORD[[:space:]]+)(['"'"'"])[^'"'"'"]*\2#\1\2***\2#gI' \
    -e 's#(password['"'"'"],[[:space:]]*['"'"'"])[^'"'"'"]*#\1***#gI' \
    -e 's#(PASSWORD[[:space:]]+)[^[:space:]'"'"'"]+#\1***#gI' \
    -e 's#(DBADMIN_DB_PASSWORD=)[^[:space:]]+#\1***#g' \
    -e 's#[0-9a-fA-F]{32,}#***#g' \
    -e 's#[A-Za-z0-9+/=_-]{32,}#***#g'
}
