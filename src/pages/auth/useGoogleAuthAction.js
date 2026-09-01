import { useCallback, useState } from "react";
import { useAuth } from "../../AuthContext";
import { isGoogleAuthConfigured } from "../../lib/firebaseApp";
import { formatGoogleSignInError, signInWithGoogleForBackend } from "../../lib/googleSignIn";
import { isNativeApp } from "../../lib/platform";

export function useGoogleAuthAction() {
  const { loginWithGoogle } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const signInWithGoogle = useCallback(async () => {
    if (!isGoogleAuthConfigured()) {
      setError("Google sign-in is not configured for this build.");
      return false;
    }
    if (isNativeApp()) {
      const { Capacitor } = await import("@capacitor/core");
      if (!Capacitor.isPluginAvailable("FirebaseAuthentication")) {
        setError(
          "Google Sign-In is not available in this app build. Install the latest version from Google Play."
        );
        return false;
      }
    }
    setBusy(true);
    setError("");
    try {
      const idToken = await signInWithGoogleForBackend();
      const loginResult = await loginWithGoogle(idToken);
      if (!loginResult.success) {
        setError(loginResult.error || "Google sign-in failed.");
        return false;
      }
      return true;
    } catch (err) {
      const code = err && err.code;
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
        return false;
      }
      if (code === "auth/popup-blocked") {
        setError("Popup blocked. Allow popups for this site, or try Chrome.");
        return false;
      }
      setError(formatGoogleSignInError(err));
      return false;
    } finally {
      setBusy(false);
    }
  }, [loginWithGoogle]);

  return { busy, error, setError, signInWithGoogle, googleConfigured: isGoogleAuthConfigured() };
}
