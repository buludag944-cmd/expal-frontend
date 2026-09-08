# EXPal push on iPhone (iOS)

iOS push uses the **same Firebase project** as Android (`expalapp-a6422`).  
You need an **Apple Developer account ($99/year)** to run the app on a real iPhone and receive push.

> **Decision:** EXPal uses **Firebase Cloud Messaging for both platforms** (FCM → APNs on iOS).  
> No separate OneSignal/Expo. The server stores FCM tokens per user and sends display notifications for lock screen / notification tray.

---

## Part 1 — Firebase (same project as Android)

### 1. Add iOS app in Firebase

1. [Firebase Console](https://console.firebase.google.com) → project **expalapp-a6422**
2. **Add app** → **iOS**
3. **Bundle ID:** `com.yourbrand.expal` (must match Xcode)
4. Download **`GoogleService-Info.plist`**
5. Put it here:

   ```
   frontend/ios/App/App/GoogleService-Info.plist
   ```

### 2. Upload APNs key to Firebase (**required** for lock-screen / background push)

Without this step, iOS often only receives notifications while the app is open.

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

Entitlements in this repo:

| Build | File | `aps-environment` |
|-------|------|-------------------|
| Debug (Xcode run) | `App.Debug.entitlements` | `development` |
| Release / TestFlight / App Store | `App.entitlements` | `production` |

### 4. Confirm `GoogleService-Info.plist`

In Xcode left sidebar: **App** → **GoogleService-Info.plist** must be visible (not red/missing).

### 5. Firebase iOS SDK

This project uses **`@capacitor-firebase/messaging`** via **CapApp-SPM** — do **not** add a second `firebase-ios-sdk` package manually (duplicate link errors).

After `npm run cap:sync`, open Xcode → **File → Packages → Resolve Package Versions** if packages look stuck.

---

## Part 3 — Backend (Render)

| Variable | Purpose |
|----------|---------|
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Server sends FCM to Android + iOS (must be for project **expalapp-a6422**) |

**Manual Deploy** on Render after backend push changes.

---

## Part 4 — What already triggers pushes

| Event | When |
|-------|------|
| Direct message | New DM received |
| Comment | Someone comments on your housing / event / referral / essentials / know-how post |
| Forum | New thread in a space you follow; reply on a thread you posted/replied in |
| Contact founder | Support message to founder |
| Visa reminders | Overdue / due today / upcoming steps (deploy backend) |

---

## Part 5 — Test on iPhone

1. Install from **TestFlight** (production APNs) or Xcode Debug (development APNs)
2. Log in → allow **Notifications** when prompted (or Profile → Enable push alerts)
3. Put app in **background** or lock the phone
4. Send a DM from another account — tray / lock screen should show EXPal

If Android works and iOS does not: re-check **Part 1.2** (APNs `.p8` uploaded to Firebase).
