#!/usr/bin/env bash
exec "$(cd "$(dirname "$0")" && pwd)/ci/ci-build-one-image.sh" "$@"
