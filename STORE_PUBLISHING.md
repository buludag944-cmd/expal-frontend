# Publish Expal on App Store & Google Play

Your app is a **Capacitor shell** with the **web UI bundled inside the AAB/IPA** for Play Store and App Store releases. Netlify (`https://expalapp.netlify.app`) is the web version — redeploy Netlify for browser users without a new store release.

**API:** `https://expalapp-1.onrender.com`  
**Bundle / package ID:** `com.yourbrand.expal`  
**Firebase project:** `expalapp-a6422`

---

## Before you start (accounts & cost)

| Store | What you need | Cost |
|--------|----------------|------|
| **Apple App Store** | [Apple Developer Program](https://developer.apple.com/programs/) | **$99 / year** |
| **Google Play** | [Google Play Console](https://play.google.com/console) | **$25 one-time** |

You also need:

- A **Mac with Xcode** (for iOS)
- **Android Studio** (for Android AAB)
- **Privacy policy URL** (HTTPS) — required by both stores  
  Example: a page on Netlify like `https://expalapp.netlify.app/privacy` (create if you don’t have one)
- **Support email** — e.g. `expalappsupport@gmail.com`

---

## Already configured in this project

- Capacitor iOS + Android projects
- App loads Netlify production URL
- Google Sign-In (Firebase `GoogleService-Info.plist` + `google-services.json`)
- App icons / splash (`npm run logo:apply:cap`)
- Push notifications plugin (optional for v1)
- iOS Associated Domains: `applinks:expalapp.netlify.app`

---

## Step 0 — Sync native projects (do this first)

From `frontend/`:

```bash
npm run build:netlify
npm run logo:apply:cap
npm run cap:sync
```

This refreshes icons, web assets, and native config.

---

## Part A — iOS (App Store / TestFlight)

### A1. Open in Xcode

```bash
cd frontend
npm run cap:ios
```

### A2. Signing

1. Select the **App** target → **Signing & Capabilities**
2. **Team:** your Apple Developer team
3. **Bundle Identifier:** `com.yourbrand.expal`
4. Turn on **Automatically manage signing**

### A3. Fix Apple Team ID for deep links (one time)

1. Find your **Team ID** in [Apple Developer → Membership](https://developer.apple.com/account) (10 characters, e.g. `AB12CD34EF`)
2. Edit `frontend/public/.well-known/apple-app-site-association`  
   Replace `TEAMID` with your real Team ID:
   ```json
   "appIDs": ["AB12CD34EF.com.yourbrand.expal"]
   ```
3. Redeploy Netlify (`npm run build:netlify` → upload `build/`)

### A4. Version numbers

In Xcode → **App** target → **General**:

| Field | First release | Each new upload |
|--------|----------------|-----------------|
| **Version** | `1.0.0` | `1.0.1`, `1.1.0`, … |
| **Build** | `1` | **Must increase:** `2`, `3`, … |

### A5. Archive & upload

1. Scheme: **App**, device: **Any iOS Device (arm64)**
2. **Product → Archive**
3. **Distribute App → App Store Connect → Upload**
4. Wait ~15–30 min for processing in [App Store Connect](https://appstoreconnect.apple.com)

### A6. App Store Connect listing

1. **My Apps → + → New App**
   - Name: **Expal**
   - Bundle ID: `com.yourbrand.expal`
   - SKU: e.g. `expal-001`
2. **TestFlight** — add internal testers, install on iPhone, test Google sign-in
3. For **App Store release** (public):
   - Screenshots (6.7" iPhone required; iPad optional)
   - Description, keywords, category (Social Networking or Lifestyle)
   - **Privacy Policy URL**
   - **App Privacy** questionnaire (email, account data, etc.)
4. Submit for **App Review**

### A7. Test on device

- [ ] App opens and loads Netlify UI  
- [ ] **Continue with Google** works  
- [ ] Home, Community, Profile load (API on Render awake)  
- [ ] Push (optional) — see `IOS_PUSH_SETUP.md`

---

## Part B — Android (Google Play)

### B1. Open in Android Studio

```bash
cd frontend
npm run cap:android
```

Wait for Gradle sync to finish.

### B2. Create a release keystore (one time, keep safe)

In Terminal:

```bash
keytool -genkey -v -keystore ~/expal-release.keystore -alias expal -keyalg RSA -keysize 2048 -validity 10000
```

Store the passwords somewhere secure (not in git).

### B3. Build signed AAB (App Bundle)

In Android Studio:

1. **Build → Generate Signed Bundle / APK**
2. Choose **Android App Bundle**
3. Keystore: `~/expal-release.keystore`, alias `expal`
4. Build variant: **release**
5. Output: `android/app/release/app-release.aab`

Before **each** Play upload, bump in `android/app/build.gradle`:

```gradle
versionCode 2   // was 1, then 3, 4, …
versionName "1.0.1"
```

Then `npm run cap:sync` and rebuild the AAB.

### B4. Play Console — create app

1. [Play Console](https://play.google.com/console) → **Create app**
2. App name: **Expal**, default language, free app
3. Complete **store listing**:
   - Short + full description
   - App icon (512×512) — from `frontend/resources/icon.png`
   - Feature graphic (1024×500)
   - Phone screenshots (min 2)
   - **Privacy policy URL**
4. **Data safety** — declare account/email, authentication
5. **Testing → Internal testing → Create release** → upload `app-release.aab`
6. Add tester emails → publish internal track
7. When ready: promote to **Production** (or closed/open testing first)

### B5. Firebase SHA-1 for release (Google Sign-In on Android)

Get release certificate SHA-1:

```bash
keytool -list -v -keystore ~/expal-release.keystore -alias expal
```

Add **SHA-1** and **SHA-256** in [Firebase Console](https://console.firebase.google.com) → Project **expalapp-a6422** → Android app `com.yourbrand.expal` → Add fingerprint.

Optional: put release **SHA-256** in `public/.well-known/assetlinks.json` for App Links (replace `YOUR_ANDROID_RELEASE_SHA256`), redeploy Netlify.

### B6. Test on device

- [ ] Install from internal testing link  
- [ ] Google sign-in works  
- [ ] App loads when Render API is awake (first load may take ~30s on free tier)

---

## Store checklist (both platforms)

| Item | iOS | Android |
|------|-----|---------|
| Developer account paid | Apple $99/yr | Play $25 once |
| App builds & installs | TestFlight | Internal testing |
| Google login works | ✓ | ✓ + release SHA-1 in Firebase |
| Privacy policy URL | Required | Required |
| Icons & screenshots | Required for release | Required |
| Version bumped | Build number | versionCode |

---

## After launch

- **UI / bug fixes on website:** redeploy **Netlify** only — users get updates when they reopen the app (no store review).
- **Native changes** (new plugins, permissions, bundle ID): bump version → new store upload.
- **Backend:** Render deploys independently.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| White screen in app | Open `https://expalapp.netlify.app` in phone browser — must load |
| Google login fails iOS | Check `GoogleService-Info.plist`, Firebase iOS app, authorized domains |
| Google login fails Android | Add **release** SHA-1 to Firebase (debug SHA-1 is not enough for Play builds) |
| API errors / timeout | Render free tier sleeps — wait or upgrade Render |
| iOS upload rejected “build” | Increase **Build** number in Xcode |
| Play upload rejected | Increase **versionCode** |

---

## Related docs

- [NATIVE_DEPLOY.md](./NATIVE_DEPLOY.md) — dev & TestFlight summary  
- [ANDROID_SHA1.md](./ANDROID_SHA1.md) — Firebase fingerprints  
- [IOS_PUSH_SETUP.md](./IOS_PUSH_SETUP.md) — push notifications  
- [PUSH_SETUP.md](../PUSH_SETUP.md) — backend push on Render
