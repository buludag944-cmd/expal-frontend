import { getApiBaseUrl } from "../apiConfig";

const API = getApiBaseUrl();

export async function fetchSearch(token, query) {
  const q = String(query || "").trim();
  if (!q) {
    return { query: "", members: [], threads: [] };
  }
  const res = await fetch(`${API}/api/search?q=${encodeURIComponent(q)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Search failed (${res.status})`);
  }
  return {
    query: data.query || q,
    members: Array.isArray(data.members) ? data.members : [],
    threads: Array.isArray(data.threads) ? data.threads : [],
  };
}
