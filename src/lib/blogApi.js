import { getApiBaseUrl } from "../apiConfig";

const API = getApiBaseUrl();

export async function fetchPublishedPosts(limit) {
  const q = limit ? `?limit=${limit}` : "";
  const res = await fetch(`${API}/api/blog${q}`);
  if (!res.ok) throw new Error(`Blog list failed (${res.status})`);
  return res.json();
}

export async function fetchPostBySlug(slug) {
  const res = await fetch(`${API}/api/blog/${encodeURIComponent(slug)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Blog post failed (${res.status})`);
  return res.json();
}

export async function fetchAdminPosts(token) {
  const res = await fetch(`${API}/api/blog/admin/all`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Admin blog list failed (${res.status})`);
  return res.json();
}

export async function createBlogPost(token, payload) {
  const res = await fetch(`${API}/api/blog`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Create failed (${res.status})`);
  return data;
}

export async function updateBlogPost(token, id, payload) {
  const res = await fetch(`${API}/api/blog/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Update failed (${res.status})`);
  return data;
}

export async function deleteBlogPost(token, id) {
  const res = await fetch(`${API}/api/blog/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok && res.status !== 204) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Delete failed (${res.status})`);
  }
}
