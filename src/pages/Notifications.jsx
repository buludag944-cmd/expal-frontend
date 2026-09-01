import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { isNativeApp } from "../lib/platform";
import {
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
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function Notifications() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const native = isNativeApp();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
      <div className={native ? "" : "space-y-2"}>
        {items.map((n) => (
          <button
            key={n.id}
            type="button"
            onClick={() => openItem(n)}
            className={native ? "mob-card" : "w-full text-left rounded-xl border border-black/10 bg-white p-4 dark:bg-[rgb(var(--card))]"}
            style={
              native
                ? {
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    border: n.isRead ? undefined : "1px solid var(--mob-purple-border)",
                    background: n.isRead ? undefined : "var(--mob-purple-light)",
                    marginBottom: 10,
                    cursor: "pointer",
                  }
                : {
                    background: n.isRead ? undefined : "rgba(83, 74, 183, 0.08)",
                    borderColor: n.isRead ? undefined : "rgba(83, 74, 183, 0.35)",
                  }
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
          items.some((n) => !n.isRead) ? (
            <button type="button" className="mob-back-btn" style={{ background: "none", fontSize: 12, width: "auto", padding: "0 6px" }} onClick={markAll}>
              Read all
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
        <div className="flex items-center gap-2">
          {items.some((n) => !n.isRead) && (
            <button type="button" className="text-sm underline" onClick={markAll}>
              Mark all read
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
