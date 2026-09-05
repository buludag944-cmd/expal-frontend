import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PublicSiteHeader from "../../components/PublicSiteHeader";
import Seo from "../../components/Seo";
import { fetchPublishedPosts } from "../../lib/blogApi";
import "../../styles/public-marketing.css";

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

export default function BlogList() {
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchPublishedPosts()
      .then((data) => {
        if (!cancelled) setPosts(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load posts. Try again shortly.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="public-page">
      <Seo
        title="Expat Blog"
        description="Guides for expats on housing, visas, IRP, and settling abroad — from the EXPal team."
        path="/blog"
      />
      <PublicSiteHeader />
      <main className="public-main">
        <header className="blog-list-hero">
          <p className="blog-kicker">EXPal Blog</p>
          <h1>Guides for life abroad</h1>
          <p>
            Practical articles on relocating, housing, visas, and community — written to help you
            settle with less stress.
          </p>
        </header>

        {loading && <p className="public-muted">Loading posts…</p>}
        {error && <p className="public-error">{error}</p>}

        {!loading && !error && posts.length === 0 && (
          <p className="public-muted">No posts yet — check back soon.</p>
        )}

        <div className="blog-card-grid">
          {posts.map((post) => (
            <article key={post.id} className="blog-card">
              <p className="blog-card-meta">{formatDate(post.publishedAt)}</p>
              <h2>
                <Link to={`/blog/${post.slug}`}>{post.title}</Link>
              </h2>
              <p>{post.excerpt}</p>
              {Array.isArray(post.tags) && post.tags.length > 0 && (
                <div className="blog-tag-row">
                  {post.tags.map((tag) => (
                    <span key={tag} className="blog-tag">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <Link to={`/blog/${post.slug}`} className="blog-card-link">
                Read article →
              </Link>
            </article>
          ))}
        </div>
      </main>
      <footer className="public-footer">
        <Link to="/">Home</Link>
        <Link to="/privacy">Privacy</Link>
        <Link to="/#sign-in">Sign in</Link>
      </footer>
    </div>
  );
}
