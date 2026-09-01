/** Strip cryptic Google / Play Services codes like ":7" or "10:" from display. */
function looksLikeRawStatusCode(text) {
  const t = String(text || "").trim();
  return (
    !t ||
    /^:?\d{1,5}:?$/.test(t) ||
    /^error:?\s*\d{1,5}$/i.test(t) ||
    /^status.?code:?\s*\d{1,5}$/i.test(t) ||
    /^commonstatuscodes\.\w+$/i.test(t)
  );
}

function extractStatusCode(err) {
  const code = String(err?.code ?? "").trim();
  const msg = String(err?.message || err || "");
  if (/^\d+$/.test(code)) return code;
  const fromMsg = msg.match(/(?:^|[^\d])(\d{1,5})(?:[^\d]|$)/);
  if (fromMsg && looksLikeRawStatusCode(msg)) return fromMsg[1];
  // Capacitor sometimes surfaces ":7" or "7:" alone
  const bare = msg.match(/^:?(\d{1,5}):?$/);
  if (bare) return bare[1];
  return code.replace(/[^\d]/g, "") || "";
}

/** Map native Google Sign-In failures to actionable messages (especially SHA-1 / Play signing). */
export function formatGoogleSignInError(err) {
  const code = String(err?.code ?? "");
  const msg = String(err?.message || err || "");
  const status = extractStatusCode(err);
  const blob = `${code} ${msg} ${status}`.toLowerCase();

  // Google Play Services CommonStatusCodes / GoogleSignInStatusCodes
  // 7 = NETWORK_ERROR, 8 = INTERNAL_ERROR, 10 = DEVELOPER_ERROR, 12500 = SIGN_IN_FAILED, 12501 = CANCELLED
  if (
    status === "10" ||
    code === "10" ||
    /developer_error|error.?10|invalid.?audience|oauth.*client/i.test(blob)
  ) {
    return (
      "Google sign-in is not authorized for this app build. " +
      "If you installed from Play Store: in Play Console → App integrity → App signing key certificate, " +
      "copy SHA-1, add it in Firebase (expalapp-a6422 → Android com.yourbrand.expal), " +
      "download a new google-services.json, then upload a new app version."
    );
  }
  if (status === "12501" || code === "12501" || /cancel/i.test(msg)) {
    return "Google sign-in was cancelled.";
  }
  if (
    status === "7" ||
    code === "7" ||
    /network|timeout|unavailable|connection/i.test(blob)
  ) {
    return (
      "Network error during Google sign-in (code 7). " +
      "Check Wi‑Fi/mobile data, disable VPN if on, wait a few seconds (server may be waking up), then try again."
    );
  }
  if (status === "8" || code === "8" || /internal.?error/i.test(blob)) {
    return "Google Play services had an internal error. Update Google Play services and try again.";
  }
  if (status === "12500" || code === "12500" || /sign.?in.?failed/i.test(blob)) {
    return "Google sign-in failed. Update the app from Play Store and Google Play services, then try again.";
  }
  if (/sessionstorage|redirect|missing initial state|storage-partitioned/i.test(blob)) {
    return (
      "Google sign-in opened in the browser but could not return to the app. " +
      "Update to the latest Play Store version (uses native Google Sign-In, not browser redirect)."
    );
  }
  if (/credential|provider dependencies/i.test(blob)) {
    return "Google sign-in failed (device credentials). Try again or update Google Play services.";
  }
  if (looksLikeRawStatusCode(msg) || looksLikeRawStatusCode(code)) {
    return `Google sign-in failed${status ? ` (code ${status})` : ""}. Check your connection and try again.`;
  }
  return msg || "Google sign-in failed.";
}

function decodeJwtPayload(token) {
  const part = token.split(".")[1];
  if (!part) return null;
  const json = atob(part.replace(/-/g, "+").replace(/_/g, "/"));
  return JSON.parse(json);
}

/** Firebase Auth JWT has aud = project id, not *.googleusercontent.com */
export function isFirebaseAuthIdToken(token) {
  try {
    const payload = decodeJwtPayload(token);
    const aud = String(payload?.aud || "");
    if (!aud) return false;
    return !aud.includes("googleusercontent.com");
  } catch {
    return false;
  }
}

export { isNativeApp as isNativeGoogleSignIn } from "./platform";

