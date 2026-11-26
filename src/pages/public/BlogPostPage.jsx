import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import BlogBody from "../../components/BlogBody";
import PublicSiteHeader from "../../components/PublicSiteHeader";
import Seo from "../../components/Seo";
import { fetchPostBySlug, fetchPublishedPosts } from "../../lib/blogApi";
import { PostCard, formatDate, readingMinutes } from "./BlogList";
import "../../styles/public-marketing.css";
import "../../styles/blog.css";

function authorName(author) {
  if (!author) return "EXPal editorial";
  if (typeof author === "string") return author;
  return `${author.firstName || ""} ${author.lastName || ""}`.trim() || "EXPal editorial";
}

export default function BlogPostPage() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [related, setRelated] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    setPost(null);
    fetchPostBySlug(slug)
      .then((data) => {
        if (cancelled) return;
        if (!data) setError("We couldn't find this article.");
        else setPost(data);
      })
      .catch(() => {
        if (!cancelled) setError("We couldn't load this article right now. Please try again in a moment.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    fetchPublishedPosts()
      .then((all) => {
        if (!cancelled) setRelated(all.filter((p) => p.slug !== slug).slice(0, 3));
      })
      .catch(() => {});
    window.scrollTo(0, 0);
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const mins = post ? readingMinutes(post) : null;
  const category = post?.category || (Array.isArray(post?.tags) && post.tags[0]) || "";

  return (
    <div className="public-page blog-page">
      <Seo
        title={post?.seoTitle || post?.title || "Blog"}
        description={post?.seoDescription || post?.excerpt || "EXPal guide for expats in Ireland"}
        path={`/blog/${slug || ""}`}
        type="article"
        image={post?.coverImageUrl || undefined}
      />
      <PublicSiteHeader />
      <main className="public-main blog-article-wrap">
        <nav className="blog-breadcrumb" aria-label="Breadcrumb">
          <Link to="/blog">Blog</Link>
          {category && (
            <>
              <span aria-hidden="true">/</span>
              <span>{category}</span>
            </>
          )}
        </nav>

        {loading && (
          <div className="blog-article-skeleton" aria-hidden="true">
            <span className="sk sk-title" />
            <span className="sk sk-title short" />
            <span className="sk sk-cover" />
          </div>
        )}
        {error && (
          <div className="public-error-block">
            <p className="public-error">{error}</p>
            <Link to="/blog">Browse all articles</Link>
          </div>
        )}

        {post && (
          <article className="blog-article2">
            <header className="blog-article2-header">
              {category && <p className="blog-chip">{category}</p>}
              <h1>{post.title}</h1>
              {post.excerpt && <p className="blog-article2-deck">{post.excerpt}</p>}
              <p className="blog-meta">
                <span>{authorName(post.author)}</span>
                <time dateTime={post.publishedAt}>{formatDate(post.publishedAt, "long")}</time>
                {mins ? <span>{mins} min read</span> : null}
              </p>
            </header>

            {post.coverImageUrl && (
              <figure className="blog-article2-cover">
                <img src={post.coverImageUrl} alt={post.coverAlt || ""} width="1200" height="630" />
              </figure>
            )}

            {post.lastReviewed && (
              <p className="blog-reviewed">
                <strong>Fact-checked against official sources</strong> · Last reviewed{" "}
                {formatDate(post.lastReviewed, "long")}. Rules and fees can change, so always confirm on the
                official pages linked below.
              </p>
            )}

            <BlogBody body={post.body} />

            <aside className="blog-article-cta">
              <h2>Your first 90 days in Ireland, organised</h2>
              <p>
                Track your residency days towards citizenship, find expat-friendly housing and meet people who've
                been through it. Free.
              </p>
              <Link to="/#sign-in" className="public-btn-primary">
                Join EXPal free
              </Link>
            </aside>
          </article>
        )}

        {post && related.length > 0 && (
          <section className="blog-related" aria-labelledby="related-heading">
            <h2 id="related-heading">Keep reading</h2>
            <div className="blog-grid">
              {related.map((p) => (
                <PostCard key={p.id || p.slug} post={p} />
              ))}
            </div>
          </section>
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
