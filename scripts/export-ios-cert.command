#!/bin/bash
set -euo pipefail

P12="$HOME/Downloads/Expal-Distribution.p12"
KEYCHAIN="$HOME/Library/Keychains/login.keychain-db"
EXPORT_PASSWORD="${EXPORT_PASSWORD:-ExpalDist2026!}"

osascript -e 'display dialog "Keychain will ask for your Mac login password.\n\n1. Click Allow / İzin Ver\n2. Then choose an export password in Terminal\n\nClick OK to start." buttons {"OK"} default button "OK" with title "EXPal iOS Certificate Export"'

echo ""
echo "Exporting Apple Distribution certificate..."
echo "(If a popup appears, enter your Mac password and click Allow)"
echo ""

security export -k "$KEYCHAIN" -t identities -f pkcs12 -o "$P12" -P "$EXPORT_PASSWORD"

if [[ ! -f "$P12" ]]; then
  osascript -e 'display alert "Export failed" message "No .p12 file was created. Try again and click Allow on the Keychain popup." as critical'
  exit 1
fi

echo ""
echo "Created: $P12 ($(ls -lh "$P12" | awk "{print \$5}"))"
echo ""

BASE64="$(base64 -i "$P12" | tr -d "\n")"
echo "$BASE64" | pbcopy

REPO="buludag944-cmd/expal-frontend"
if command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then
  echo "Uploading GitHub secrets..."
  echo "$BASE64" | gh secret set IOS_DIST_CERT_P12_BASE64 --repo "$REPO"
  echo -n "$EXPORT_PASSWORD" | gh secret set IOS_DIST_CERT_PASSWORD --repo "$REPO"
  echo "Done: IOS_DIST_CERT_P12_BASE64 and IOS_DIST_CERT_PASSWORD set on $REPO"
else
  echo "Base64 copied to clipboard. Add GitHub secrets manually:"
  echo "  IOS_DIST_CERT_P12_BASE64 = paste (Cmd+V)"
  echo "  IOS_DIST_CERT_PASSWORD = $EXPORT_PASSWORD"
fi

osascript -e "display dialog \"Success!\n\nCertificate exported and GitHub secrets updated.\n\nExport password: $EXPORT_PASSWORD\n(Saved as IOS_DIST_CERT_PASSWORD on GitHub)\" buttons {\"OK\"} default button \"OK\" with title \"EXPal iOS Certificate Export\""

echo ""
echo "Finished."
