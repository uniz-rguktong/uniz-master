#!/bin/sh
# Kept for compatibility with older compose/k8s references; image now runs nginx directly.
exec nginx -g 'daemon off;'
