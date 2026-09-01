# EXPal push on iPhone (iOS)

iOS push uses the **same Firebase project** as Android (`expal-app-1ab1a`).  
You need an **Apple Developer account ($99/year)** to run the app on a real iPhone and receive push.

---

## Part 1 — Firebase (same project as Android)

### 1. Add iOS app in Firebase

1. [Firebase Console](https://console.firebase.google.com) → project **expal-app-1ab1a**
2. **Add app** → **iOS**
3. **Bundle ID:** `com.yourbrand.expal` (must match Xcode)
4. Download **`GoogleService-Info.plist`**
5. Put it here (replace this readme’s folder file):

   ```
   frontend/ios/App/App/GoogleService-Info.plist
   ```

### 2. Upload APNs key to Firebase (required for iPhone push)

1. [Apple Developer](https://developer.apple.com/account) → **Keys** → **+**
2. Name: `EXPal Push`, enable **Apple Push Notifications service (APNs)**
3. Download the **.p8** file (only once — store it safely)
4. Note **Key ID** and your **Team ID**
5. Firebase → **Project settings** → **Cloud Messaging** → **Apple app configuration**
6. Under your iOS app → **Upload** APNs Authentication Key (.p8), enter Key ID + Team ID

---

## Part 2 — Apple Developer & Xcode

### 1. Enroll

- [developer.apple.com](https://developer.apple.com) — **$99/year**

### 2. Open the iOS project

```bash
cd frontend
npm install
npm run cap:sync
npm run cap:ios
```

### 3. Signing & capabilities (Xcode)

Target **App** → **Signing & Capabilities**:

| Setting | Value |
|---------|--------|
| Team | Your Apple Developer team |
| Bundle Identifier | `com.yourbrand.expal` |
| **Push Notifications** | Add capability (+ Capability) |
| **Background Modes** | Check **Remote notifications** |

Xcode may change `aps-environment` in `App.entitlements` to `production` when you archive for App Store — that’s normal.

### 4. Confirm `GoogleService-Info.plist`

In Xcode left sidebar: **App** → **GoogleService-Info.plist** must be visible (not red/missing).

### 5. Firebase iOS SDK (Swift Package) — **skip the manual step**

Firebase’s docs say **File → Add Packages** and add `https://github.com/firebase/firebase-ios-sdk` with **FirebaseAnalytics**.

**You do not need that for EXPal.** This project uses **`@capacitor-firebase/messaging`**, which already pulls in the Firebase iOS SDK through **CapApp-SPM** (`ios/App/CapApp-SPM/Package.swift`):

| Already included via Capacitor | Purpose |
|------------------------------|---------|
| **FirebaseCore** | Reads `GoogleService-Info.plist`, runs `FirebaseApp.configure()` |
| **FirebaseMessaging** | FCM push tokens |

Adding the same SDK again in Xcode can cause **duplicate package** / link errors.

**Only add FirebaseAnalytics** in Xcode if you later want Firebase Analytics in the native app (optional; not required for push).

After `npm run cap:sync`, open Xcode → **File → Packages → Resolve Package Versions** if packages look stuck.

---

## Part 3 — Backend (Render)

Same as Android — you should already have:

| Variable | Purpose |
|----------|---------|
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Server sends FCM to Android + iOS |

**Manual Deploy** on Render after any backend change.

---

## Part 4 — Test on iPhone

1. Connect iPhone → run from Xcode (not Simulator for first push test)
2. Log in → allow **Notifications**
3. Put app in **background**
4. From another account, send a **message** or **comment**
5. Notification should appear; tap opens Messages or the post

Render logs:

```text
[push] registered userId=...
[push] sent to userId=... success=1
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| No permission prompt | iPhone **Settings → EXPal → Notifications** → Allow |
| `Firebase init failed` on Render | Fix `FIREBASE_SERVICE_ACCOUNT_JSON` |
| Xcode “Missing GoogleService-Info.plist” | Download from Firebase iOS app |
| Push on Android works, not iOS | Upload **APNs .p8 key** to Firebase Cloud Messaging |
| Works in dev, not TestFlight | Use **production** APNs key / production `aps-environment` for release builds |

---

## Cost summary

| Item | Cost |
|------|------|
| Firebase | Free tier |
| Apple Developer | **$99/year** (required for iPhone app + push) |
| Render | Your existing plan |

Android + iOS both use **FCM tokens** and the same Render backend.
