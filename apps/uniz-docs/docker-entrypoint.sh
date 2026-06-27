#!/bin/sh
set -eu
mint dev --port 4000 --no-open &
exec nginx -g 'daemon off;'
