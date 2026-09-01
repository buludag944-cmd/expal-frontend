#!/usr/bin/env bash
# Build frontend with Firebase + API env from .env.netlify (for manual Netlify upload).
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ ! -f .env.netlify ]]; then
  echo "Missing .env.netlify — copy netlify.env.import.example and fill Firebase keys."
  exit 1
fi
set -a
# shellcheck disable=SC1091
source .env.netlify
set +a
# Absolute /static/... paths — required for Netlify (relative ./ breaks on some hosts).
PUBLIC_URL=/ npm run build
MAIN=$(ls build/static/js/main.*.js | head -1)
if ! grep -q 'expalapp-a6422' "$MAIN"; then
  echo "Build missing Firebase config — check .env.netlify"
  exit 1
fi
echo "OK: $(basename "$MAIN") includes Firebase config."
echo "Deploy: Netlify → Deploys → drag this folder → $(pwd)/build"
