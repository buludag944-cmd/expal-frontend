# Android SHA-1 fingerprint (Expal)

Firebase **Google Sign-In**, Firebase Android app setup, and some Google APIs need your app’s **SHA-1** (and often **SHA-256**) certificate fingerprint.

**Package name (application ID):** `com.yourbrand.expal`

### Firebase Android config file

`frontend/android/app/google-services.json` — project **expalapp-a6422**, package **com.yourbrand.expal**.

Re-download from Firebase after adding SHA-1 if `oauth_client` is still `[]` (needed for Google Sign-In).

---

### Expal debug fingerprint (this Mac — add in Firebase)

**Current** debug keystore (generated fresh — use this in Firebase **expalapp-a6422**):

| | Value |
|---|--------|
| **SHA-1** | `58:9F:1B:34:35:21:5D:20:F6:5E:43:AE:66:43:A1:6A:D0:60:BE:1E` |
| **SHA-256** | `61:07:49:E3:A1:97:B0:62:08:2A:4C:62:F8:A9:56:A5:57:12:72:EB:97:2F:7A:75:04:06:94:7F:2B:CC:96:B3` |

Previous keystore backed up to `~/.android/debug.keystore.backup-*` (old SHA-1 no longer used).

Then download an updated `google-services.json` → `android/app/google-services.json`.

After adding SHA-1, the file should include an `oauth_client` block (not empty `[]`). Replace the old file, then:

```bash
cd frontend && npm run cap:sync
```

Re-check anytime: `npm run android:sha1` from `frontend/`.

---

You usually need **two** fingerprints:

| Keystore | When to use |
|----------|-------------|
| **Debug** | Running from Android Studio on emulator/device |
| **Release** | Play Store / production builds |

---

## Option A — Android Studio (easiest)

1. Open the Android project:
   ```bash
   cd frontend && npm run cap:android
   ```
2. In Android Studio: **Gradle** panel (elephant icon) →  
   **android** → **Tasks** → **android** → double-click **`signingReport`**
3. Open the **Run** window at the bottom. Copy:
   - `SHA1:` under **Variant: debug**
   - `SHA1:` under **Variant: release** (after you configure release signing)

If `signingReport` fails, install **JDK 17** (Android Studio → Settings → Build → Gradle → Gradle JDK).

---

## Option B — Terminal (`keytool`)

### Debug SHA-1 (local dev)

The debug keystore is created the first time you build Android. Default path:

`~/.android/debug.keystore`  
Password: `android`  
Alias: `androiddebugkey`

```bash
keytool -list -v \
  -alias androiddebugkey \
  -keystore ~/.android/debug.keystore \
  -storepass android \
  -keypass android
```

Copy the line **`SHA1:`** (format like `AA:BB:CC:...`).

If the file is missing, build once in Android Studio (**Run** on an emulator), then run the command again.

### Release SHA-1 (Play Store)

If you already created a release keystore:

```bash
keytool -list -v \
  -keystore /path/to/your-release.keystore \
  -alias YOUR_ALIAS
```

Enter the keystore password. Copy **`SHA1:`** and **`SHA256:`**.

**Play App Signing:** If Google hosts your signing key, use the fingerprint from  
**Play Console → Your app → Setup → App integrity → App signing key certificate**  
(not only your upload key).

---

## Option C — Gradle from project folder

```bash
cd frontend/android
./gradlew signingReport
```

Look for `Variant: debug` and `Variant: release` in the output.

---

## Where to paste the SHA-1

### Firebase (Google login / Android app)

1. [Firebase Console](https://console.firebase.google.com) → project **expal-app-1ab1a**
2. **Project settings** → **Your apps** → Android app (`com.yourbrand.expal`)
3. **Add fingerprint** → paste **debug SHA-1** (for dev)
4. Add **release SHA-1** when you have a release keystore or Play App Signing cert
5. Download an updated **`google-services.json`** →  
   `frontend/android/app/google-services.json`

### Google Cloud (OAuth client)

If you create an OAuth **Android** client:

1. [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → **Credentials**
2. Create **OAuth client ID** → type **Android**
3. Package name: `com.yourbrand.expal`
4. SHA-1: same debug (or release) fingerprint

---

## Deep links (`assetlinks.json`)

For **Android App Links**, use **SHA-256** of the **release** certificate in:

`frontend/public/.well-known/assetlinks.json`

(Debug SHA-256 does not work for production verified links.)

---

## iOS note

iOS does **not** use SHA-1 for Firebase/Google the same way. For iOS you use **bundle ID** `com.yourbrand.expal` and `GoogleService-Info.plist`.

---

## Quick checklist

- [ ] Build Android once (creates debug keystore if missing)
- [ ] Run `signingReport` or `keytool` for **debug SHA-1**
- [ ] Add SHA-1 in Firebase Android app settings
- [ ] Replace `google-services.json` in `android/app/`
- [ ] Before Play release: add **release** SHA-1 from Play Console or your release keystore
