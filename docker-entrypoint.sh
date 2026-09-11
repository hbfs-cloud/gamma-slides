#!/bin/bash
set -e

mkdir -p /app/output

if [ $# -eq 0 ]; then
  exec bun /app/bin/fipto-slides.js --help
fi

exec bun /app/bin/fipto-slides.js "$@"
