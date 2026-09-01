import React, { useCallback, useEffect, useRef, useState } from "react";
import { getApiBaseUrl } from "../apiConfig";
import Badge from "./ui/Badge";
import Button from "./ui/Button";
import { Textarea } from "./ui/Input";

const DEFAULT_API = getApiBaseUrl();

function commentsCollectionUrl(apiBase) {
  const b = (apiBase || DEFAULT_API).replace(/\/$/, "");
  if (/\/api$/i.test(b)) {
    return `${b}/comments`;
  }
  return `${b}/api/comments`;
}

function authorNameFromUser(user) {
  if (!user) return "";
  const first = (user.firstName ?? "").toString().trim();
  const last = (user.lastName ?? "").toString().trim();
  return `${first} ${last}`.trim();
}

function canEditComment(user, comment) {
  if (!user?.email || !comment?.author) return false;
  if (user.isAdmin) return true;
  return String(user.email).toLowerCase() === String(comment.author).toLowerCase();
}

export default function CommentsSection({
  targetType,
  targetId,
  apiBase = DEFAULT_API,
  pollMs = 8000,
  user = null,
  token = null,
  mobile = false,
}) {
  const [comments, setComments] = useState([]);
  const [draft, setDraft] = useState("");
  const [postError, setPostError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState("");
  const [actionBusy, setActionBusy] = useState(false);

  const cancelledRef = useRef(false);

  const loadComments = useCallback(async () => {
    if (
      targetType == null ||
      targetId == null ||
      targetId === "" ||
      `${targetType}`.trim() === ""
    ) {
      return;
    }
    const root = commentsCollectionUrl(apiBase);
    const url = `${root}/${encodeURIComponent(
      String(targetType).toLowerCase()
    )}/${encodeURIComponent(Number(targetId))}`;
    try {
      const res = await fetch(url);
      const raw = await res.json().catch(() => null);
      if (cancelledRef.current) return;
      if (!res.ok) {
        setComments([]);
        return;
      }
      setComments(Array.isArray(raw) ? raw : []);
    } catch {
      if (!cancelledRef.current) setComments([]);
    }
  }, [targetType, targetId, apiBase]);

  useEffect(() => {
    if (
      targetType == null ||
      targetId == null ||
      targetId === "" ||
      `${targetType}`.trim() === ""
    ) {
      return undefined;
    }

    cancelledRef.current = false;
    loadComments();
    let intervalId = null;
    if (pollMs > 0) {
      intervalId = setInterval(loadComments, pollMs);
    }

    return () => {
      cancelledRef.current = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [targetType, targetId, apiBase, pollMs, loadComments]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPostError("");

    if (!user?.email) {
      setPostError("Log in to post a comment.");
      return;
    }

    const content = draft.trim();
    if (!content) {
      setPostError("Write something first.");
      return;
    }

    const resolvedAuthorName = authorNameFromUser(user);
    const body = {
      content,
      author: user.email,
      targetType: String(targetType).toLowerCase(),
      targetId: Number(targetId),
      ...(resolvedAuthorName ? { authorName: resolvedAuthorName } : {}),
    };

    const postUrl = commentsCollectionUrl(apiBase);
    setSubmitting(true);
    try {
      const res = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const responseText = await res.text();
      let data = null;
      try {
        data = responseText ? JSON.parse(responseText) : null;
      } catch {
        /* non-JSON error body */
      }

      if (res.status === 201) {
        setDraft("");
        await loadComments();
        return;
      }

      const errMsg =
        (data && data.error) || responseText || `Request failed (${res.status})`;
      setPostError(errMsg);
    } catch (err) {
      setPostError(err.message || "Network error submitting comment.");
    } finally {
      setSubmitting(false);
    }
  };

  const saveEdit = async (commentId) => {
    if (!token) return;
    const content = editDraft.trim();
    if (!content) return;
    setActionBusy(true);
    setPostError("");
    try {
      const res = await fetch(`${commentsCollectionUrl(apiBase)}/${commentId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to update comment");
      setEditingId(null);
      await loadComments();
    } catch (err) {
      setPostError(err.message);
    } finally {
      setActionBusy(false);
    }
  };

  const removeComment = async (commentId) => {
    if (!token || !window.confirm("Delete this comment?")) return;
    setActionBusy(true);
    setPostError("");
    try {
      const res = await fetch(`${commentsCollectionUrl(apiBase)}/${commentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok && res.status !== 204) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete comment");
      }
      await loadComments();
    } catch (err) {
      setPostError(err.message);
    } finally {
      setActionBusy(false);
    }
  };

  return (
    <div className={mobile ? "mob-comments" : "space-y-3"}>
      {comments.map((c) => {
        const editable = canEditComment(user, c);
        const authorLabel = c.authorName || (c.author && c.author.split("@")[0]) || "Someone";
        return (
          <div key={c.id} className={mobile ? "mob-comment-item" : "rounded-xl bg-surface px-3 py-2 text-sm"}>
            {mobile ? (
              <span className="mob-comment-author">{authorLabel}</span>
            ) : (
              <a
                href={`mailto:${c.author}`}
                className="font-medium text-primary hover:underline"
              >
                {authorLabel}
              </a>
            )}
            {editingId === c.id ? (
              <div className={mobile ? "mt-2 space-y-2 mob-comment-form" : "mt-2 space-y-2"}>
                {mobile ? (
                  <textarea
                    className="mob-search-input"
                    rows={2}
                    value={editDraft}
                    onChange={(ev) => setEditDraft(ev.target.value)}
                  />
                ) : (
                  <Textarea
                    rows={2}
                    value={editDraft}
                    onChange={(ev) => setEditDraft(ev.target.value)}
                    className="text-sm"
                  />
                )}
                <div className="flex gap-2">
                  {mobile ? (
                    <>
                      <button type="button" className="mob-btn-primary" style={{ height: 32, fontSize: 11 }} onClick={() => saveEdit(c.id)} disabled={actionBusy}>
                        Save
                      </button>
                      <button type="button" className="mob-btn-secondary" style={{ height: 32, fontSize: 11 }} onClick={() => setEditingId(null)} disabled={actionBusy}>
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <Button size="sm" onClick={() => saveEdit(c.id)} loading={actionBusy} disabled={actionBusy}>
                        Save
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => setEditingId(null)} disabled={actionBusy}>
                        Cancel
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <>
                <p className={mobile ? "mt-1" : "mt-1 text-foreground"} style={mobile ? { margin: "4px 0 0", lineHeight: 1.45 } : undefined}>{c.content}</p>
                {editable && token && (
                  <div className="flex gap-2 mt-2">
                    {mobile ? (
                      <>
                        <button
                          type="button"
                          className="mob-btn-secondary"
                          style={{ height: 28, fontSize: 10, padding: "0 10px" }}
                          onClick={() => {
                            setEditingId(c.id);
                            setEditDraft(c.content);
                          }}
                          disabled={actionBusy}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="mob-btn-secondary"
                          style={{ height: 28, fontSize: 10, padding: "0 10px" }}
                          onClick={() => removeComment(c.id)}
                          disabled={actionBusy}
                        >
                          Delete
                        </button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setEditingId(c.id);
                            setEditDraft(c.content);
                          }}
                          disabled={actionBusy}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => removeComment(c.id)}
                          disabled={actionBusy}
                        >
                          Delete
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        );
      })}
      {comments.length === 0 && (
        <p className={mobile ? "" : "text-xs text-muted"} style={mobile ? { fontSize: 11, color: "var(--mob-text-muted)", margin: "0 0 8px" } : undefined}>
          No comments yet — be the first to reply.
        </p>
      )}

      <form onSubmit={handleSubmit} className={mobile ? "mob-comment-form space-y-2" : "space-y-2"}>
        {mobile ? (
          <textarea
            className="mob-search-input"
            rows={2}
            placeholder="Add a comment…"
            value={draft}
            onChange={(ev) => setDraft(ev.target.value)}
          />
        ) : (
          <Textarea
            rows={2}
            placeholder="Add a comment…"
            value={draft}
            onChange={(ev) => setDraft(ev.target.value)}
            className="text-sm"
          />
        )}
        {postError && (
          mobile ? (
            <p style={{ fontSize: 11, color: "#a32d2d", margin: 0 }}>{postError}</p>
          ) : (
            <Badge variant="danger">{postError}</Badge>
          )
        )}
        {mobile ? (
          <button type="submit" className="mob-btn-primary" style={{ height: 36, fontSize: 12 }} disabled={submitting}>
            {submitting ? "Posting…" : "Post comment"}
          </button>
        ) : (
          <Button type="submit" size="sm" loading={submitting} disabled={submitting}>
            Post comment
          </Button>
        )}
      </form>
    </div>
  );
}
