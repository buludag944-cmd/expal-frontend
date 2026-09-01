import { getApiBaseUrl } from "../apiConfig";

const API = getApiBaseUrl();

function authHeaders(token) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function fetchNotifications(token, { limit = 40, offset = 0 } = {}) {
  const res = await fetch(`${API}/api/notifications?limit=${limit}&offset=${offset}`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error("Could not load notifications");
  return res.json();
}

export async function fetchUnreadNotificationCount(token) {
  const res = await fetch(`${API}/api/notifications/unread-count`, {
    headers: authHeaders(token),
  });
  if (!res.ok) return 0;
  const data = await res.json();
  return Number(data.count) || 0;
}

export async function markNotificationRead(token, id) {
  const res = await fetch(`${API}/api/notifications/${id}/read`, {
    method: "PATCH",
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error("Could not mark as read");
  return res.json();
}

export async function markAllNotificationsRead(token) {
  const res = await fetch(`${API}/api/notifications/read-all`, {
    method: "POST",
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error("Could not mark all as read");
  return res.json();
}

export async function markMessageNotificationsRead(token, peerId) {
  const res = await fetch(`${API}/api/notifications/read-messages`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ peerId }),
  });
  if (!res.ok) return { updated: 0 };
  return res.json();
}

export function notificationPath(n) {
  const data = n?.data || {};
  if (data.path) return data.path;
  if (data.type === "message" && data.peerId) return `/messages?user=${data.peerId}`;
  if (data.type === "forum_thread" && data.threadId) return `/community/thread/${data.threadId}`;
  if (data.type === "visa_task") return "/journey";
  return "/notifications";
}
