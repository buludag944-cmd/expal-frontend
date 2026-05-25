# EXPal — Capacitor native apps

Native shells load the hosted SPA at **`https://app.yourdomain.com`** (`server.url` in `capacitor.config.ts`). **No backend or React route changes** — signing, packaging, and docs only.

## Pre-flight (before any store build)

Confirm these are **live with real values** (not placeholders):

| Check | How to verify |
|-------|----------------|
| SPA + SPA fallback | `https://app.yourdomain.com/verify/test` serves React (not host 404) — [DEPLOY.md](./DEPLOY.md) |
| `.well-known` deployed | `curl -sI https://app.yourdomain.com/.well-known/apple-app-site-association` → 200, `application/json`, no redirect |
| AASA `appIDs` | `TEAMID.com.yourbrand.expal` matches Apple Team ID + bundle ID |
| `assetlinks.json` | `package_name` = `com.yourbrand.expal`; SHA-256 = **release** keystore (not debug) |
| Backend emails | `CLIENT_URL=https://app.yourdomain.com` |
| Production API in SPA | `REACT_APP_API_URL=https://api.yourdomain.com` in `.env.production`, then `npm run build` |
| CORS | API allows `https://app.yourdomain.com` |
| Native sync | `npm run cap:sync` from `frontend/` |

---

## npm scripts

| Script | Command |
|--------|---------|
| `cap:sync` | `npm run build && npx cap copy` |
| `cap:ios` | `npx cap open ios` |
| `cap:android` | `npx cap open android` |
| `cap:assets` | `npx @capacitor/assets generate --ios --android` |

---

## Versioning rules

| Platform | User-facing | Upload ID | Rule |
|----------|-------------|-----------|------|
| **iOS** | **Version** (`MARKETING_VERSION`, e.g. `1.0.0`) | **Build** (`CURRENT_PROJECT_VERSION`, e.g. `1`) | **Build must increase** for every TestFlight/App Store upload. Bump Version when you ship a new release to users. |
| **Android** | `versionName` (e.g. `"1.0"`) | `versionCode` (integer, starts at `1`) | **`versionCode` must increase** for every Play upload. `versionName` is display-only. |

Current defaults in repo: iOS Version `1.0` / Build `1`; Android `versionName "1.0"` / `versionCode 1` (`ios/.../project.pbxproj`, `android/app/build.gradle`).

---

# Chunk 3 — Store builds

## A) iOS → TestFlight

### 1. Open project

```bash
cd frontend
npm run cap:sync
npm run cap:ios
```

### 2. Signing & Capabilities

Target **App** → **Signing & Capabilities**:

| Setting | Value |
|---------|--------|
| Team | **YOUR_APPLE_TEAM** (Apple Developer account) |
| Bundle Identifier | `com.yourbrand.expal` (must match AASA `appIDs`) |
| Associated Domains | `applinks:app.yourdomain.com` (in `App.entitlements`; confirm in Xcode) |
| Signing | **Automatically manage signing** ON (recommended for TestFlight) |

**Reinstall** the app on device after changing Associated Domains.

### 3. Versioning

**General** tab:

- **Version:** `1.0.0` (or next marketing version)
- **Build:** increment each upload (`1` → `2` → …)

### 4. Archive & upload

1. Scheme: **App**, destination: **Any iOS Device (arm64)**
2. **Product → Archive**
3. **Distribute App → App Store Connect → Upload**
4. Wait for processing in App Store Connect (≈15–30 min)

### 5. App Store Connect

