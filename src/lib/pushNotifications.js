import { Capacitor } from "@capacitor/core";
import { FirebaseMessaging } from "@capacitor-firebase/messaging";
import { getApiBaseUrl } from "../apiConfig";

const ANDROID_CHANNEL_ID = "expal_default";
const PUSH_PROMPTED_KEY = "expal-push-prompted";

let listenersAttached = false;
let currentAuthToken = null;
let latestApnsToken = null;

function sleep(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function postTokenToBackend(fcmToken, authToken) {
  const API = getApiBaseUrl();
  const res = await fetch(`${API}/api/push/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      token: fcmToken,
      platform: Capacitor.getPlatform(),
    }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const msg = data.error || `Server error (${res.status})`;
    console.warn("[push] register failed:", msg);
    return { ok: false, error: msg };
  }
  console.info("[push] device registered with backend");
  return { ok: true };
}

async function ensureAndroidChannel() {
  if (Capacitor.getPlatform() !== "android") return;
  try {
    await FirebaseMessaging.createChannel({
      id: ANDROID_CHANNEL_ID,
      name: "EXPal",
      description: "Messages, community activity, and visa reminders",
      importance: 4,
      sound: "default",
      vibration: true,
      visibility: 1,
    });
  } catch (err) {
    console.warn("[push] createChannel:", err?.message || err);
  }
}

function handleNotificationTap(notification) {
  const raw = notification?.data;
  const data =
    raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  if (data.path) {
    const path = data.path.startsWith("/") ? data.path : `/${data.path}`;
    window.location.href = path;
    return;
  }
  if (data.type === "message" && data.peerId) {
    window.location.href = `/messages?user=${encodeURIComponent(data.peerId)}`;
    return;
  }
  if (data.type === "forum_thread" && data.threadId) {
    window.location.href = `/community/thread/${encodeURIComponent(data.threadId)}`;
  }
}

/**
 * Attach FCM listeners once (no permission prompt).
 */
async function attachPushListeners() {
  if (!Capacitor.isNativePlatform() || listenersAttached) return;
  listenersAttached = true;

  await FirebaseMessaging.addListener("tokenReceived", async (event) => {
    if (event.token && currentAuthToken) {
      await postTokenToBackend(event.token, currentAuthToken);
    }
  });

  await FirebaseMessaging.addListener("apnsTokenReceived", (event) => {
    latestApnsToken = event?.token || true;
    console.info("[push] APNs token received");
  });

  await FirebaseMessaging.addListener("notificationReceived", (event) => {
    console.info("[push] received (foreground):", event.notification?.title);
  });

  await FirebaseMessaging.addListener("notificationActionPerformed", (event) => {
    handleNotificationTap(event.notification);
  });
}

/**
 * iOS lock-screen push needs the APNs device token wired into FCM before getToken().
 */
async function waitForApnsTokenIfNeeded() {
  if (Capacitor.getPlatform() !== "ios") return true;
  if (latestApnsToken) return true;

  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    if (latestApnsToken) return true;
    await sleep(400);
  }
  console.warn("[push] timed out waiting for APNs token — trying FCM getToken anyway");
  return false;
}

/**
 * iOS often needs a short wait after permission + APNs registration before FCM token is ready.
 */
async function getFcmTokenWithRetry() {
  await waitForApnsTokenIfNeeded();
  const delaysMs = Capacitor.getPlatform() === "ios" ? [0, 800, 2000, 4000, 7000] : [0, 500, 1500];
  let lastError = null;
  for (const wait of delaysMs) {
    if (wait) await sleep(wait);
    try {
      const { token } = await FirebaseMessaging.getToken();
      if (token) return { token, error: null };
    } catch (err) {
      lastError = err;
      console.warn("[push] getToken attempt failed:", err?.message || err);
    }
  }
  return { token: null, error: lastError };
}

async function registerCurrentToken(authToken) {
  await ensureAndroidChannel();
  const { token, error } = await getFcmTokenWithRetry();
  if (!token) {
    return {
      granted: true,
      registered: false,
      reason: error ? "token_failed" : "no_token",
      detail:
        error?.message ||
        "FCM token not ready yet. Tap Enable push alerts again in a few seconds.",
    };
  }
  const result = await postTokenToBackend(token, authToken);
  return {
    granted: true,
    registered: result.ok,
    reason: result.ok ? "ok" : "register_failed",
    detail: result.error,
  };
}

/**
 * Re-register FCM token if user already granted permission (no prompt).
 * Call after login so returning users stay subscribed without a login-time dialog.
 */
export async function syncPushTokenIfGranted(authToken) {
  if (!authToken || !Capacitor.isNativePlatform()) return;
  currentAuthToken = authToken;
  await attachPushListeners();
  const perm = await FirebaseMessaging.checkPermissions();
  if (perm.receive !== "granted") return;
  await registerCurrentToken(authToken);
}

/**
 * Prompt once after login (first launch / first session) so lock-screen push can work.
 * Safe to call repeatedly — only prompts when never asked and permission not granted.
 */
export async function ensurePushPermissionOnce(authToken) {
  if (!authToken || !Capacitor.isNativePlatform()) {
    return { granted: false, registered: false, reason: "noop" };
  }
  currentAuthToken = authToken;
  await attachPushListeners();

  const perm = await FirebaseMessaging.checkPermissions();
  if (perm.receive === "granted") {
    return registerCurrentToken(authToken);
  }

  let prompted = false;
  try {
    prompted = localStorage.getItem(PUSH_PROMPTED_KEY) === "1";
  } catch {
    /* private mode */
  }
  if (prompted) {
    return { granted: false, registered: false, reason: "prompted_before" };
  }

  try {
    localStorage.setItem(PUSH_PROMPTED_KEY, "1");
  } catch {
    /* ignore */
  }

  return setupPushNotifications(authToken);
}

/**
 * Register FCM token on native Android/iOS. No-op on web.
 * Prompts for permission when not yet granted — use from Profile → Enable push alerts.
 */
export async function setupPushNotifications(authToken) {
  if (!authToken) return { granted: false, registered: false, reason: "no_auth" };
  currentAuthToken = authToken;

  if (!Capacitor.isNativePlatform()) {
    console.info("[push] web browser — use the native iOS/Android app for push");
    return { granted: false, registered: false, reason: "web" };
  }

  await attachPushListeners();

  let perm = await FirebaseMessaging.checkPermissions();
  if (perm.receive !== "granted") {
    perm = await FirebaseMessaging.requestPermissions();
  }
  if (perm.receive !== "granted") {
    console.warn("[push] notification permission denied");
    return { granted: false, registered: false, reason: "denied" };
  }

  try {
    localStorage.setItem(PUSH_PROMPTED_KEY, "1");
  } catch {
    /* ignore */
  }

  // After iOS permission grant, APNs registration is async — wait then retry getToken.
  return registerCurrentToken(authToken);
}

export async function unregisterPushDevice(authToken, fcmToken) {
  currentAuthToken = null;
  if (!Capacitor.isNativePlatform()) return;
  let token = fcmToken;
  try {
    if (!token) {
      const result = await FirebaseMessaging.getToken().catch(() => null);
      token = result?.token;
    }
    await FirebaseMessaging.deleteToken().catch(() => {});
  } catch {
    /* ignore */
  }
  if (!authToken || !token) return;
  const API = getApiBaseUrl();
  await fetch(`${API}/api/push/unregister`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({ token }),
  }).catch(() => {});
}
