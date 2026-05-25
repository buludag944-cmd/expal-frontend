/**
 * Shared health probe — accepts JSON { ok: true } or plain HTTP 200.
 */
export async function checkApiHealthPermissive(apiBase, timeoutMs = 4000) {
  const root = apiBase.replace(/\/$/, "");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${root}/health`, { signal: controller.signal });
    if (!res.ok) return false;
    const text = await res.text();
    if (text.includes('"ok":true') || text.trim() === "OK") return true;
    try {
      const data = JSON.parse(text);
      return data && data.ok === true;
    } catch {
      return false;
    }
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}
