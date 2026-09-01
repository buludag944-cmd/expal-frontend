import React from "react";
import { Link } from "react-router-dom";
import AppLogo from "../../components/AppLogo";
import { useAuth } from "../../AuthContext";
import { useGoogleAuthAction } from "./useGoogleAuthAction";
import "../../styles/auth-landing.css";

const FEATURES = [
  { icon: "🏠", label: "Housing & referrals" },
  { icon: "📋", label: "Visa & IRP tracking" },
  { icon: "💬", label: "Expat community" },
  { icon: "⚖️", label: "Employment rights" },
];

export default function WebAuthLanding() {
  const { authNotice } = useAuth();
  const { busy, error, signInWithGoogle, googleConfigured } = useGoogleAuthAction();

  return (
    <div className="auth-web-root">
      <section className="auth-web-hero">
        <div className="auth-landing-blob auth-landing-blob-1" aria-hidden />
        <div className="auth-landing-blob auth-landing-blob-2" aria-hidden />
        <div className="auth-web-hero-inner">
          <div className="flex items-center gap-3 mb-6">
            <AppLogo size={56} variant="header" />
            <div>
              <h1 className="auth-landing-logo-text m-0 text-[1.75rem]">
                EX<span>Pal</span>
              </h1>
              <p className="auth-landing-tagline m-0 mt-1">Your friend away from home</p>
            </div>
          </div>

          <h2 className="auth-landing-headline text-left max-w-none">
            Relocate smarter.
            <br />
            Settle faster.
            <br />
            Thrive longer.
          </h2>
          <p className="auth-landing-sub text-left max-w-md mx-0">
            Everything you need for life in a new country — housing, visa guidance, community, and
            employment support in one place.
          </p>

          <div className="auth-web-features">
            {FEATURES.map(({ icon, label }) => (
              <div key={label} className="auth-web-feature">
                {icon} {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="auth-web-panel">
        <div className="auth-web-card">
          <h2>Welcome back</h2>
          <p className="auth-web-muted">Sign in with your Google account to access Expal.</p>

          {authNotice && (
            <div className="auth-landing-notice !text-[#5c4033] !bg-amber-50 mb-3">{authNotice}</div>
          )}
          {error && (
            <div className="auth-landing-error !text-red-800 !bg-red-50 mb-3">{error}</div>
          )}

          <button
            type="button"
            className="auth-landing-social-btn !bg-white !text-gray-800 !border-gray-200 shadow-sm"
            disabled={busy || !googleConfigured}
            onClick={() => signInWithGoogle()}
          >
            <span className="auth-landing-social-icon">G</span>
            {busy ? "Signing in…" : "Continue with Google"}
          </button>

          {!googleConfigured && (
            <p className="text-sm text-amber-700 mt-3">
              Google sign-in is not configured. Check Firebase env vars on this deploy.
            </p>
          )}

          <p className="text-xs text-gray-500 mt-6 leading-relaxed">
            By continuing you agree to our{" "}
            <Link to="/privacy" className="text-primary underline">
              Privacy Policy
            </Link>
            . Expal is free — always.
          </p>
        </div>
      </section>
    </div>
  );
}
