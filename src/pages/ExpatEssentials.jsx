import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { BookOpen } from "lucide-react";
import { useAuth } from "../AuthContext";
import CommentsSection from "../components/CommentsSection";
import { getApiBaseUrl } from "../apiConfig";
import { cn } from "../lib/cn";

const API = getApiBaseUrl();

const CATEGORY_TABS = ["All", "Visa", "Tax", "Banking", "Health", "Legal"];

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

function EssentialDetail({ id }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    fetch(`${API}/api/essentials/${id}`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || `Load failed (${res.status})`);
        return data;
      })
      .then((data) => {
        if (!cancelled) setPost(data);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message || "Could not load guide");
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
        <button type="button" className="btn-primary" onClick={() => navigate("/essentials")}>
          Back to guides
        </button>
      </div>
    );
  }

  return (
    <article className={cn(sectionWrap, "max-w-prose")}>
      <button
        type="button"
        className="text-sm font-medium text-es hover:underline min-h-[44px]"
        onClick={() => navigate("/essentials")}
      >
        ← Back to Expat Essentials
      </button>
      <div className="flex items-center gap-3 mt-4 md:mt-6">
        <BookOpen className="h-8 w-8 icon-es shrink-0" aria-hidden />
        <span className="badge-es">{post.category}</span>
      </div>
      <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mt-4 md:mt-6">{post.title}</h1>
      <p className="text-sm md:text-base text-muted mb-6 md:mb-8">
        By {authorLabel(post)} · {formatDate(post.createdAt)}
      </p>
      <div className="prose prose-sm max-w-none text-foreground mb-8 md:mb-10">{post.content}</div>
      <div className="border-t border-border pt-6 md:pt-8 lborder-es pl-4">
        <CommentsSection targetType="essential" targetId={post.id} apiBase={API} user={user} />
      </div>
    </article>
  );
}

function EssentialList() {
  const { token } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    category: "Visa",
    content: "",
  });
  const [submitErr, setSubmitErr] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    fetch(`${API}/api/essentials`)
      .then(async (res) => {
        const data = await res.json().catch(() => []);
        if (!res.ok) throw new Error(Array.isArray(data) ? "Failed" : data.error || `HTTP ${res.status}`);
        setPosts(Array.isArray(data) ? data : []);
      })
      .catch((e) => setError(e.message || "Could not load guides"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    if (activeTab === "All") return posts;
    return posts.filter((p) => (p.category || "").toLowerCase() === activeTab.toLowerCase());
  }, [posts, activeTab]);

  function submitNew(e) {
    e.preventDefault();
    setSubmitErr("");
    if (!token) {
      setSubmitErr("Log in to add a guide.");
      return;
    }
    fetch(`${API}/api/essentials`, {
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
          <BookOpen className="h-8 w-8 icon-es shrink-0 mt-1" aria-hidden />
          <div>
            <span className="badge-es">Expat Essentials</span>
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mt-2 mb-4 md:mb-6">
              Practical guides
            </h2>
            <p className="text-sm md:text-base text-muted mb-0 max-w-prose">
              Curated guides from the community—visa rules, banking, taxes, and more.
            </p>
          </div>
        </div>
        <button type="button" className="btn-primary shrink-0" onClick={() => setShowForm((s) => !s)}>
          {showForm ? "Close" : "Add guide"}
        </button>
      </header>

      {showForm && (
        <form className="page-card space-y-4 md:space-y-6" onSubmit={submitNew}>
          <h3 className="text-lg font-semibold">New guide</h3>
          <div className="form-group">
            <label className="form-label">Title</label>
            <input
              className="form-input"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              placeholder="e.g. Opening a resident bank account"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Category</label>
            <select
              className="form-input"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {CATEGORY_TABS.filter((c) => c !== "All").map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Content</label>
            <textarea
              className="form-input form-textarea"
              rows={6}
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              required
              placeholder="Share steps, pitfalls, or official links worth knowing…"
            />
          </div>
          {submitErr && <p className="form-error-text">{submitErr}</p>}
          <button type="submit" className="btn-primary">
            Publish guide
          </button>
        </form>
      )}

      <div
        className="flex flex-wrap gap-2 md:gap-3 mb-6 md:mb-8"
        role="tablist"
        aria-label="Filter by category"
      >
        {CATEGORY_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            className={cn(
              "min-h-[44px] rounded-lg px-4 py-2 text-sm font-medium transition ease-out border-b-2 border-transparent",
              activeTab === tab
                ? "tab-es-active"
                : "text-muted hover:text-foreground"
            )}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {error && <p className="form-error-text">{error}</p>}
      {loading ? (
        <p className="text-sm text-muted">Loading guides…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted">No guides in this category yet. Add the first one above.</p>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8 list-none p-0 m-0">
          {filtered.map((p) => (
            <li key={p.id}>
              <Link
                className="community-card lborder-es pl-3 block h-full"
                to={`/essentials/${p.id}`}
              >
                <span className="badge-es mb-2">{p.category}</span>
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

export default function ExpatEssentials() {
  const { id } = useParams();

  if (id) {
    const num = Number(id);
    if (!Number.isInteger(num) || num < 1) {
      return (
        <div className={sectionWrap}>
          <p className="form-error-text">Invalid guide.</p>
          <Link className="text-es font-medium hover:underline" to="/essentials">
            Back to list
          </Link>
        </div>
      );
    }
    return <EssentialDetail id={num} />;
  }

  return <EssentialList />;
}
