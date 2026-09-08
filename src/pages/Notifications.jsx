import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { isNativeApp } from "../lib/platform";
import {
  deleteNotification,
  deleteReadNotifications,
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  notificationPath,
} from "../lib/notificationsApi";
import { MobileScreen } from "../components/mobile/MobileShared";

function formatWhen(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 60_000) return "Just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return d.toLocaleDateString("en-IE", { month: "short", day: "numeric" });
}

export default function Notifications() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const native = isNativeApp();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const rows = await fetchNotifications(token);
      setItems(rows);
    } catch (err) {
      setError(err.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
    if (!token) return undefined;
    const id = window.setInterval(load, 25000);
    return () => window.clearInterval(id);
  }, [load, token]);

  const openItem = async (n) => {
    try {
      if (!n.isRead) await markNotificationRead(token, n.id);
    } catch {
      /* still navigate */
    }
    setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
    navigate(notificationPath(n));
  };

  const markAll = async () => {
    await markAllNotificationsRead(token);
    setItems((prev) => prev.map((x) => ({ ...x, isRead: true })));
  };

  const removeOne = async (n, e) => {
    e?.stopPropagation?.();
    if (!n.isRead) return;
    setBusyId(n.id);
    try {
      await deleteNotification(token, n.id);
      setItems((prev) => prev.filter((x) => x.id !== n.id));
    } catch (err) {
      setError(err.message || "Could not delete");
    } finally {
      setBusyId(null);
    }
  };

  const clearRead = async () => {
    const count = items.filter((n) => n.isRead).length;
    if (!count) return;
    if (!window.confirm(`Delete ${count} read notification${count === 1 ? "" : "s"}?`)) return;
    try {
      await deleteReadNotifications(token);
      setItems((prev) => prev.filter((n) => !n.isRead));
    } catch (err) {
      setError(err.message || "Could not delete read notifications");
    }
  };

  const hasUnread = items.some((n) => !n.isRead);
  const hasRead = items.some((n) => n.isRead);

  const body = (
    <>
      {error && (
        <div className={native ? undefined : "rounded-lg border border-red-200 bg-red-50 p-4 mb-4 dark:bg-red-950/30 dark:border-red-900"}>
          <p style={{ color: "#a32d2d", fontSize: 13, margin: 0 }}>{error}</p>
          <button
            type="button"
            className={native ? "mob-btn-secondary" : "text-sm font-medium underline mt-2"}
            style={native ? { marginTop: 8, minHeight: 44 } : undefined}
            onClick={load}
          >
            Retry
          </button>
        </div>
      )}
      {loading && <p style={{ color: "var(--mob-text-muted)", fontSize: 13 }}>Loading…</p>}
      {!loading && !error && items.length === 0 && (
        <p style={{ color: "var(--mob-text-muted)", fontSize: 13, lineHeight: 1.45 }}>
          You&apos;re all caught up. New messages, replies, and community activity will show up here.
        </p>
      )}
      {!loading && hasRead && (
        <div style={{ marginBottom: 12 }}>
          <button
            type="button"
            className={native ? "mob-btn-secondary" : "text-sm underline text-muted"}
            style={native ? { width: "100%", minHeight: 40 } : undefined}
            onClick={clearRead}
          >
            Delete read notifications
          </button>
        </div>
      )}
      <div className={native ? "" : "space-y-2"}>
        {items.map((n) => (
          <div
            key={n.id}
            className={native ? "mob-card" : "rounded-xl border border-black/10 bg-white dark:bg-[rgb(var(--card))]"}
            style={
              native
                ? {
                    display: "flex",
                    gap: 8,
                    alignItems: "stretch",
                    border: n.isRead ? undefined : "1px solid var(--mob-purple-border)",
                    background: n.isRead ? undefined : "var(--mob-purple-light)",
                    marginBottom: 10,
                    padding: 0,
                    overflow: "hidden",
                  }
                : {
                    display: "flex",
                    gap: 0,
                    background: n.isRead ? undefined : "rgba(83, 74, 183, 0.08)",
                    borderColor: n.isRead ? undefined : "rgba(83, 74, 183, 0.35)",
                  }
            }
          >
            <button
              type="button"
              onClick={() => openItem(n)}
              className={native ? undefined : "flex-1 text-left p-4"}
              style={
                native
                  ? {
                      flex: 1,
                      textAlign: "left",
                      border: "none",
                      background: "transparent",
                      padding: 14,
                      cursor: "pointer",
                      minWidth: 0,
                    }
                  : undefined
              }
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
                <strong style={{ fontSize: 14 }}>{n.title}</strong>
                <span style={{ fontSize: 11, color: "var(--mob-text-muted)", flexShrink: 0 }}>
                  {formatWhen(n.createdAt)}
                </span>
              </div>
              {n.body ? (
                <p style={{ margin: 0, fontSize: 13, color: "var(--mob-text-secondary)", lineHeight: 1.4 }}>
                  {n.body}
                </p>
              ) : null}
              {!n.isRead && (
                <span
                  style={{
                    display: "inline-block",
                    marginTop: 8,
                    fontSize: 10,
                    fontWeight: 700,
                    color: "var(--mob-purple)",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  Unread
                </span>
              )}
            </button>
            {n.isRead && (
              <button
                type="button"
                aria-label="Delete notification"
                disabled={busyId === n.id}
                onClick={(e) => removeOne(n, e)}
                className={native ? undefined : "px-3 text-sm text-muted hover:text-red-600 shrink-0"}
                style={
                  native
                    ? {
                        border: "none",
                        borderLeft: "0.5px solid var(--mob-border)",
                        background: "transparent",
                        color: "var(--mob-red-dark)",
                        padding: "0 14px",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                        minWidth: 64,
                      }
                    : undefined
                }
              >
                {busyId === n.id ? "…" : "Delete"}
              </button>
            )}
          </div>
        ))}
      </div>
    </>
  );

  if (native) {
    return (
      <MobileScreen
        title="Notifications"
        backTo="/"
        action={
          hasUnread ? (
            <button type="button" className="mob-back-btn" style={{ background: "none", fontSize: 12, width: "auto", padding: "0 6px" }} onClick={markAll}>
              Read all
            </button>
          ) : hasRead ? (
            <button type="button" className="mob-back-btn" style={{ background: "none", fontSize: 12, width: "auto", padding: "0 6px" }} onClick={clearRead}>
              Clear
            </button>
          ) : (
            <span className="mob-back-btn--placeholder w-8" />
          )
        }
      >
        <div className="mob-body" style={{ paddingTop: 12 }}>
          {body}
        </div>
      </MobileScreen>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold m-0">Notifications</h1>
          <p className="text-muted m-0 mt-1 text-sm">Messages, replies, and community updates</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {hasUnread && (
            <button type="button" className="text-sm underline" onClick={markAll}>
              Mark all read
            </button>
          )}
          {hasRead && (
            <button type="button" className="text-sm underline" onClick={clearRead}>
              Delete read
            </button>
          )}
          <Link to="/" className="text-sm underline">
            Home
          </Link>
        </div>
      </div>
      {body}
    </div>
  );
}
