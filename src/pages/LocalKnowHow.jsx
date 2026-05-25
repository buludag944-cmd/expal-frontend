import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Lightbulb } from "lucide-react";
import { useAuth } from "../AuthContext";
import CommentsSection from "../components/CommentsSection";
import { getApiBaseUrl } from "../apiConfig";
import { cn } from "../lib/cn";

const API = getApiBaseUrl();

const DEFAULT_CATEGORIES = [
  "General",
  "Lifestyle",
  "Transport",
  "Food",
  "Neighbors",
  "Paperwork",
  "Other",
];

const sectionWrap =
  "container mx-auto px-4 md:px-6 mt-8 md:mt-10 mb-10 md:mb-14 space-y-6 md:space-y-8";

function authorLabel(row) {
  if (!row?.User) return "Member";
  const n = `${row.User.firstName || ""} ${row.User.lastName || ""}`.trim();
  return n || "Member";
}

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

function KnowHowDetail({ id }) {
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    fetch(`${API}/api/knowhow/${id}`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || `Load failed (${res.status})`);
        return data;
      })
      .then((data) => {
        if (!cancelled) setPost(data);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message || "Could not load post");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className={sectionWrap}>
        <p className="text-sm text-muted">Loading…</p>
      </div>
    );
  }
  if (error || !post) {
    return (
      <div className={sectionWrap}>
        <p className="form-error-text">{error || "Not found"}</p>
        <button type="button" className="btn-primary" onClick={() => navigate("/knowhow")}>
          Back to Local Know-How
        </button>
      </div>
    );
  }

  return (
    <article className={cn(sectionWrap, "max-w-prose")}>
      <button
        type="button"
        className="text-sm font-medium text-kh hover:underline min-h-[44px]"
        onClick={() => navigate("/knowhow")}
      >
        ← Back to Local Know-How
      </button>
      <div className="flex items-center gap-3 mt-4 md:mt-6">
        <Lightbulb className="h-8 w-8 icon-kh shrink-0" aria-hidden />
        <span className="badge-kh">{post.category}</span>
      </div>
      <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mt-4 md:mt-6">{post.title}</h1>
      <p className="text-sm md:text-base text-muted mb-6 md:mb-8">
        By {authorLabel(post)} · {formatDate(post.createdAt)}
      </p>
      <div className="prose prose-sm max-w-none text-foreground mb-8 md:mb-10">{post.content}</div>
      <div className="border-t border-border pt-6 md:pt-8 lborder-kh pl-4">
        <CommentsSection targetType="knowhow" targetId={post.id} apiBase={API} user={user} />
      </div>
    </article>
  );
}

function KnowHowList() {
  const { token } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    category: "General",
    content: "",
  });
  const [submitErr, setSubmitErr] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    fetch(`${API}/api/knowhow`)
      .then(async (res) => {
        const data = await res.json().catch(() => []);
        if (!res.ok) throw new Error(Array.isArray(data) ? "Failed" : data.error || `HTTP ${res.status}`);
        setPosts(Array.isArray(data) ? data : []);
      })
      .catch((e) => setError(e.message || "Could not load posts"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return posts;
    return posts.filter((p) => {
      const t = `${p.title || ""} ${p.category || ""} ${p.content || ""}`.toLowerCase();
      return t.includes(q);
    });
  }, [posts, query]);

  function submitNew(e) {
    e.preventDefault();
    setSubmitErr("");
    if (!token) {
      setSubmitErr("Log in to post.");
      return;
    }
    fetch(`${API}/api/knowhow`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: form.title.trim(),
        category: form.category.trim(),
        content: form.content.trim(),
      }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || `Save failed (${res.status})`);
        return data;
      })
      .then(() => {
        setForm({ title: "", category: form.category, content: "" });
        setShowForm(false);
        load();
      })
      .catch((err) => setSubmitErr(err.message));
  }

  return (
    <div className={sectionWrap}>
      <header className="flex flex-wrap items-start justify-between gap-4 md:gap-6">
        <div className="flex items-start gap-3">
          <Lightbulb className="h-8 w-8 icon-kh shrink-0 mt-1" aria-hidden />
          <div>
            <span className="badge-kh">Local Know-How</span>
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mt-2 mb-4 md:mb-6">
              Everyday tips
            </h2>
            <p className="text-sm md:text-base text-muted max-w-prose">
              Ask locals, share shortcuts, and trade practical tips about daily life here.
            </p>
          </div>
        </div>
        <button type="button" className="btn-primary shrink-0" onClick={() => setShowForm((s) => !s)}>
          {showForm ? "Close" : "Ask question"}
        </button>
      </header>

      <div className="mb-6 md:mb-8">
        <input
          className="form-input max-w-xl"
          type="search"
          placeholder="Search by title or keyword…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search posts"
        />
      </div>

      {showForm && (
        <form className="page-card space-y-4 md:space-y-6" onSubmit={submitNew}>
          <h3 className="text-lg font-semibold">New post</h3>
          <div className="form-group">
            <label className="form-label">Title</label>
            <input
              className="form-input"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              placeholder="What do you want to know or share?"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Category</label>
            <select
              className="form-input"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {DEFAULT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Details</label>
            <textarea
              className="form-input form-textarea"
              rows={5}
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              required
              placeholder="Context, what you tried, neighborhood, etc."
            />
          </div>
          {submitErr && <p className="form-error-text">{submitErr}</p>}
          <button type="submit" className="btn-primary">
            Publish
          </button>
        </form>
      )}

      {error && <p className="form-error-text">{error}</p>}
      {loading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted">No posts match your search.</p>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8 list-none p-0 m-0">
          {filtered.map((p) => (
            <li key={p.id}>
              <Link
                className="community-card lborder-kh pl-3 block h-full"
                to={`/knowhow/${p.id}`}
              >
                <span className="badge-kh mb-2">{p.category}</span>
                <h3 className="text-lg font-semibold text-foreground">{p.title}</h3>
                <p className="text-sm text-muted mt-2">
                  {authorLabel(p)} · {formatDate(p.createdAt)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function LocalKnowHow() {
  const { id } = useParams();

  if (id) {
    const num = Number(id);
    if (!Number.isInteger(num) || num < 1) {
      return (
        <div className={sectionWrap}>
          <p className="form-error-text">Invalid post.</p>
          <Link className="text-kh font-medium hover:underline" to="/knowhow">
            Back to list
          </Link>
        </div>
      );
    }
    return <KnowHowDetail id={num} />;
  }

  return <KnowHowList />;
}
