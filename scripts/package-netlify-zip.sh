#!/usr/bin/env bash
# Fresh Netlify build + zip for drag-and-drop upload (upload the .zip in Netlify Deploys).
set -euo pipefail
cd "$(dirname "$0")/.."
npm run build:netlify
ZIP="expal-netlify-deploy.zip"
rm -f "$ZIP"
(cd build && zip -r "../$ZIP" .)
echo ""
echo "Upload this file to Netlify → Deploys:"
echo "  $(pwd)/$ZIP"
echo ""
echo "Or drag the whole folder:"
echo "  $(pwd)/build"
head -1 build/index.html | tr '>' '>\n' | grep -E 'src=|href=' | head -3
