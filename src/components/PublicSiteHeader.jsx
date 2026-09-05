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
        <a href="/#features">Features</a>
        <a href="/#blog">Blog</a>
        <Link to="/employment-support">Guides</Link>
        {user ? (
          <Link to="/" className="public-site-cta">
            Open app
          </Link>
        ) : (
          <Link to={signInTo} className="public-site-cta">
            Sign in
          </Link>
        )}
      </nav>
    </header>
  );
}
