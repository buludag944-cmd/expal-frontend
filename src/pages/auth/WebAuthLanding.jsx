import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppLogo from "../../components/AppLogo";
import PublicSiteHeader from "../../components/PublicSiteHeader";
import Seo from "../../components/Seo";
import { useAuth } from "../../AuthContext";
import { useGoogleAuthAction } from "./useGoogleAuthAction";
import EmailAuthForms from "./EmailAuthForms";
import { fetchPublishedPosts } from "../../lib/blogApi";
import "../../styles/auth-landing.css";
import "../../styles/public-marketing.css";

const FEATURES = [
  { icon: "🏠", label: "Housing & referrals" },
  { icon: "📋", label: "Visa & IRP tracking" },
  { icon: "💬", label: "Expat community" },
  { icon: "⚖️", label: "Employment rights" },
];

function formatDate(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

export default function WebAuthLanding() {
  const { authNotice } = useAuth();
  const { busy, error, signInWithGoogle, googleConfigured } = useGoogleAuthAction();
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    let cancelled = false;
    fetchPublishedPosts(6)
      .then((data) => {
        if (!cancelled) setPosts(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        /* landing works without blog API */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (window.location.hash === "#sign-in") {
      document.getElementById("sign-in")?.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  return (
    <div className="auth-web-marketing">
      <Seo
        title="Your friend away from home"
        description="EXPal helps expats relocate smarter — housing, visa guidance, community, and employment support. Sign in free with Google or email."
        path="/"
      />
      <PublicSiteHeader variant="light" signInTo="#sign-in" />

      <div className="landing-features" id="features">
        <p className="landing-features-intro">
          EXPal is free. Sign in to access housing, visa tracking, community, and employment support
          in one place.
        </p>
        <div className="landing-feature-grid">
          <div className="landing-feature-card">
            <h3>Housing with expat-friendly filters</h3>
            <p>Find rooms and homes from people who understand expat needs.</p>
          </div>
          <div className="landing-feature-card">
            <h3>Visa &amp; IRP tracking</h3>
            <p>Pathways and reminders for Stamp journeys without the panic spiral.</p>
          </div>
          <div className="landing-feature-card">
            <h3>Community &amp; local know-how</h3>
            <p>Events, threads, and lived advice from people already settled.</p>
          </div>
          <div className="landing-feature-card">
            <h3>Referrals that actually open doors</h3>
            <p>Warm introductions to people inside companies — borrowed trust, used well.</p>
          </div>
        </div>
      </div>

      <section className="landing-blog-section" id="blog" aria-labelledby="landing-blog-heading">
        <div className="landing-blog-inner">
          <p className="landing-blog-kicker">From the EXPal Journal</p>
          <h2 id="landing-blog-heading">Latest articles</h2>
          <p className="landing-blog-lead">
            Practical guides for life abroad. Tap any card to read the full article — no login
            required.
          </p>

          {posts.length > 0 ? (
            <div className="blog-card-grid">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  to={`/blog/${post.slug}`}
                  className="blog-card blog-card-linkable"
                >
                  <p className="blog-card-meta">{formatDate(post.publishedAt)}</p>
                  <h3 className="blog-card-title">{post.title}</h3>
                  <p className="blog-card-excerpt">{post.excerpt}</p>
                  {Array.isArray(post.tags) && post.tags.length > 0 && (
                    <div className="blog-tag-row">
                      {post.tags.map((tag) => (
                        <span key={tag} className="blog-tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <span className="blog-card-cta">Read article →</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="public-muted">
              No published articles yet. After you publish from Admin → Blog (SEO), they will show
              here automatically.
            </p>
          )}

          <Link to="/blog" className="landing-blog-link-all">
            View all articles →
          </Link>
        </div>
      </section>

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

        <section className="auth-web-panel" id="sign-in">
          <div className="auth-web-card">
            <h2>Welcome</h2>
            <p className="auth-web-muted">
              Sign in with Google or create an account with your email.
            </p>

            {authNotice && (
              <div className="auth-landing-notice !text-[#5c4033] !bg-amber-50 mb-3">
                {authNotice}
              </div>
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
              <p className="text-sm text-amber-700 mt-3 mb-2">
                Google sign-in is not configured. Check Firebase env vars on this deploy.
              </p>
            )}

            <div className="auth-web-divider">
              <span className="auth-web-divider-line" />
              <span className="auth-web-divider-text">or</span>
              <span className="auth-web-divider-line" />
            </div>

            <EmailAuthForms variant="web" />

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
    </div>
  );
}
