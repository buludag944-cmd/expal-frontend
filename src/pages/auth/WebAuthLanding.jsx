import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppLogo from "../../components/AppLogo";
import Seo from "../../components/Seo";
import { useAuth } from "../../AuthContext";
import { useGoogleAuthAction } from "./useGoogleAuthAction";
import EmailAuthForms from "./EmailAuthForms";
import { fetchPublishedPosts } from "../../lib/blogApi";
import "../../styles/auth-landing.css";
import "../../styles/public-marketing.css";

const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.yourbrand.expal";
const APP_STORE_URL =
  "https://apps.apple.com/app/expal-app-ireland-expat-guide/id6807468477";

const FEATURE_TILES = [
  {
    icon: "🏠",
    title: "Housing that's actually affordable",
    body: "Browse rooms and flats with expat-friendly filters — deposits, bills, and what to ask before you pay.",
  },
  {
    icon: "🎉",
    title: "Community events",
    body: "Find meetups and local gatherings so settling in doesn't mean starting from zero socially.",
  },
  {
    icon: "🤝",
    title: "Locals network",
    body: "Warm introductions and referrals from people already inside companies and communities.",
  },
  {
    icon: "📋",
    title: "Guidance you can trust",
    body: "Visa pathways, IRP reminders, and checklists so paperwork feels manageable — not chaotic.",
  },
  {
    icon: "📁",
    title: "Document vault",
    body: "Keep passport scans, contracts, and IRP files in one place when you need them at appointments.",
  },
  {
    icon: "💼",
    title: "Employment support",
    body: "Know your rights, spot red flags, and get practical help for work abroad.",
  },
  {
    icon: "📌",
    title: "Your job search, in one place",
    body: "Save opportunities, track application stages and plan your next step.",
    to: "/job-tracker",
    cta: "Open the job tracker →",
  },
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

function StoreButton({ href, eyebrow, label, icon, className = "" }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`landing-store-btn ${className}`.trim()}
    >
      {icon ? (
        <span className="landing-store-btn-icon" aria-hidden>
          {icon}
        </span>
      ) : null}
      <span className="landing-store-btn-text">
        <span className="landing-store-btn-eyebrow">{eyebrow}</span>
        <span className="landing-store-btn-label">{label}</span>
      </span>
    </a>
  );
}

function StoreButtons({ className = "" }) {
  return (
    <div className={`landing-store-btns ${className}`.trim()}>
      <StoreButton
        href={APP_STORE_URL}
        eyebrow="Download on the"
        label="App Store"
        icon=""
      />
      <StoreButton
        href={PLAY_STORE_URL}
        eyebrow="GET IT ON"
        label="Google Play"
        icon=""
      />
    </div>
  );
}

