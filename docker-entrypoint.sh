#!/bin/bash
set -e

mkdir -p /app/output

if [ $# -eq 0 ]; then
  exec node /app/bin/fipto-slides.js --help
fi

exec node /app/bin/fipto-slides.js "$@"
