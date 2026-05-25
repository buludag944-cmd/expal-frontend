/**
 * POST /api/auth/resend-verification — shared by login and verify pages.
 */
export async function resendVerification(API, email) {
  const trimmed = (email || "").trim().toLowerCase();
  if (!trimmed) {
    throw new Error("Enter your email to resend verification.");
  }

  const base = (API || "").replace(/\/$/, "");
  console.info("[resend] preparing", { email: trimmed, api: base });

  const res = await fetch(`${base}/api/auth/resend-verification`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: trimmed }),
  });

  console.info("[resend] POST /api/auth/resend-verification sent");

  const data = await res.json().catch(() => ({}));
  if (res.ok) {
    return data.message || "Verification email resent.";
  }
  const detail = data.error || data.message || res.statusText || "Request failed";
  throw new Error(`${detail} (${res.status})`);
}
