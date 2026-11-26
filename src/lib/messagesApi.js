import { getApiBaseUrl } from "../apiConfig";

const API = getApiBaseUrl();

async function call(token, path, options) {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(options?.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 404 || res.status === 405) {
    const err = new Error("Editing and deleting messages isn't available yet. Please try again after the next update.");
    err.unsupported = true;
    throw err;
  }
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

/** PATCH /api/messages/:id { content } → updated message (sender only). */
export function editMessage(token, id, content) {
  return call(token, `/api/messages/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ content }),
  });
}

/** DELETE /api/messages/:id → { id, deletedAt } (sender only, soft delete). */
export function deleteMessage(token, id) {
  return call(token, `/api/messages/${encodeURIComponent(id)}`, { method: "DELETE" });
}
