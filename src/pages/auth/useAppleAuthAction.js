import { useCallback, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { useAuth } from "../../AuthContext";
import {
  formatAppleSignInError,
  isAppleSignInAvailable,
  signInWithAppleForBackend,
} from "../../lib/appleSignIn";

/**
 * Sign in with Apple — iOS App Store Guideline 4.8 (alongside Google).
 */
export function useAppleAuthAction() {
  const { loginWithApple } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const available = isAppleSignInAvailable();

  const signInWithApple = useCallback(async () => {
    if (!available) {
      setError("Sign in with Apple is only available on iPhone/iPad.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      if (!Capacitor.isPluginAvailable("FirebaseAuthentication")) {
        setError("Sign in with Apple is not available in this build. Update from TestFlight.");
        return;
      }
      const { idToken, firstName, lastName, appleUserId } = await signInWithAppleForBackend();
      const loginResult = await loginWithApple(idToken, { firstName, lastName, appleUserId });
      if (!loginResult.success) {
        setError(loginResult.error || "Sign in with Apple failed.");
      }
    } catch (err) {
      setError(formatAppleSignInError(err));
    } finally {
      setBusy(false);
    }
  }, [available, loginWithApple]);

  return { busy, error, setError, signInWithApple, appleAvailable: available };
}
