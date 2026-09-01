#!/usr/bin/env bash
# Build signed Android App Bundle (.aab) for Google Play — same as Android Studio → Generate Signed Bundle.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ANDROID="$ROOT/android"
KEYSTORE="${EXPAL_KEYSTORE:-$HOME/expal-release.keystore}"
ALIAS="${EXPAL_KEY_ALIAS:-expal}"
PROPS="$ANDROID/keystore.properties"
CREDS="$HOME/expal-play-signing.txt"

if [[ -d "/Applications/Android Studio.app/Contents/jbr/Contents/Home" ]]; then
  export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
fi

cd "$ROOT"

echo "==> 1/4 Web build (Netlify production + relative paths for Android)..."
npm run build:netlify
# Rebuild with relative asset paths for the Capacitor bundle inside the AAB.
set -a
# shellcheck disable=SC1091
source .env.netlify
set +a
PUBLIC_URL=. npm run build

echo "==> 2/4 Logo + Capacitor sync (bundle web app inside AAB — no remote URL)..."
node scripts/verify-google-services.js
npm run logo:apply -- --cap 2>/dev/null || npm run logo:apply
unset CAPACITOR_SERVER_URL
CAPACITOR_SERVER_URL= npx cap sync android

if [[ ! -f "$KEYSTORE" ]]; then
  echo "==> Creating release keystore at $KEYSTORE"
  STORE_PASS="$(openssl rand -base64 24 | tr -d '/+=' | head -c 20)"
  keytool -genkeypair -v \
    -keystore "$KEYSTORE" \
    -alias "$ALIAS" \
    -keyalg RSA -keysize 2048 -validity 10000 \
    -storepass "$STORE_PASS" \
    -keypass "$STORE_PASS" \
    -dname "CN=Expal, OU=Mobile, O=Expal, L=Dublin, ST=Leinster, C=IE"
  cat > "$CREDS" <<EOF
Expal Play Store signing — KEEP SECRET
Keystore: $KEYSTORE
Alias: $ALIAS
Password: $STORE_PASS

Add this SHA-1 to Firebase (expalapp-a6422 → Android com.yourbrand.expal):
EOF
  keytool -list -v -keystore "$KEYSTORE" -alias "$ALIAS" -storepass "$STORE_PASS" 2>/dev/null | grep -E "SHA1:|SHA256:" >> "$CREDS"
  chmod 600 "$CREDS"
  echo "    Passwords saved to: $CREDS"
fi

if [[ ! -f "$PROPS" ]]; then
  if [[ -f "$CREDS" ]]; then
    STORE_PASS="$(grep '^Password:' "$CREDS" | cut -d' ' -f2-)"
  else
    read -rsp "Keystore password: " STORE_PASS
    echo
  fi
  cat > "$PROPS" <<EOF
storeFile=$KEYSTORE
storePassword=$STORE_PASS
keyPassword=$STORE_PASS
keyAlias=$ALIAS
EOF
  echo "    Wrote $PROPS"
fi

echo "==> 3/4 Gradle bundleRelease..."
cd "$ANDROID"
chmod +x ./gradlew
./gradlew bundleRelease

AAB="$ANDROID/app/build/outputs/bundle/release/app-release.aab"
if [[ -f "$AAB" ]]; then
  echo ""
  echo "==> 4/4 DONE"
  echo "Upload this file to Google Play Console:"
  echo "  $AAB"
  ls -lh "$AAB"
else
  echo "ERROR: AAB not found. Open Android Studio: Build → Generate Signed Bundle / APK"
  exit 1
fi
