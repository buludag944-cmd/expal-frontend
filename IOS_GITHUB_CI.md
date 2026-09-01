# iOS TestFlight via GitHub Actions

Build and upload EXPal to **TestFlight** without a local Mac/Xcode upload.

## GitHub secrets to add

Repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

### App Store Connect API

| Secret | Value |
|--------|--------|
| `APPSTORE_KEY_ID` | `SJL682FX9U` (your Key ID) |
| `APPSTORE_ISSUER_ID` | Issuer ID from App Store Connect → Integrations → API |
| `APPSTORE_PRIVATE_KEY` | Full text of `AuthKey_SJL682FX9U.p8` — **never commit this file** |

### Apple signing

| Secret | Value |
|--------|--------|
| `APPLE_TEAM_ID` | 10-character Team ID |
| `IOS_DIST_CERT_P12_BASE64` | Base64 of Apple Distribution `.p12` |
| `IOS_DIST_CERT_PASSWORD` | `.p12` export password |
| `IOS_PROVISION_PROFILE_BASE64` | Base64 of App Store `.mobileprovision` for `com.yourbrand.expal` |

### Firebase (bundled in the app)

| Secret | Value |
|--------|--------|
| `GOOGLE_SERVICE_INFO_PLIST` | Entire `GoogleService-Info.plist` file |
| `REACT_APP_FIREBASE_API_KEY` | From `.env.netlify` |
| `REACT_APP_FIREBASE_AUTH_DOMAIN` | `expalapp-a6422.firebaseapp.com` |
| `REACT_APP_FIREBASE_PROJECT_ID` | `expalapp-a6422` |
| `REACT_APP_FIREBASE_APP_ID` | Firebase web app ID |

## Run

**Actions** → **iOS TestFlight** → **Run workflow**

Or: `git tag ios-1.3.6 && git push origin ios-1.3.6`

Bump `CURRENT_PROJECT_VERSION` in `ios/App/App.xcodeproj/project.pbxproj` before each upload.
