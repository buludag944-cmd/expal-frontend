#!/usr/bin/env bash
# Build web bundle for Capacitor iOS + sync Xcode project (bundled app, no remote URL).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> 1/3 Web build (relative paths for iOS bundle)..."
set -a
# shellcheck disable=SC1091
[[ -f .env.netlify ]] && source .env.netlify
set +a
PUBLIC_URL=. npm run build

echo "==> 2/3 Verify iOS Firebase (Google Sign-In)..."
node scripts/verify-google-services-ios.js

echo "==> 3/4 Capacitor sync iOS..."
unset CAPACITOR_SERVER_URL
CAPACITOR_SERVER_URL= npx cap sync ios

echo ""
echo "==> 4/4 DONE — open in Xcode:"
echo "  cd $ROOT && npm run cap:ios"
echo ""
echo "In Xcode: select Team → iPhone or iPad simulator → Run (▶)"
echo "TestFlight: Product → Archive → Distribute → App Store Connect"
