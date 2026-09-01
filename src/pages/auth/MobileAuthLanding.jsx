import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../AuthContext";
import { useGoogleAuthAction } from "./useGoogleAuthAction";
import "../../styles/auth-landing.css";

/** Mobile sign-in — same layout as 1.2.7 / 1.2.9 (Google only). */
export default function MobileAuthLanding() {
  const { authNotice } = useAuth();
  const { busy, error, signInWithGoogle, googleConfigured } = useGoogleAuthAction();

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
          <p className="auth-landing-footer" style={{ color: "#a32d2d", marginTop: 12 }}>
            Google sign-in is not configured in this build. Install the latest version from Google Play.
          </p>
        )}

        <p className="auth-landing-footer">
          By continuing you agree to our{" "}
          <Link to="/privacy">Privacy Policy</Link>. Expal is free — always.
        </p>
      </div>
    </div>
  );
}
