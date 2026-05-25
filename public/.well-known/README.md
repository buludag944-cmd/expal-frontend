# Deep-link files (deploy with the SPA)

CRA copies this folder to `build/.well-known/` on `npm run build`. After deploy, both URLs must work over **HTTPS** with `Content-Type: application/json` and **no redirects**:

- `https://expalapp.netlify.app/.well-known/apple-app-site-association` (no file extension)
- `https://expalapp.netlify.app/.well-known/assetlinks.json`

**Before production:**

| File | Replace |
|------|---------|
| `apple-app-site-association` | `TEAMID` → Apple Developer Team ID; `com.yourbrand.expal` → iOS bundle ID |
| `assetlinks.json` | `com.yourbrand.expal` → Android `applicationId`; `YOUR_ANDROID_RELEASE_SHA256` → **release** keystore SHA-256 (not debug) |

Rebuild and redeploy the SPA after editing.
