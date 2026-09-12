import { Capacitor } from "@capacitor/core";

/** Official Apple mark for Sign in with Apple button (HIG). */
export function AppleLogoMark({ size = 18, color = "#fff" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill={color}
        d="M16.365 1.43c0 1.14-.415 2.2-1.207 3.02-.84.88-2.22 1.56-3.39 1.47-.15-1.1.43-2.27 1.2-3.06.85-.9 2.32-1.56 3.4-1.43zM20.7 17.3c-.56 1.3-.83 1.88-1.55 3.03-1.01 1.6-2.43 3.59-4.2 3.61-1.57.02-1.98-1.03-4.13-1.02-2.14.01-2.6 1.04-4.17 1.02-1.77-.02-3.13-1.82-4.14-3.41C.9 17.4-.4 12.7 1.4 9.4c1.15-2.1 2.97-3.33 4.68-3.33 1.74 0 2.83 1.07 4.27 1.07 1.4 0 2.25-1.08 4.26-1.08 1.52 0 3.13.83 4.27 2.26-3.75 2.06-3.14 7.42.82 9.0z"
      />
    </svg>
  );
}

export function isAppleSignInAvailable() {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios";
}

export function formatAppleSignInError(err) {
  const msg = String(err?.message || err || "");
  const code = String(err?.code || "");
  const blob = `${code} ${msg}`.toLowerCase();
  if (/cancel|1001|errsecusercanceled/i.test(blob)) {
    return "Sign in with Apple was cancelled.";
  }
  if (/not.?available|unsupported/i.test(blob)) {
    return "Sign in with Apple is not available on this device.";
  }
  if (/network|offline/i.test(blob)) {
    return "Network error during Sign in with Apple. Check your connection and try again.";
  }
  return msg || "Sign in with Apple failed.";
}

function splitDisplayName(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

function nameFromAppleResult(result) {
  const profile = result?.additionalUserInfo?.profile || {};
  const nested = profile.name || profile.fullName || {};
  const given =
    nested.givenName ||
    nested.firstName ||
    profile.given_name ||
    profile.givenName ||
    "";
  const family =
    nested.familyName ||
    nested.lastName ||
    profile.family_name ||
    profile.familyName ||
    "";
  if (given || family) {
    return { firstName: String(given).trim(), lastName: String(family).trim() };
  }
  return splitDisplayName(result?.user?.displayName || "");
}

/**
 * Native Sign in with Apple → Firebase Auth ID token for our backend.
 * Uses @capacitor-firebase/authentication (Capacitor), not React Native packages.
 */
export async function signInWithAppleForBackend() {
  if (!isAppleSignInAvailable()) {
    throw new Error("Sign in with Apple is only available in the iOS app.");
  }
  if (!Capacitor.isPluginAvailable("FirebaseAuthentication")) {
    throw new Error(
      "Sign in with Apple is not available in this build. Install the latest TestFlight version."
    );
  }

  const { FirebaseAuthentication } = await import("@capacitor-firebase/authentication");

  // Native Firebase Auth (same pattern as Google). Scopes: name + email only.
  const result = await FirebaseAuthentication.signInWithApple({
    scopes: ["email", "name"],
    skipNativeAuth: false,
  });

  const name = nameFromAppleResult(result);

  // Prefer native Firebase ID token (correct aud for Admin verifyIdToken).
  try {
    const { token } = await FirebaseAuthentication.getIdToken({ forceRefresh: true });
    if (token) {
      return { idToken: token, ...name, appleUserId: result?.user?.id || null };
    }
  } catch {
    /* fall through to JS OAuth exchange */
  }

  // Fallback: exchange Apple credential via Firebase JS SDK (needs nonce).
  const idToken = result?.credential?.idToken;
  const rawNonce = result?.credential?.nonce;
  if (!idToken) {
    throw new Error("Sign in with Apple did not return a token.");
  }

  const { getFirebaseAuth } = await import("./firebaseApp");
  const { signInWithCredential, OAuthProvider } = await import("firebase/auth");
  const fb = getFirebaseAuth();
  if (!fb) throw new Error("Firebase Auth is not configured.");

  const provider = new OAuthProvider("apple.com");
  const credential = provider.credential({
    idToken,
    rawNonce: rawNonce || undefined,
  });
  const userCred = await signInWithCredential(fb.auth, credential);
  const firebaseToken = await userCred.user.getIdToken(true);
  return {
    idToken: firebaseToken,
    ...name,
    appleUserId: userCred.user.uid || result?.user?.id || null,
  };
}
