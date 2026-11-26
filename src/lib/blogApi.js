import { getApiBaseUrl } from "../apiConfig";

const API = getApiBaseUrl();

// Articles written as files in content/blog/ are built into /blog-data/posts.json
// (see scripts/blog/). They are merged with posts from the API (in-app admin).
// A file-based article wins if both use the same slug.
let staticPostsPromise = null;

export function fetchStaticPosts() {
  if (!staticPostsPromise) {
    const base = (process.env.PUBLIC_URL || "").replace(/\/$/, "");
    staticPostsPromise = fetch(`${base}/blog-data/posts.json`, { cache: "no-cache" })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => (Array.isArray(data) ? data : []))
      .catch(() => []);
  }
  return staticPostsPromise;
}

async function fetchApiPosts(limit) {
  const q = limit ? `?limit=${limit}` : "";
  const res = await fetch(`${API}/api/blog${q}`);
  if (!res.ok) throw new Error(`Blog list failed (${res.status})`);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export function mergePosts(staticPosts, apiPosts) {
  const slugs = new Set(staticPosts.map((p) => p.slug));
  return [...staticPosts, ...apiPosts.filter((p) => !slugs.has(p.slug))].sort((a, b) =>
    String(b.publishedAt || "").localeCompare(String(a.publishedAt || ""))
  );
}

export async function fetchPublishedPosts(limit) {
  const [staticResult, apiResult] = await Promise.allSettled([fetchStaticPosts(), fetchApiPosts(limit)]);
  const staticPosts = staticResult.status === "fulfilled" ? staticResult.value : [];
  const apiPosts = apiResult.status === "fulfilled" ? apiResult.value : [];
  if (!staticPosts.length && apiResult.status === "rejected") throw apiResult.reason;
  const merged = mergePosts(staticPosts, apiPosts);
  return limit ? merged.slice(0, limit) : merged;
}

export async function fetchPostBySlug(slug) {
  const staticPost = (await fetchStaticPosts()).find((p) => p.slug === slug);
  if (staticPost) return staticPost;
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