export default function WebAuthLanding() {
  const { authNotice, user } = useAuth();
  const { busy, error, signInWithGoogle, googleConfigured } = useGoogleAuthAction();
  const [posts, setPosts] = useState([]);
  const [postsLoaded, setPostsLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchPublishedPosts(3)
      .then((data) => {
        if (!cancelled) setPosts(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        /* landing works without blog API */
      })
      .finally(() => {
        if (!cancelled) setPostsLoaded(true);
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
    <div className="landing-page">
      <Seo
        title="Your friend away from home"
        description="EXPal helps expats relocate smarter — housing, visa guidance, community, and employment support. Sign in free with Google or email."
        path="/"
      />

      <header className="landing-header">
        <a href="/" className="landing-brand">
          <AppLogo size={36} variant="header" />
          <span className="landing-brand-text">
            EX<span>Pal</span>
          </span>
        </a>
        <nav className="landing-nav" aria-label="Primary">
          <a href="/">Home</a>
          <Link to="/job-tracker">Job tracker</Link>
          {user ? (
            <Link to="/">Open app</Link>
          ) : (
            <a href="#sign-in">Sign in</a>
          )}
          <a
            href={APP_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="landing-nav-cta"
          >
            Download
          </a>
        </nav>
      </header>

      <section className="landing-hero" aria-labelledby="landing-hero-heading">
        <div className="landing-hero-inner">
          <div className="landing-hero-copy">
            <h1 id="landing-hero-heading">Your friend away from home.</h1>
            <p className="landing-hero-lead">
              EXPal brings housing, community, and your visa process into one place — making
              moving abroad feel like less of a chore and more like the adventure it is.
            </p>
            <div className="landing-hero-actions">
              <StoreButtons />
              {!user && (
                <a href="#sign-in" className="landing-hero-signin">
                  Sign in on the web
                </a>
              )}
            </div>
          </div>
          <div className="landing-hero-visual" aria-hidden>
            <div className="landing-phone-frame">
              <img
                src="/landing-phone.png"
                alt=""
                className="landing-phone-screen"
                width={280}
                height={498}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="landing-features-band" id="features" aria-labelledby="landing-features-heading">
        <div className="landing-section-inner">
          <h2 id="landing-features-heading">Everything you need to settle in.</h2>
          <p className="landing-section-lead">
            One free app for the practical side of relocating — from your first room search to
            community and paperwork.
          </p>
          <div className="landing-feature-tiles">
            {FEATURE_TILES.map((tile) => (
              <article key={tile.title} className="landing-feature-tile">
                <span className="landing-feature-tile-icon" aria-hidden>
                  {tile.icon}
                </span>
                <h3>{tile.title}</h3>
                <p>{tile.body}</p>
                {tile.to && tile.cta ? (
                  <Link to={tile.to} className="landing-feature-tile-link">
                    {tile.cta}
                  </Link>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-posts-band" id="blog" aria-labelledby="landing-posts-heading">
        <div className="landing-section-inner">
          <p className="landing-posts-kicker">Expat journal</p>
          <h2 id="landing-posts-heading">Local know-how, from people who&apos;ve done it</h2>
          <p className="landing-section-lead landing-section-lead-on-coral">
            Practical guides for life abroad. Read on the web — no login required.
          </p>

          {postsLoaded && posts.length > 0 ? (
            <div className="landing-posts-grid">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  to={`/blog/${post.slug}`}
                  className="landing-post-card"
                >
                  {Array.isArray(post.tags) && post.tags[0] && (
                    <span className="landing-post-tag">{post.tags[0]}</span>
                  )}
                  <p className="landing-post-meta">{formatDate(post.publishedAt)}</p>
                  <h3>{post.title}</h3>
                  <p className="landing-post-excerpt">{post.excerpt}</p>
                  <span className="landing-post-cta">Read post →</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="landing-posts-empty">
              <p>Articles coming soon.</p>
              <Link to="/blog">Visit the blog →</Link>
            </div>
          )}

          <Link to="/blog" className="landing-posts-all">
            View all articles →
          </Link>
        </div>
      </section>

      <section className="landing-cta-band" aria-labelledby="landing-cta-heading">
        <div className="landing-section-inner landing-cta-inner">
          <h2 id="landing-cta-heading">Start your move the easy way</h2>
          <p className="landing-section-lead">
            Download EXPal on the App Store or Google Play, or sign in below to use the web app
            free.
          </p>
          <StoreButtons />
        </div>
      </section>

      <section className="landing-signin-band" id="sign-in" aria-labelledby="landing-signin-heading">
        <div className="landing-signin-card">
          <h2 id="landing-signin-heading">Welcome</h2>
          <p className="landing-signin-muted">
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
            . EXPal is free — always.
          </p>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="landing-footer-brand">
            <span className="landing-brand-text landing-brand-text-footer">
              EX<span>Pal</span>
            </span>
            <p>Your friend away from home.</p>
          </div>
          <nav className="landing-footer-links" aria-label="Footer">
            <Link to="/privacy">Privacy</Link>
            <Link to="/privacy">Cookies</Link>
            <Link to="/blog">Blog</Link>
            <Link to="/job-tracker">Job tracker</Link>
            <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer">
              App Store
            </a>
            <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer">
              Google Play
            </a>
            <a href="mailto:expalappsupport@gmail.com">Support</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
