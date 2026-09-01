# Deploy Expal on iOS & Android

The native apps **bundle the built web UI** inside the install (see `scripts/build-android-bundle.sh`). Do **not** set `CAPACITOR_SERVER_URL` for store builds. Netlify (`https://expalapp.netlify.app`) is the browser version — update it separately for web users.

**Sign-in:** Google via native Firebase Authentication plugin on Android/iOS (not browser redirect). Web uses Google popup.

---

## 1. One-time prep

1. **Deploy the web app to Netlify** (`npm run build:netlify` + upload `build/`, or Git deploy) so `https://expalapp.netlify.app` shows **Continue with Google** only.
2. **Firebase:** project **expalapp-a6422** — iOS app with bundle `com.yourbrand.expal`, `GoogleService-Info.plist` in `ios/App/App/`, Google sign-in enabled, authorized domain `expalapp.netlify.app`.
3. **Render:** `FIREBASE_SERVICE_ACCOUNT_JSON` (or `_BASE64`) so `POST /api/auth/google` works after Google sign-in.
4. **Xcode** (Mac) for iOS — from the App Store.
5. **Android Studio** for Android.
6. **Apple Developer** account for TestFlight/App Store; **Google Play Console** for Android.

---

## 2. Sync native projects (run after every native release)

From `frontend/`:

```bash
npm run cap:sync
```

This runs `npm run build`, then `npx cap sync` (copies config, plugins, and `build/` assets).

---

## 3. Run on a device or simulator

### iOS

```bash
npm run ios:sync
npm run cap:ios
```

In Xcode:

1. Select your **Team** under Signing & Capabilities.
2. Pick an **iPhone** or **iPad** simulator (or a connected device).
3. Press **Run** (▶).

The app is **Universal** (`TARGETED_DEVICE_FAMILY = 1,2`) — same mobile UI as Android, with iPhone safe areas and a centered column on iPad/tablet widths.

**iPad layout:** On screens ≥600px wide, content is centered (max 720–840px), Explore uses a 2–3 column grid, and the tab bar stays aligned with the content column.

**After code changes:** run `npm run ios:sync` again before archiving for TestFlight.

### Android

```bash
npm run cap:sync
npm run cap:android
```

In Android Studio:

1. Wait for Gradle sync (project: `frontend/android`).
2. Pick an emulator or device.
3. Press **Run** (▶).

**Command-line debug APK** (no Studio UI):

```bash
npm run android:build
```

APK: `android/app/build/outputs/apk/debug/app-debug.apk`

**Debug SHA-1 for Firebase:** see `ANDROID_SHA1.md` or `npm run android:sha1`.

---

## 4. TestFlight (iOS)

1. `npm run cap:sync` && `npm run cap:ios`
2. Target **App** → Signing: Team + bundle `com.yourbrand.expal`
3. **General:** bump **Build** for each upload (1 → 2 → …)
4. **Product → Archive → Distribute → App Store Connect**
5. In App Store Connect → TestFlight → add testers

---

## 5. Google Play (Android)

1. `npm run cap:sync` && `npm run cap:android`
2. **Build → Generate Signed Bundle / APK** (AAB for Play)
3. Bump `versionCode` in `android/app/build.gradle` for each upload
4. Upload AAB in Play Console

---

## 6. Local dev on a physical phone (optional)

Point the shell at your Mac instead of Netlify:

```bash
# Terminal 1 — API
cd backend && npm start

# Terminal 2 — frontend (note your Mac's LAN IP, e.g. 192.168.1.8)
cd frontend && npm start

# Terminal 3 — native with local URL
cd frontend
CAPACITOR_SERVER_URL=http://192.168.1.8:3000 npx cap sync
npx cap run ios
# or: npx cap run android
```

Set `REACT_APP_API_URL=http://192.168.1.8:3001` in `frontend/.env.local` and restart CRA.

---

## Troubleshooting

| Issue | Fix |
|--------|-----|
| Blank white screen | Open `https://expalapp.netlify.app` in Safari — must load. Redeploy Netlify. |
| Login/API fails | Netlify build needs `REACT_APP_API_URL=https://expalapp-1.onrender.com` |
| Old blue design | Redeploy Netlify, force-quit app, reopen |
| Push not working | See `PUSH_SETUP.md` — native only, not mobile browser |
