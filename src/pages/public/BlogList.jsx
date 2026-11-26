import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PublicSiteHeader from "../../components/PublicSiteHeader";
import Seo from "../../components/Seo";
import { fetchPublishedPosts } from "../../lib/blogApi";
import "../../styles/public-marketing.css";
import "../../styles/blog.css";

export function formatDate(iso, month = "short") {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-IE", { year: "numeric", month, day: "numeric" });
  } catch {
    return "";
  }
}

export function readingMinutes(post) {
  if (post?.readingMinutes) return post.readingMinutes;
  const words = String(post?.body || "").split(/\s+/).filter(Boolean).length;
  return words ? Math.max(1, Math.round(words / 220)) : null;
}

export function PostMeta({ post, month = "short" }) {
  const mins = readingMinutes(post);
  return (
    <p className="blog-meta">
      <time dateTime={post.publishedAt}>{formatDate(post.publishedAt, month)}</time>
      {mins ? <span>{mins} min read</span> : null}
    </p>
  );
}

export function PostCard({ post, featured = false }) {
  const category = post.category || (Array.isArray(post.tags) && post.tags[0]) || "";
  return (
    <article className={`blog-card2${featured ? " is-featured" : ""}`}>
      <Link to={`/blog/${post.slug}`} className="blog-card2-media" tabIndex={-1} aria-hidden="true">
        {post.coverImageUrl ? (
          <img src={post.coverImageUrl} alt="" loading={featured ? "eager" : "lazy"} width="1200" height="630" />
        ) : (
          <span className="blog-card2-placeholder">EXPal</span>
        )}
      </Link>
      <div className="blog-card2-body">
        {category && <p className="blog-chip">{category}</p>}
        <h2 className="blog-card2-title">
          <Link to={`/blog/${post.slug}`}>{post.title}</Link>
        </h2>
        {post.excerpt && <p className="blog-card2-excerpt">{post.excerpt}</p>}
        <PostMeta post={post} />
      </div>
    </article>
  );
}

function SkeletonGrid() {
  return (
    <div className="blog-grid" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <div key={i} className="blog-card2 is-skeleton">
          <div className="blog-card2-media" />
          <div className="blog-card2-body">
            <span className="sk sk-chip" />
            <span className="sk sk-title" />
            <span className="sk sk-line" />
          </div>
        </div>
      ))}
    </div>
  );
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
        if (!cancelled) setError("We couldn't load the articles right now. Please try again in a moment.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const [featured, ...rest] = posts;

  return (
    <div className="public-page blog-page">
      <Seo
        title="Blog — Guides for your first months in Ireland"
        description="Practical, source-checked guides for expats moving to Ireland: PPS number, IRP, housing, tax, healthcare and more."
        path="/blog"
        image={featured?.coverImageUrl}
      />
      <PublicSiteHeader />
      <main className="public-main blog-wrap">
        <header className="blog-hero">
          <p className="blog-kicker">EXPal Blog</p>
          <h1>Guides for your first months in Ireland</h1>
          <p>
            Step-by-step, source-checked guides on PPS numbers, immigration, housing, tax and healthcare,
            written to help you settle in with less stress.
          </p>
        </header>

        {loading && <SkeletonGrid />}
        {error && <p className="public-error">{error}</p>}
        {!loading && !error && posts.length === 0 && (
          <p className="public-muted">New guides are on their way. Check back soon.</p>
        )}

        {featured && <PostCard post={featured} featured />}
        {rest.length > 0 && (
          <div className="blog-grid">
            {rest.map((post) => (
              <PostCard key={post.id || post.slug} post={post} />
            ))}
          </div>
        )}
      </main>
      <footer className="public-footer">
        <Link to="/">Home</Link>
        <Link to="/privacy">Privacy</Link>
        <Link to="/#sign-in">Sign in</Link>
      </footer>
    </div>
  );
}
