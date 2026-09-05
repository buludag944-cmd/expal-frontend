import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../AuthContext";
import { getApiBaseUrl } from "../../apiConfig";
import CommentsSection from "../../components/CommentsSection";
import {
  MobileScreen,
  MobileSectionTitle,
  MobileBadge,
  MobileFab,
  MobilePostSheet,
} from "../../components/mobile/MobileShared";

const API = getApiBaseUrl();

function authorLabel(row) {
  if (!row?.User) return "Member";
  return `${row.User.firstName || ""} ${row.User.lastName || ""}`.trim() || "Member";
}

function formatDate(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-IE", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "";
  }
}

export function MobileContentList({ config }) {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    category: config.categories[0] || "General",
    content: "",
  });
  const [submitErr, setSubmitErr] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    fetch(`${API}/api/${config.apiPath}`)
      .then(async (res) => {
        const data = await res.json().catch(() => []);
        if (!res.ok) throw new Error(Array.isArray(data) ? "Failed to load" : data.error || `HTTP ${res.status}`);
        setPosts(Array.isArray(data) ? data : []);
      })
      .catch((e) => setError(e.message || "Could not load"))
      .finally(() => setLoading(false));
  }, [config.apiPath]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return posts.filter((p) => {
      const matchTab =
        activeTab === "All" || (p.category || "").toLowerCase() === activeTab.toLowerCase();
      if (!matchTab) return false;
      if (!q) return true;
      const blob = `${p.title || ""} ${p.category || ""} ${p.content || ""}`.toLowerCase();
      return blob.includes(q);
    });
  }, [posts, search, activeTab]);

  const submitNew = async (e) => {
    e.preventDefault();
    setSubmitErr("");
    if (!token) {
      setSubmitErr("Sign in to post.");
      return;
    }
    try {
      const res = await fetch(`${API}/api/${config.apiPath}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: form.title.trim(),
          category: form.category.trim(),
          content: form.content.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not save");
      setForm({ title: "", category: form.category, content: "" });
      setShowForm(false);
      load();
    } catch (err) {
      setSubmitErr(err.message);
    }
  };

  return (
    <div className="mob-page-stack">
    <MobileScreen
      title={config.title}
      backTo={config.backTo || "/"}
      count={filtered.length}
      chromeExtra={
        <>
          <div className="mob-search-wrap">
            <input
              className="mob-search-input"
              placeholder={config.searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label={`Search ${config.title}`}
            />
          </div>
          <div className="mob-chip-scroll mob-search-filters">
            {config.categories.map((tab) => (
              <button
                key={tab}
                type="button"
                className={`mob-chip${activeTab === tab ? " mob-chip--on" : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
        </>
      }
    >
      <div className="mob-body" style={{ paddingTop: 12 }}>
        <p style={{ fontSize: 12, color: "var(--mob-text-muted)", margin: "0 0 12px", lineHeight: 1.45 }}>
          {config.subtitle}
        </p>

        {error && <p className="mob-search-error">{error}</p>}
        {loading && <p className="mob-search-hint">Loading…</p>}
        {!loading && !error && filtered.length === 0 && (
          <p className="mob-search-hint">No posts yet. Tap ＋ to add the first one.</p>
        )}

        <MobileSectionTitle>{config.listTitle}</MobileSectionTitle>
        {filtered.map((p) => (
          <button
            key={p.id}
            type="button"
            className="mob-card w-full text-left mob-content-card"
            onClick={() => navigate(`/${config.routeBase}/${p.id}`)}
          >
            <MobileBadge label={p.category || "General"} color={config.badgeColor} />
            <p className="mob-ref-name" style={{ marginTop: 8 }}>
              {p.title}
            </p>
            <p className="mob-ref-role">
              {authorLabel(p)} · {formatDate(p.createdAt)}
            </p>
            {p.content && (
              <p className="mob-search-snippet">
                {p.content.length > 100 ? `${p.content.slice(0, 100)}…` : p.content}
              </p>
            )}
          </button>
        ))}
      </div>
    </MobileScreen>

      <MobileFab label={config.addLabel} onClick={() => setShowForm(true)} />

      <MobilePostSheet open={showForm} onClose={() => setShowForm(false)} title={config.addLabel}>
        <form onSubmit={submitNew}>
          <input
            className="mob-search-input"
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
          <select
            className="mob-search-input"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            {config.categories.filter((c) => c !== "All").map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <textarea
            className="mob-search-input"
            rows={5}
            placeholder="Write your guide or question…"
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            required
          />
          {submitErr && <p className="mob-search-error">{submitErr}</p>}
          <button type="submit" className="mob-btn-primary" style={{ width: "100%" }}>
            Publish
          </button>
        </form>
      </MobilePostSheet>
    </div>
  );
}

export function MobileContentDetail({ config, id }) {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [post, setPost] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ title: "", category: "", content: "" });

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    return fetch(`${API}/api/${config.apiPath}/${id}`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Not found");
        return data;
      })
      .then((data) => {
        setPost(data);
        setForm({
          title: data.title || "",
          category: data.category || config.categories[1] || "General",
          content: data.content || "",
        });
      })
      .catch((e) => setError(e.message || "Could not load"))
      .finally(() => setLoading(false));
  }, [config.apiPath, config.categories, id]);

  useEffect(() => {
    load();
  }, [load]);

  const isOwner = post && (Number(user?.id) === Number(post.createdBy) || user?.isAdmin);

  const savePost = async () => {
    if (!token) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`${API}/api/${config.apiPath}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to update");
      setPost(data);
      setEditing(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const removePost = async () => {
    if (!token || !window.confirm("Delete this permanently?")) return;
    setBusy(true);
    try {
      const res = await fetch(`${API}/api/${config.apiPath}/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok && res.status !== 204) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete");
      }
      navigate(`/${config.routeBase}`, { replace: true });
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  };

  const title = post?.title ? (post.title.length > 32 ? `${post.title.slice(0, 32)}…` : post.title) : config.title;

  return (
    <MobileScreen title={title} backTo={`/${config.routeBase}`}>
      <div className="mob-body mob-content-detail" style={{ paddingTop: 12 }}>
        {loading && <p className="mob-search-hint">Loading…</p>}
        {error && !loading && (
          <>
            <p className="mob-search-error">{error}</p>
            <button type="button" className="mob-btn-primary" onClick={() => navigate(`/${config.routeBase}`)}>
              Back
            </button>
          </>
        )}
        {post && !loading && (
          <>
            <MobileBadge label={post.category || "General"} color={config.badgeColor} />
            <h2 className="mob-content-detail-title">{post.title}</h2>
            <p className="mob-ref-role" style={{ marginBottom: 12 }}>
              {authorLabel(post)} · {formatDate(post.createdAt)}
            </p>

            {editing ? (
              <div className="mob-content-edit">
                <input
                  className="mob-search-input"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
                <select
                  className="mob-search-input"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  {config.categories.filter((c) => c !== "All").map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <textarea
                  className="mob-search-input"
                  rows={6}
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                />
                <div className="mob-content-actions">
                  <button type="button" className="mob-btn-primary" onClick={savePost} disabled={busy}>
                    {busy ? "Saving…" : "Save"}
                  </button>
                  <button type="button" className="mob-btn-secondary" onClick={() => setEditing(false)} disabled={busy}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="mob-content-body">{post.content}</div>
                {isOwner && (
                  <div className="mob-content-actions">
                    <button type="button" className="mob-btn-secondary" onClick={() => setEditing(true)} disabled={busy}>
                      Edit
                    </button>
                    <button type="button" className="mob-btn-secondary mob-btn-danger" onClick={removePost} disabled={busy}>
                      Delete
                    </button>
                  </div>
                )}
              </>
            )}

            <MobileSectionTitle style={{ marginTop: 20 }}>Comments</MobileSectionTitle>
            <div className="mob-comments">
              <CommentsSection
                targetType={config.commentType}
                targetId={post.id}
                apiBase={API}
                user={user}
                token={token}
              />
            </div>
          </>
        )}
      </div>
    </MobileScreen>
  );
}

export const ESSENTIALS_CONFIG = {
  apiPath: "essentials",
  routeBase: "essentials",
  commentType: "essential",
  title: "Expat Essentials",
  listTitle: "Guides",
  subtitle: "Visa, tax, banking, and settling-in guides from the community.",
  searchPlaceholder: "Search guides…",
  addLabel: "Add guide",
  badgeColor: "teal",
  categories: ["All", "Visa", "Tax", "Banking", "Health", "Legal"],
  backTo: "/explore",
};

export const KNOWHOW_CONFIG = {
  apiPath: "knowhow",
  routeBase: "knowhow",
  commentType: "knowhow",
  title: "Local Know-How",
  listTitle: "Tips & questions",
  subtitle: "Everyday shortcuts — transport, food, neighbours, and paperwork.",
  searchPlaceholder: "Search tips…",
  addLabel: "Ask / share",
  badgeColor: "purple",
  categories: ["All", "General", "Lifestyle", "Transport", "Food", "Neighbors", "Paperwork", "Other"],
  backTo: "/explore",
};
