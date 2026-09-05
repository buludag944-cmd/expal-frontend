import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getApiBaseUrl } from "../apiConfig";
import {
  createBlogPost,
  deleteBlogPost,
  fetchAdminPosts,
  updateBlogPost,
} from "../lib/blogApi";
import Badge from "./ui/Badge";
import Button from "./ui/Button";
import Input, { Label, Textarea } from "./ui/Input";
import { Card, CardContent } from "./ui/Card";

const API = getApiBaseUrl();

const EMPTY_FORM = {
  title: "",
  slug: "",
  excerpt: "",
  body: "",
  tags: "",
  seoTitle: "",
  seoDescription: "",
  coverImageUrl: "",
  published: true,
};

/** Admin tools — server enforces 403; shown only when user.isAdmin from profile/JWT. */
export default function AdminPanel({ token }) {
  const [promoteEmail, setPromoteEmail] = useState("");
  const [promoteMsg, setPromoteMsg] = useState("");
  const [purgeMsg, setPurgeMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmPurge, setConfirmPurge] = useState(false);

  const [posts, setPosts] = useState([]);
  const [blogMsg, setBlogMsg] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [blogBusy, setBlogBusy] = useState(false);

  const loadPosts = useCallback(async () => {
    try {
      const data = await fetchAdminPosts(token);
      setPosts(Array.isArray(data) ? data : []);
    } catch {
      setBlogMsg("Could not load blog posts.");
    }
  }, [token]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  async function handlePromote(e) {
    e.preventDefault();
    setPromoteMsg("");
    setBusy(true);
    try {
      const res = await fetch(`${API}/api/admin/promote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: promoteEmail.trim().toLowerCase() }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setPromoteMsg(data.message || "Promoted to admin.");
      } else {
        setPromoteMsg(data.error || `Failed (${res.status})`);
      }
    } catch {
      setPromoteMsg("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  async function handlePurge() {
    setPurgeMsg("");
    setBusy(true);
    try {
      const res = await fetch(`${API}/api/admin/users`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setPurgeMsg(
          `Deleted ${data.deletedUsers ?? 0} non-admin user(s).` +
            (data.counts ? ` Content: ${JSON.stringify(data.counts)}` : "")
        );
        setConfirmPurge(false);
      } else {
        setPurgeMsg(data.error || `Failed (${res.status})`);
      }
    } catch {
      setPurgeMsg("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  function startEdit(post) {
    setEditingId(post.id);
    setForm({
      title: post.title || "",
      slug: post.slug || "",
      excerpt: post.excerpt || "",
      body: post.body || "",
      tags: Array.isArray(post.tags) ? post.tags.join(", ") : "",
      seoTitle: post.seoTitle || "",
      seoDescription: post.seoDescription || "",
      coverImageUrl: post.coverImageUrl || "",
      published: !!post.published,
    });
    setBlogMsg("");
  }

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function handleBlogSubmit(e) {
    e.preventDefault();
    setBlogMsg("");
    setBlogBusy(true);
    try {
      const payload = {
        title: form.title.trim(),
        slug: form.slug.trim() || undefined,
        excerpt: form.excerpt.trim(),
        body: form.body.trim(),
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        seoTitle: form.seoTitle.trim() || null,
        seoDescription: form.seoDescription.trim() || null,
        coverImageUrl: form.coverImageUrl.trim() || null,
        published: !!form.published,
      };
      if (editingId) {
        await updateBlogPost(token, editingId, payload);
        setBlogMsg("Post updated.");
      } else {
        await createBlogPost(token, payload);
        setBlogMsg("Post published.");
      }
      resetForm();
      await loadPosts();
    } catch (err) {
      setBlogMsg(err.message || "Save failed.");
    } finally {
      setBlogBusy(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this blog post?")) return;
    setBlogBusy(true);
    setBlogMsg("");
    try {
      await deleteBlogPost(token, id);
      if (editingId === id) resetForm();
      setBlogMsg("Post deleted.");
      await loadPosts();
    } catch (err) {
      setBlogMsg(err.message || "Delete failed.");
    } finally {
      setBlogBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card className="border-primary/20">
        <CardContent className="space-y-4 pt-5">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">Blog (SEO)</h3>
            <Badge variant="success">Public</Badge>
          </div>
          <p className="text-sm text-muted">
            Posts appear on the public landing page and{" "}
            <Link to="/blog" className="text-primary underline">
              /blog
            </Link>{" "}
            — no login required for readers.
          </p>

          <form onSubmit={handleBlogSubmit} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="blog-title">Title</Label>
              <Input
                id="blog-title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="blog-slug">Slug (URL)</Label>
              <Input
                id="blog-slug"
                placeholder="auto-from-title if empty"
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="blog-excerpt">Excerpt</Label>
              <Textarea
                id="blog-excerpt"
                rows={2}
                value={form.excerpt}
                onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="blog-tags">Tags (comma-separated)</Label>
              <Input
                id="blog-tags"
                placeholder="Dublin, community, food"
                value={form.tags}
                onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="blog-body">Body (supports ## headings, - lists, **bold**)</Label>
              <Textarea
                id="blog-body"
                rows={10}
                value={form.body}
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                required
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="blog-seo-title">SEO title (optional)</Label>
                <Input
                  id="blog-seo-title"
                  value={form.seoTitle}
                  onChange={(e) => setForm((f) => ({ ...f, seoTitle: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="blog-cover">Cover image URL (optional)</Label>
                <Input
                  id="blog-cover"
                  value={form.coverImageUrl}
                  onChange={(e) => setForm((f) => ({ ...f, coverImageUrl: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="blog-seo-desc">SEO description (optional)</Label>
              <Textarea
                id="blog-seo-desc"
                rows={2}
                value={form.seoDescription}
                onChange={(e) => setForm((f) => ({ ...f, seoDescription: e.target.value }))}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.published}
                onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))}
              />
              Published (visible on public site)
            </label>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" size="sm" loading={blogBusy} disabled={blogBusy}>
                {editingId ? "Update post" : "Create post"}
              </Button>
              {editingId && (
                <Button type="button" variant="secondary" size="sm" onClick={resetForm} disabled={blogBusy}>
                  Cancel edit
                </Button>
              )}
            </div>
            {blogMsg && (
              <Badge variant={blogMsg.includes("fail") || blogMsg.includes("Could") ? "danger" : "success"}>
                {blogMsg}
              </Badge>
            )}
          </form>

          <div className="border-t border-border pt-4 space-y-2">
            <p className="text-sm font-medium">All posts</p>
            {posts.length === 0 && <p className="text-sm text-muted">No posts yet.</p>}
            <ul className="space-y-2">
              {posts.map((p) => (
                <li
                  key={p.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm"
                >
                  <div>
                    <span className="font-medium">{p.title}</span>
                    <span className="text-muted"> · /blog/{p.slug}</span>
                    {!p.published && (
                      <Badge variant="warn" className="ml-2">
                        Draft
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="secondary" size="sm" onClick={() => startEdit(p)}>
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(p.id)}
                      disabled={blogBusy}
                    >
                      Delete
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card className="border-danger/30">
        <CardContent className="space-y-4 pt-5">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">Admin</h3>
            <Badge variant="warn">Privileged</Badge>
          </div>

          <form onSubmit={handlePromote} className="space-y-3">
            <p className="text-sm text-muted">Promote a user to admin</p>
            <Input
              type="email"
              placeholder="email@example.com"
              value={promoteEmail}
              onChange={(e) => setPromoteEmail(e.target.value)}
              required
            />
            <Button type="submit" variant="secondary" size="sm" loading={busy} disabled={busy}>
              Promote
            </Button>
            {promoteMsg && (
              <Badge variant={promoteMsg.includes("Promoted") ? "success" : "danger"}>
                {promoteMsg}
              </Badge>
            )}
          </form>

          <div className="border-t border-border pt-4 space-y-3">
            <p className="text-sm text-muted">
              Delete all non-admin users and their content (housing, events, messages, comments, etc.).
            </p>
            {!confirmPurge ? (
              <Button variant="danger" size="sm" onClick={() => setConfirmPurge(true)} disabled={busy}>
                Delete all non-admin users…
              </Button>
            ) : (
              <div className="flex flex-wrap gap-2">
                <Button variant="danger" size="sm" loading={busy} disabled={busy} onClick={handlePurge}>
                  Confirm purge
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setConfirmPurge(false)}
                  disabled={busy}
                >
                  Cancel
                </Button>
              </div>
            )}
            {purgeMsg && (
              <Badge variant={purgeMsg.startsWith("Deleted") ? "success" : "danger"}>{purgeMsg}</Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
