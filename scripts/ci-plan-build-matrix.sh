#!/usr/bin/env bash
exec "$(cd "$(dirname "$0")" && pwd)/ci/ci-plan-build-matrix.sh" "$@"
