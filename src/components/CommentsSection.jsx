import React, { useCallback, useEffect, useRef, useState } from "react";
import { getApiBaseUrl } from "../apiConfig";
import Badge from "./ui/Badge";
import Button from "./ui/Button";
import { Textarea } from "./ui/Input";

const DEFAULT_API = getApiBaseUrl();

/** Base URL for the comments collection: .../api/comments (avoids /api/api/comments if apiBase already ends with /api). */
function commentsCollectionUrl(apiBase) {
  const b = (apiBase || DEFAULT_API).replace(/\/$/, "");
  if (/\/api$/i.test(b)) {
    return `${b}/comments`;
  }
  return `${b}/api/comments`;
}

/** AuthContext profile uses firstName/lastName; sent as authorName beside author (email) on POST. */
function authorNameFromUser(user) {
  if (!user) return "";
  const first = (user.firstName ?? "").toString().trim();
  const last = (user.lastName ?? "").toString().trim();
  return `${first} ${last}`.trim();
}

// Loads GET /api/comments/:targetType/:targetId for event | listing | referral | essential | knowhow.
// Wired POST to /api/comments with JSON + Content-Type; normalized apiBase to prevent doubled /api; reload on 201.
export default function CommentsSection({
  targetType,
  targetId,
  apiBase = DEFAULT_API,
  pollMs = 8000,
  user = null,
}) {
  const [comments, setComments] = useState([]);
  const [draft, setDraft] = useState("");
  const [postError, setPostError] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
        console.warn("[CommentsSection] GET not OK:", res.status, raw);
        setComments([]);
        return;
      }
      const data = Array.isArray(raw) ? raw : [];
      setComments(data);
    } catch (e) {
      console.error("[CommentsSection] fetch failed:", e);
      if (!cancelledRef.current) setComments([]);
    }
  }, [targetType, targetId, apiBase]);

  useEffect(() => {
    console.log("[CommentsSection] props targetType, targetId =", targetType, targetId);

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

    console.log("[CommentsSection] POST body", body);

    const postUrl = commentsCollectionUrl(apiBase);
    console.log("[CommentsSection] POST URL (exact)", postUrl);

    setSubmitting(true);
    try {
      const res = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const responseText = await res.text();
      console.log(
        "[CommentsSection] POST status",
        res.status,
        "response text",
        responseText
      );

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
      console.error("[CommentsSection] POST failed:", err);
      setPostError(err.message || "Network error submitting comment.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      {comments.map((c) => (
        <div key={c.id} className="rounded-xl bg-surface px-3 py-2 text-sm">
          <a
            href={`mailto:${c.author}`}
            className="font-medium text-primary hover:underline"
          >
            {c.authorName || (c.author && c.author.split("@")[0]) || "Someone"}
          </a>
          <p className="mt-1 text-foreground">{c.content}</p>
        </div>
      ))}
      {comments.length === 0 && (
        <p className="text-xs text-muted">No comments yet.</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-2">
        <Textarea
          rows={2}
          placeholder="Add a comment…"
          value={draft}
          onChange={(ev) => setDraft(ev.target.value)}
          className="text-sm"
        />
        {postError && <Badge variant="danger">{postError}</Badge>}
        <Button type="submit" size="sm" loading={submitting} disabled={submitting}>
          Post comment
        </Button>
      </form>
    </div>
  );
}
