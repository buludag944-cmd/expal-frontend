import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import BlogBody from "../../components/BlogBody";
import PublicSiteHeader from "../../components/PublicSiteHeader";
import Seo from "../../components/Seo";
import { fetchPostBySlug } from "../../lib/blogApi";
import "../../styles/public-marketing.css";

function formatDate(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

export default function BlogPostPage() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    fetchPostBySlug(slug)
      .then((data) => {
        if (cancelled) return;
        if (!data) setError("Post not found.");
        else setPost(data);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load this post.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const authorName = post?.author
    ? `${post.author.firstName || ""} ${post.author.lastName || ""}`.trim()
    : "";

  return (
    <div className="public-page">
      <Seo
        title={post?.seoTitle || post?.title || "Blog"}
        description={post?.seoDescription || post?.excerpt || "EXPal expat guide"}
        path={`/blog/${slug || ""}`}
        type="article"
        image={post?.coverImageUrl || undefined}
      />
      <PublicSiteHeader />
      <main className="public-main blog-post-main">
        <p className="blog-back">
          <Link to="/blog">← All articles</Link>
        </p>

        {loading && <p className="public-muted">Loading…</p>}
        {error && (
          <div className="public-error-block">
            <p className="public-error">{error}</p>
            <Link to="/blog">Back to blog</Link>
          </div>
        )}

        {post && (
          <article className="blog-article">
            <header>
              <p className="blog-card-meta">
                {formatDate(post.publishedAt)}
                {authorName ? ` · ${authorName}` : ""}
              </p>
              <h1>{post.title}</h1>
              {post.excerpt && <p className="blog-article-deck">{post.excerpt}</p>}
            </header>
            {post.coverImageUrl && (
              <img
                className="blog-cover"
                src={post.coverImageUrl}
                alt=""
                loading="lazy"
              />
            )}
            <BlogBody body={post.body} />
            <div className="blog-article-cta">
              <h2>Ready to settle with support?</h2>
              <p>Join EXPal free — housing tips, visa tracking, and an expat community in one place.</p>
              <Link to="/#sign-in" className="public-btn-primary">
                Sign in or create account
              </Link>
            </div>
          </article>
        )}
      </main>
      <footer className="public-footer">
        <Link to="/">Home</Link>
        <Link to="/blog">Blog</Link>
        <Link to="/privacy">Privacy</Link>
      </footer>
    </div>
  );
}
