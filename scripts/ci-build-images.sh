#!/usr/bin/env bash
exec "$(cd "$(dirname "$0")" && pwd)/ci/ci-build-images.sh" "$@"
