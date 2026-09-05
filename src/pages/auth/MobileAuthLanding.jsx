import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../AuthContext";
import { useGoogleAuthAction } from "./useGoogleAuthAction";
import EmailAuthForms from "./EmailAuthForms";
import "../../styles/auth-landing.css";

/** Mobile sign-in — Google + email create account / sign in. */
export default function MobileAuthLanding() {
  const { authNotice } = useAuth();
  const { busy, error, signInWithGoogle, googleConfigured } = useGoogleAuthAction();
  const [emailMode, setEmailMode] = useState(null); // null | "signin" | "signup"

  useEffect(() => {
    document.documentElement.classList.add("auth-native-shell");
    document.body.classList.add("auth-native-shell");
    return () => {
      document.documentElement.classList.remove("auth-native-shell");
      document.body.classList.remove("auth-native-shell");
    };
  }, []);

  return (
    <div className="auth-landing-root">
      <div className="auth-landing-blob auth-landing-blob-1" aria-hidden />
      <div className="auth-landing-blob auth-landing-blob-2" aria-hidden />

      <div className="auth-landing-inner">
        <h1 className="auth-landing-logo-text">
          EX<span>Pal</span>
        </h1>
        <p className="auth-landing-tagline">Your friend away from home</p>

        <div className="auth-landing-circle">
          <span className="auth-landing-circle-emoji" aria-hidden>
            🧳
          </span>
          <span className="auth-landing-circle-label">Start your journey</span>
        </div>

        <h2 className="auth-landing-headline">
          Relocate smarter.
          <br />
          Settle faster.
          <br />
          Thrive longer.
        </h2>
        <p className="auth-landing-sub">
          Everything you need for life in a new country — in one app.
        </p>

        {authNotice && <div className="auth-landing-notice">{authNotice}</div>}
        {error && <div className="auth-landing-error">{error}</div>}

        <button
          type="button"
          className="auth-landing-social-btn"
          style={{ marginTop: "0.5rem" }}
          disabled={busy || !googleConfigured}
          onClick={() => signInWithGoogle()}
        >
          <span className="auth-landing-social-icon">G</span>
          {busy ? "Signing in…" : "Continue with Google"}
        </button>

        {!googleConfigured && (
          <p className="auth-landing-footer" style={{ color: "#ffc9c9", marginTop: 12 }}>
            Google sign-in is not configured in this build. Install the latest TestFlight or Play
            Store version.
          </p>
        )}

        {emailMode == null ? (
          <div className="auth-landing-email-actions">
            <button
              type="button"
              className="auth-landing-btn-secondary"
              onClick={() => setEmailMode("signin")}
            >
              Sign in with email
            </button>
            <button
              type="button"
              className="auth-landing-btn-secondary"
              onClick={() => setEmailMode("signup")}
            >
              Create account
            </button>
          </div>
        ) : (
          <>
            <div className="auth-landing-divider">
              <span className="auth-landing-divider-line" />
              <span className="auth-landing-divider-text">
                {emailMode === "signup" ? "create account" : "email sign in"}
              </span>
              <span className="auth-landing-divider-line" />
            </div>
            <EmailAuthForms key={emailMode} variant="mobile" initialMode={emailMode} />
            <button
              type="button"
              className="auth-landing-text-link"
              style={{ marginTop: 8, background: "none", border: "none", cursor: "pointer" }}
              onClick={() => setEmailMode(null)}
            >
              Back
            </button>
          </>
        )}

        <p className="auth-landing-footer">
          By continuing you agree to our <Link to="/privacy">Privacy Policy</Link>. Expal is free —
          always.
        </p>
      </div>
    </div>
  );
}
