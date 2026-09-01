#!/usr/bin/env bash
# Capacitor sync with Firebase env from .env.netlify when present (fixes Google sign-in in local builds).
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ -f .env.netlify ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env.netlify
  set +a
  echo "[cap-sync] Loaded Firebase env from .env.netlify"
fi
npm run build
npx cap sync "$@"