1. [App Store Connect](https://appstoreconnect.apple.com) → **My Apps** → **+** → New App  
   - Name, **Bundle ID** `com.yourbrand.expal`, SKU, primary language
2. **TestFlight** → build appears → add **Internal** testers
3. **App Privacy** — [Apple guidelines](https://developer.apple.com/app-store/app-privacy-details/): declare **email** (account), contact info if collected; analytics only if you use them
4. For beta-only TestFlight you can defer full screenshots; for App Store release later:
   - 6.7" and 5.5" screenshots
   - Privacy Policy URL, Support URL

### 6. Deep-link sanity (TestFlight device)

- [ ] Install build from TestFlight
- [ ] Tap live email link: `https://app.yourdomain.com/verify/<token>` → **app opens**, verify UI loads
- [ ] Tap reset link: `https://app.yourdomain.com/reset/<token>` → app opens, reset UI loads
- [ ] Login and main tabs work over HTTPS (no mixed content)

Optional: [Apple AASA validator](https://search.developer.apple.com/appsearch-validation-tool/)

---

## B) Android → Play Internal testing

### 1. Open project

```bash
cd frontend
npm run cap:sync
npm run cap:android
```

### 2. App ID & SDK

`android/app/build.gradle` + `android/variables.gradle`:

| Setting | Current in repo |
|---------|----------------|
| `applicationId` | `com.yourbrand.expal` |
| `minSdkVersion` | `24` |
| `targetSdkVersion` | `36` (meets Play policy; ≥34 required) |

### 3. Release keystore & SHA-256

1. **Build → Generate Signed Bundle / APK**
2. Choose **Android App Bundle (AAB)**
3. **Create** or select release keystore; store passwords securely (not in git)
4. Export **SHA-256** of the **release** certificate:

   ```bash
   keytool -list -v -keystore your-release.keystore -alias your-alias
   ```

5. Put that fingerprint in `public/.well-known/assetlinks.json` on the SPA host, redeploy SPA, then build the AAB

Play App Signing: if Google manages signing, use the SHA-256 from **Play Console → Setup → App signing** in `assetlinks.json`.

### 4. Build release AAB

1. **Build → Generate Signed Bundle / APK** → **release** variant
2. Note output path (e.g. `android/app/release/app-release.aab`)
3. Before next upload: increment `versionCode` in `android/app/build.gradle`

### 5. Google Play Console

1. [Play Console](https://play.google.com/console) → **Create app**
2. **Testing → Internal testing** → **Create new release** → upload AAB
3. Minimal listing:
   - App name, short + full description
   - **Privacy Policy URL** (HTTPS on your domain)
   - Category, target audience (e.g. 13+ general), ads declaration
4. **Data safety** — [Play Data safety](https://support.google.com/googleplay/android-developer/answer/10787469): email, account/auth; analytics if applicable
5. Add internal testers → publish to internal track

### 6. Deep-link sanity (internal test device)

- [ ] Install from internal testing link
- [ ] Email verify: `https://app.yourdomain.com/verify/<token>` → app, not browser
- [ ] Email reset: `https://app.yourdomain.com/reset/<token>` → app
- [ ] Or via adb:

  ```bash
  adb shell am start -a android.intent.action.VIEW \
    -d "https://app.yourdomain.com/verify/TEST_TOKEN"
  ```

---

## Deep links (reference)

| Platform | Config |
|----------|--------|
| Files on SPA host | `build/.well-known/apple-app-site-association`, `assetlinks.json` |
| iOS | Associated Domains + AASA `TEAMID.com.yourbrand.expal` |
| Android | `AndroidManifest.xml` intent-filter + matching release SHA-256 |

Details: [public/.well-known/README.md](./public/.well-known/README.md)

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| iOS link opens Safari | AASA wrong/redirected; reinstall after entitlement change; Team ID in AASA |
| Android opens browser | Release SHA-256 ≠ `assetlinks.json`; reinstall; run `adb shell pm get-app-links com.yourbrand.expal` |
| Upload rejected (iOS) | Build number not incremented |
| Upload rejected (Play) | `versionCode` not incremented |
| Blank WebView | `server.url` unreachable; check HTTPS; API CORS |
| Route 404 in app | SPA host missing `index.html` fallback — [DEPLOY.md](./DEPLOY.md) |
| Mixed content | All assets and API must be HTTPS |

---

## Success criteria

- [ ] **TestFlight:** build in App Store Connect; installs on device; verify/reset links open app
- [ ] **Play Internal:** release on internal track; installs; App Links work
- [ ] No SPA/backend logic changes — only env, signing, and store metadata

---

## Related docs

- Web deploy: [DEPLOY.md](./DEPLOY.md)
- Deep-link placeholders: [public/.well-known/README.md](./public/.well-known/README.md)
- [App Store privacy](https://developer.apple.com/app-store/app-privacy-details/) · [Play Data safety](https://support.google.com/googleplay/android-developer/answer/10787469)
