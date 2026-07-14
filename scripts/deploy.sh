#!/usr/bin/env bash
exec "$(cd "$(dirname "$0")" && pwd)/deploy/deploy.sh" "$@"
