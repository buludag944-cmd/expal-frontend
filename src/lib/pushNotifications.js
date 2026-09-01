import { Capacitor } from "@capacitor/core";
import { FirebaseMessaging } from "@capacitor-firebase/messaging";
import { getApiBaseUrl } from "../apiConfig";

let listenersAttached = false;
let currentAuthToken = null;

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

  await FirebaseMessaging.addListener("notificationReceived", (event) => {
    console.info("[push] received (foreground):", event.notification?.title);
  });

  await FirebaseMessaging.addListener("notificationActionPerformed", (event) => {
    handleNotificationTap(event.notification);
  });
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
  const { token } = await FirebaseMessaging.getToken();
  if (token) await postTokenToBackend(token, authToken);
}

/**
 * Register FCM token on native Android/iOS. No-op on web.
 * Prompts for permission when not yet granted — use from Profile → Enable push alerts.
 */
export async function setupPushNotifications(authToken) {
  if (!authToken) return { granted: false, registered: false, reason: "no_auth" };
  currentAuthToken = authToken;

  if (!Capacitor.isNativePlatform()) {
    console.info("[push] web browser — use native app for push (see IOS_PUSH_SETUP.md)");
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

  let token;
  try {
    ({ token } = await FirebaseMessaging.getToken());
  } catch (err) {
    console.warn("[push] getToken failed:", err?.message || err);
    return { granted: true, registered: false, reason: "token_failed", detail: err?.message };
  }

  if (!token) {
    return { granted: true, registered: false, reason: "no_token" };
  }

  const result = await postTokenToBackend(token, authToken);
  return {
    granted: true,
    registered: result.ok,
    reason: result.ok ? "ok" : "register_failed",
    detail: result.error,
  };
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