async function assertFirebaseAuthPlugin() {
  const { Capacitor } = await import("@capacitor/core");
  const platform = Capacitor.getPlatform();
  if (platform !== "android" && platform !== "ios") return;
  if (!Capacitor.isPluginAvailable("FirebaseAuthentication")) {
    throw new Error(
      "Google Sign-In is not available in this app build. Install the latest version from Google Play " +
        "(or rebuild with @capacitor-firebase/authentication and run cap sync android)."
    );
  }
}

/** Native Google sign-in → Firebase Auth ID token for backend. */
export async function signInWithGoogleNative() {
  await assertFirebaseAuthPlugin();
  const { FirebaseAuthentication } = await import("@capacitor-firebase/authentication");

  const run = (useCredentialManager) =>
    FirebaseAuthentication.signInWithGoogle({ useCredentialManager });

  let result;
  let lastErr;
  for (const useCredentialManager of [true, false]) {
    try {
      result = await run(useCredentialManager);
      lastErr = null;
      break;
    } catch (err) {
      lastErr = err;
      const msg = String(err?.message || err || "");
      const status = extractStatusCode(err);
      const retryCred =
        useCredentialManager &&
        (/credential|provider dependencies/i.test(msg) ||
          /developer_error|error.?10/i.test(msg) ||
          status === "10");
      // Code 7 = NETWORK_ERROR: retry without Credential Manager
      const retryNetwork =
        useCredentialManager &&
        (status === "7" || looksLikeRawStatusCode(msg) || /network/i.test(msg));
      if (!retryCred && !retryNetwork) break;
      if (retryNetwork) {
        await new Promise((r) => setTimeout(r, 1200));
      }
    }
  }
  // Final delayed retry for bare ":7" / NETWORK_ERROR after both paths failed
  if (lastErr) {
    const status = extractStatusCode(lastErr);
    const msg = String(lastErr?.message || lastErr || "");
    if (status === "7" || looksLikeRawStatusCode(msg) || /network/i.test(msg)) {
      await new Promise((r) => setTimeout(r, 1500));
      try {
        result = await run(false);
        lastErr = null;
      } catch (err) {
        lastErr = err;
      }
    }
  }
  if (lastErr) throw lastErr;

  const googleIdToken = result?.credential?.idToken;
  const googleAccessToken = result?.credential?.accessToken;

  // 1) Native Firebase SDK token (correct aud)
  try {
    const { token } = await FirebaseAuthentication.getIdToken({ forceRefresh: true });
    if (token && isFirebaseAuthIdToken(token)) {
      return token;
    }
  } catch {
    /* try JS exchange below */
  }

  // 2) Exchange Google OAuth tokens → Firebase session in JS, then Firebase JWT
  if (googleIdToken) {
    const { getFirebaseAuth } = await import("./firebaseApp");
    const { signInWithCredential, GoogleAuthProvider } = await import("firebase/auth");
    const fb = getFirebaseAuth();
    if (!fb) throw new Error("Google sign-in is not configured.");
    const credential = GoogleAuthProvider.credential(
      googleIdToken,
      googleAccessToken || undefined
    );
    const userCred = await signInWithCredential(fb.auth, credential);
    const firebaseToken = await userCred.user.getIdToken(true);
    if (firebaseToken && isFirebaseAuthIdToken(firebaseToken)) {
      return firebaseToken;
    }
    return firebaseToken;
  }

  throw new Error("Google sign-in did not return a token.");
}

/** Web Google sign-in — popup only (never redirect; WebView cannot complete redirect flows). */
export async function signInWithGoogleWeb() {
  const { isNativeApp } = await import("./platform");
  if (isNativeApp()) {
    throw new Error(
      "Web Google sign-in is not available inside the native app. Use native Google Sign-In instead."
    );
  }
  const { getFirebaseAuth } = await import("./firebaseApp");
  const { signInWithPopup } = await import("firebase/auth");
  const fb = getFirebaseAuth();
  if (!fb) {
    throw new Error("Google sign-in is not configured.");
  }
  const result = await signInWithPopup(fb.auth, fb.googleProvider);
  return result.user.getIdToken();
}

/** Returns whichever token the backend accepts (Firebase JWT preferred). */
export async function signInWithGoogleForBackend() {
  const { isNativeApp } = await import("./platform");
  if (isNativeApp()) {
    return signInWithGoogleNative();
  }
  return signInWithGoogleWeb();
}
