import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { Card, CardContent } from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input, { Textarea } from "../components/ui/Input";
import Badge from "../components/ui/Badge";
import Avatar from "../components/ui/Avatar";
import {
  deleteForumReply,
  deleteForumThread,
  fetchForumThread,
  postForumReply,
  updateForumReply,
  updateForumThread,
} from "../lib/journeyApi";
import { isNativeApp } from "../lib/platform";
import { MobileScreen } from "../components/mobile/MobileShared";

function authorName(author) {
  return [author?.firstName, author?.lastName].filter(Boolean).join(" ") || "Member";
}

export default function ForumThreadPage() {
  const { threadId } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const native = isNativeApp();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [editingThread, setEditingThread] = useState(false);
  const [threadForm, setThreadForm] = useState({ title: "", body: "" });
  const [editingReplyId, setEditingReplyId] = useState(null);
  const [replyEditBody, setReplyEditBody] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      setError("");
      const json = await fetchForumThread(token, threadId);
      setData(json);
      setThreadForm({ title: json.thread.title, body: json.thread.body });
    } catch (e) {
      setError(e.message || "Could not load thread");
    }
  }, [token, threadId]);

  useEffect(() => {
    load();
  }, [load]);

  const saveThread = async () => {
    setBusy(true);
    try {
      await updateForumThread(token, threadId, threadForm);
      setEditingThread(false);
      setMenuOpen(false);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const removeThread = async () => {
    if (!window.confirm("Delete this thread and all replies?")) return;
    setBusy(true);
    try {
      await deleteForumThread(token, threadId);
      navigate("/community", { replace: true });
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  };

  const submitReply = async (e) => {
    e.preventDefault();
    if (!replyBody.trim() || busy) return;
    setBusy(true);
    try {
      await postForumReply(token, threadId, replyBody.trim());
      setReplyBody("");
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const saveReply = async (replyId) => {
    setBusy(true);
    try {
      await updateForumReply(token, replyId, replyEditBody.trim());
      setEditingReplyId(null);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const removeReply = async (replyId) => {
    if (!window.confirm("Delete this reply?")) return;
    setBusy(true);
    try {
      await deleteForumReply(token, replyId);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (!data) {
    const loading = (
      <div className={native ? "mob-body" : "space-y-4"}>
        {!native && (
          <Link to="/community" className="text-sm text-primary hover:underline">
            ← Back to Community
          </Link>
        )}
        {error ? (
          <div>
            <Badge variant="danger">{error}</Badge>
            <button type="button" className="mob-btn-secondary" style={{ marginTop: 8, minHeight: 44 }} onClick={load}>
              Retry
            </button>
          </div>
        ) : (
          <p className="text-muted">Loading…</p>
        )}
      </div>
    );
    if (native) {
      return (
        <MobileScreen title="Thread" backTo="/community">
          {loading}
        </MobileScreen>
      );
    }
    return loading;
  }

  const { thread, replies } = data;
  const isAuthor = Number(user?.id) === Number(thread.authorId) || user?.isAdmin;

  const threadBody = (
    <>
      {error && <Badge variant="danger">{error}</Badge>}

      <Card className={native ? "mob-card" : undefined} style={native ? { margin: "12px 16px" } : undefined}>
        <CardContent className="pt-4 space-y-3">
          <div className="flex items-start gap-3">
            <Avatar name={authorName(thread.Author)} size="md" />
            <div className="min-w-0 flex-1">
              <div className="text-sm text-muted">{authorName(thread.Author)}</div>
              {thread.cityTag && <div className="text-xs text-muted">{thread.cityTag}</div>}
            </div>
            {isAuthor && (
              <div style={{ position: "relative" }}>
                <button
                  type="button"
                  className="mob-back-btn"
                  aria-label="Post actions"
                  onClick={() => setMenuOpen((v) => !v)}
                  style={{ fontSize: 18 }}
                >
                  ⋯
                </button>
                {menuOpen && (
                  <div
                    style={{
                      position: "absolute",
                      right: 0,
                      top: 36,
                      background: "var(--mob-card, #fff)",
                      border: "1px solid var(--mob-border)",
                      borderRadius: 12,
                      boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                      zIndex: 30,
                      minWidth: 140,
                      overflow: "hidden",
                    }}
                  >
                    <button
                      type="button"
                      style={{ display: "block", width: "100%", textAlign: "left", padding: "12px 14px", border: "none", background: "none", minHeight: 44 }}
                      onClick={() => {
                        setEditingThread(true);
                        setMenuOpen(false);
                      }}
                      disabled={busy}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      style={{ display: "block", width: "100%", textAlign: "left", padding: "12px 14px", border: "none", background: "none", color: "#a32d2d", minHeight: 44 }}
                      onClick={removeThread}
                      disabled={busy}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {editingThread ? (
            <div className="space-y-2">
              <Input
                value={threadForm.title}
                onChange={(e) => setThreadForm({ ...threadForm, title: e.target.value })}
              />
              <Textarea
                rows={5}
                value={threadForm.body}
                onChange={(e) => setThreadForm({ ...threadForm, body: e.target.value })}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={saveThread} loading={busy} disabled={busy}>
                  Save
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setEditingThread(false)} disabled={busy}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-semibold" style={{ margin: 0 }}>
                {thread.title}
              </h1>
              <p className="text-sm whitespace-pre-wrap">{thread.body}</p>
              {!native && isAuthor && (
                <div className="flex gap-2 pt-1">
                  <Button size="sm" variant="secondary" onClick={() => setEditingThread(true)} disabled={busy}>
                    Edit
                  </Button>
                  <Button size="sm" variant="secondary" onClick={removeThread} disabled={busy}>
                    Delete
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <h2
        className="font-semibold text-sm text-muted"
        style={native ? { padding: "8px 16px 4px", margin: 0 } : undefined}
      >
        Replies ({replies.length})
      </h2>

      {replies.length === 0 && (
        <p style={{ fontSize: 13, color: "var(--mob-text-muted)", padding: native ? "0 16px" : undefined }}>
          No replies yet — be the first to comment.
        </p>
      )}

      <div className="space-y-3" style={native ? { padding: "0 16px 16px" } : undefined}>
        {replies.map((r) => {
          const canEdit = Number(user?.id) === Number(r.authorId) || user?.isAdmin;
          return (
            <Card key={r.id} className={native ? "mob-card" : undefined}>
              <CardContent className="pt-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Avatar name={authorName(r.Author)} size="sm" />
                  <span className="text-sm font-medium flex-1">{authorName(r.Author)}</span>
                  {r.updatedAt && r.createdAt && new Date(r.updatedAt) - new Date(r.createdAt) > 2000 && (
                    <span className="text-xs text-muted">edited</span>
                  )}
                </div>
                {editingReplyId === r.id ? (
                  <>
                    <Textarea
                      rows={3}
                      value={replyEditBody}
                      onChange={(e) => setReplyEditBody(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => saveReply(r.id)} loading={busy} disabled={busy}>
                        Save
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => setEditingReplyId(null)}>
                        Cancel
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-sm whitespace-pre-wrap">{r.body}</p>
                    {canEdit && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setEditingReplyId(r.id);
                            setReplyEditBody(r.body);
                          }}
                          disabled={busy}
                        >
                          Edit
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => removeReply(r.id)} disabled={busy}>
                          Delete
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );

  const replyFooter = (
    <form onSubmit={submitReply} className="mob-msg-composer" data-no-route-swipe>
      <Input
        className="flex-1"
        placeholder="Write a reply…"
        value={replyBody}
        onChange={(e) => setReplyBody(e.target.value)}
        disabled={busy}
        aria-label="Reply text"
      />
      <Button type="submit" loading={busy} disabled={busy || !replyBody.trim()}>
        Post
      </Button>
    </form>
  );

  if (native) {
    return (
      <MobileScreen title={thread.title?.slice(0, 28) || "Thread"} backTo="/community" footer={replyFooter}>
        <div data-no-route-swipe>{threadBody}</div>
      </MobileScreen>
    );
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <Link to="/community" className="text-sm font-medium text-primary hover:underline inline-flex min-h-[44px] items-center">
        ← Back to Community
      </Link>
      {threadBody}
      <Card>
        <CardContent className="pt-4">
          <form onSubmit={submitReply} className="space-y-2">
            <Textarea
              placeholder="Write a reply…"
              rows={3}
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              required
            />
            <Button type="submit" loading={busy} disabled={busy}>
              Post reply
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
