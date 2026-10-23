import React from "react";
import { Link } from "react-router-dom";
import AppLogo from "./AppLogo";
import { useAuth } from "../AuthContext";

/**
 * Shared public header for landing + blog (no login required).
 * @param {"dark"|"light"} variant
 */
export default function PublicSiteHeader({ variant = "light", signInTo = "/#sign-in" }) {
  const dark = variant === "dark";
  const { user } = useAuth() || {};
  const appStoreUrl =
    "https://apps.apple.com/app/expal-app-ireland-expat-guide/id6807468477";

  return (
    <header className={`public-site-header ${dark ? "is-dark" : "is-light"}`}>
      <Link to="/" className="public-site-brand">
        <AppLogo size={36} variant="header" />
        <div className="public-site-brand-stack">
          <span className="public-site-brand-text">
            EX<span>Pal</span>
          </span>
          <span className="public-site-brand-tag">Your friend away from home</span>
        </div>
      </Link>
      <nav className="public-site-nav" aria-label="Public">
        <Link to="/">Home</Link>
        <Link to="/blog">Blog</Link>
        <Link to="/job-tracker">Job tracker</Link>
        {user ? (
          <Link to="/" className="public-site-cta">
            Open app
          </Link>
        ) : (
          <Link to={signInTo}>Sign in</Link>
        )}
        <a
          href={appStoreUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="public-site-cta"
        >
          Download
        </a>
      </nav>
    </header>
  );
}
