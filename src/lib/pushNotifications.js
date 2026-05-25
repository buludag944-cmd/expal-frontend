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
    console.warn("[push] register failed:", data.error || res.status);
    return false;
  }
  console.info("[push] device registered with backend");
  return true;
}

function handleNotificationTap(notification) {
  const raw = notification?.data;
  const data =
    raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  if (data.type === "message" && data.peerId) {
    window.location.href = `/messages?user=${encodeURIComponent(data.peerId)}`;
    return;
  }
  if (data.type === "comment" && data.path) {
    window.location.href = data.path.startsWith("/") ? data.path : `/${data.path}`;
  }
}

/**
 * Register FCM token on native Android/iOS. No-op on web.
 * Uses @capacitor-firebase/messaging so iOS tokens work with Firebase Admin on Render.
 */
export async function setupPushNotifications(authToken) {
  if (!authToken) return;
  currentAuthToken = authToken;

  if (!Capacitor.isNativePlatform()) {
    console.info("[push] web browser — use native app for push (see IOS_PUSH_SETUP.md)");
    return;
  }

  if (!listenersAttached) {
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

  let perm = await FirebaseMessaging.checkPermissions();
  if (perm.receive !== "granted") {
    perm = await FirebaseMessaging.requestPermissions();
  }
  if (perm.receive !== "granted") {
    console.warn("[push] notification permission denied");
    return;
  }

  const { token } = await FirebaseMessaging.getToken();
  if (token) {
    await postTokenToBackend(token, authToken);
  }
}

export async function unregisterPushDevice(authToken, fcmToken) {
  if (!authToken) return;
  currentAuthToken = null;
  try {
    await FirebaseMessaging.deleteToken();
  } catch {
    /* ignore */
  }
  if (!fcmToken) return;
  const API = getApiBaseUrl();
  await fetch(`${API}/api/push/unregister`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({ token: fcmToken }),
  }).catch(() => {});
}
