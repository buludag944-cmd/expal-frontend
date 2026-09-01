import React, { useState } from "react";
import { useAuth } from "../AuthContext";
import { isGoogleAuthConfigured } from "../lib/firebaseApp";
import {
  formatGoogleSignInError,
  signInWithGoogleForBackend,
} from "../lib/googleSignIn";
import Button from "./ui/Button";

export default function GoogleSignInButton({ onError, disabled }) {
  const { loginWithGoogle } = useAuth();
  const [busy, setBusy] = useState(false);

  if (!isGoogleAuthConfigured()) return null;

  const handleClick = async () => {
    setBusy(true);
    try {
      const idToken = await signInWithGoogleForBackend();

      const loginResult = await loginWithGoogle(idToken);
      if (!loginResult.success) {
        onError?.(loginResult.error || "Google sign-in failed.");
      }
    } catch (err) {
      const code = err && err.code;
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
        return;
      }
      if (code === "auth/popup-blocked") {
        onError?.("Popup blocked. Allow popups for this site, or try Chrome on desktop.");
        return;
      }
      onError?.(formatGoogleSignInError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      type="button"
      variant="secondary"
      className="w-full border border-border bg-card text-foreground"
      onClick={handleClick}
      loading={busy}
      disabled={disabled || busy}
    >
      Continue with Google
    </Button>
  );
}
