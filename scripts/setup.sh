#!/usr/bin/env bash
# Thin wrapper: prerequisite checks + setup-local + next steps.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

info() { printf '%s\n' "$*"; }
warn() { printf '⚠️  %s\n' "$*" >&2; }

info "UniZ setup — see docs/LOCAL_SETUP.md for details"
info ""

missing=0
for cmd in git node npm docker; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    warn "$cmd is not installed"
    missing=1
  fi
done

if [ "$missing" -eq 1 ]; then
  info ""
  info "Install prerequisites first (Node 20+, Docker, Git):"
  info "  https://github.com/uniz-rguktong/uniz-master/blob/main/docs/LOCAL_SETUP.md#prerequisites"
  exit 1
fi

major="$(node -p "process.versions.node.split('.')[0]" 2>/dev/null || echo 0)"
if [ "${major:-0}" -lt 20 ] 2>/dev/null; then
  warn "Node.js 20+ required (found $(node -v 2>/dev/null || echo unknown))"
  info "Upgrade: https://nodejs.org/"
  exit 1
fi

if [ ! -f "secrets.env" ] && [ -f "secrets.env.example" ]; then
  info "Creating secrets.env from example (safe local placeholders)..."
  cp secrets.env.example secrets.env
fi

bash ./scripts/setup-local.sh

info ""
info "🎉 Ready to develop"
info ""
info "  npm run seed:local   # first-time sample data"
info "  npm run dev          # core: gateway + auth + user + portal"
info "  npm run dev:all      # full stack (+ academics, mail, …)"
info ""
info "Portal:  http://localhost:5173"
info "API:     http://localhost:3000/api/v1"
info "Login:   webmaster / password123  (after seeding)"
info ""
info "Troubleshooting: docs/LOCAL_SETUP.md"
