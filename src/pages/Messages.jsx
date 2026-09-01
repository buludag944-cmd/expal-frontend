import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MessageSquare } from "lucide-react";
import { useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { getApiBaseUrl } from "../apiConfig";
import Avatar from "../components/ui/Avatar";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { Card } from "../components/ui/Card";
import { cn } from "../lib/cn";
import { markMessageNotificationsRead } from "../lib/notificationsApi";
import { isNativeApp } from "../lib/platform";
import { MobileScreen } from "../components/mobile/MobileShared";

const API = getApiBaseUrl();

function peerName(userLike) {
  if (!userLike) return "Member";
  return `${userLike.firstName || ""} ${userLike.lastName || ""}`.trim() || "Member";
}

function formatListTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function buildThreadsFromConversations(rows, myId) {
  const byPeer = new Map();
  for (const m of rows) {
    const peerId = m.senderId === myId ? m.receiverId : m.senderId;
    const peer =
      m.senderId === myId
        ? m.Receiver || m.peer || { id: peerId, firstName: "", lastName: "" }
        : m.Sender || m.peer || { id: peerId, firstName: "", lastName: "" };
    const t = new Date(m.createdAt || m.created_at || 0).getTime();
    const cur = byPeer.get(peerId);
    if (!cur || t > cur.sortKey) {
      const unreadCount =
        typeof m.unreadCount === "number"
          ? m.unreadCount
          : cur?.unreadCount || 0;
      byPeer.set(peerId, {
        userId: peerId,
        peer: {
          id: peerId,
          firstName: peer.firstName || "",
          lastName: peer.lastName || "",
          profileImage: peer.profileImage || null,
        },
        snippet: (m.content || "").slice(0, 120),
        sortKey: t,
        lastAt: m.createdAt || m.created_at || null,
        lastFromMe: m.senderId === myId,
        unreadCount,
      });
    }
  }
  return Array.from(byPeer.values()).sort((a, b) => b.sortKey - a.sortKey);
}

export default function Messages() {
  const { user, token, logout } = useAuth();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const openedFromSearch = location.state?.openChatWith;
  const native = isNativeApp();

  const [threads, setThreads] = useState([]);
  const [threadsLoading, setThreadsLoading] = useState(true);
  const [threadsError, setThreadsError] = useState("");
  const [listQuery, setListQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [mobileShowChat, setMobileShowChat] = useState(false);

  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState("");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const listBottomRef = useRef(null);
  const pollRef = useRef(null);

  const paramUserId = useMemo(() => {
    const raw = searchParams.get("user");
    if (raw == null || raw === "") return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }, [searchParams]);

  const loadThreads = useCallback(async () => {
    if (!token || !user?.id) return;
    setThreadsLoading(true);
    setThreadsError("");
    try {
      const res = await fetch(`${API}/api/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        logout();
        setThreads([]);
        return;
      }
      if (!res.ok) throw new Error(data.error || `Threads failed (${res.status})`);
      const list = Array.isArray(data) ? data : [];
      setThreads(buildThreadsFromConversations(list, user.id));
    } catch (e) {
      setThreadsError(e.message || "Could not load conversations");
      setThreads([]);
    } finally {
      setThreadsLoading(false);
    }
  }, [token, user?.id, logout]);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  // Light polling so inbox updates when a new DM arrives
  useEffect(() => {
    if (!token || !user?.id) return undefined;
    pollRef.current = window.setInterval(() => {
      loadThreads();
    }, 20000);
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, [token, user?.id, loadThreads]);

  useEffect(() => {
    const sid = openedFromSearch?.id ?? paramUserId;
    if (sid && sid !== user?.id) {
      setSelectedId(sid);
      setMobileShowChat(true);
    }
  }, [openedFromSearch, paramUserId, user?.id]);

  const ensureThreadRow = useCallback(
    (id, label) => {
      if (!id || id === user?.id) return;
      setThreads((prev) => {
        if (prev.some((t) => t.userId === id)) return prev;
        return [
          {
            userId: id,
            peer: { id, firstName: label || "", lastName: "", profileImage: null },
            snippet: label ? "Tap to open chat" : "Start the conversation…",
            sortKey: Date.now(),
            lastAt: null,
            lastFromMe: false,
            unreadCount: 0,
          },
          ...prev,
        ];
      });
    },
    [user?.id]
  );

  useEffect(() => {
    if (openedFromSearch?.id) ensureThreadRow(openedFromSearch.id, openedFromSearch.displayName);
  }, [openedFromSearch, ensureThreadRow]);

  useEffect(() => {
    if (paramUserId && paramUserId !== user?.id) ensureThreadRow(paramUserId, null);
  }, [paramUserId, ensureThreadRow, user?.id]);

  const loadMessages = useCallback(
    async (otherId) => {
      if (!token || !otherId) return;
      setMessagesLoading(true);
      setMessagesError("");
      try {
        const res = await fetch(`${API}/api/messages/${otherId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ({}));
        if (res.status === 401) {
          logout();
          setMessages([]);
          return;
        }
        if (!res.ok) throw new Error(data.error || `Messages failed (${res.status})`);
        setMessages(Array.isArray(data) ? data : []);
        markMessageNotificationsRead(token, otherId).catch(() => {});
        setThreads((prev) =>
          prev.map((t) => (t.userId === otherId ? { ...t, unreadCount: 0 } : t))
        );
      } catch (e) {
        setMessagesError(e.message || "Could not load messages");
        setMessages([]);
      } finally {
        setMessagesLoading(false);
      }
    },
    [token, logout]
  );

  useEffect(() => {
    if (selectedId) loadMessages(selectedId);
    else {
      setMessages([]);
      setMessagesError("");
    }
  }, [selectedId, loadMessages]);

  useEffect(() => {
    listBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedId]);

  async function handleSend(e) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !selectedId || !token || sending) return;
    setSending(true);
    setSendError("");
    try {
      const res = await fetch(`${API}/api/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ receiverId: selectedId, content: text }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        logout();
        return;
      }
      if (!res.ok) throw new Error(data.error || `Send failed (${res.status})`);
      setDraft("");
      setMessages((prev) => [...prev, data]);
      await loadThreads();
    } catch (err) {
      setSendError(err.message || "Send failed");
    } finally {
      setSending(false);
    }
  }

  const selectedThread = threads.find((t) => t.userId === selectedId);
  const displayName = selectedThread ? peerName(selectedThread.peer) : "Conversation";

  const filteredThreads = threads.filter((t) => {
    const q = listQuery.trim().toLowerCase();
    if (!q) return true;
    return peerName(t.peer).toLowerCase().includes(q);
  });

  const selectThread = (id) => {
    setSelectedId(id);
    setMobileShowChat(true);
  };

  const inboxList = (
    <>
      <div className={native ? "mob-body" : "border-b border-border p-3"} style={native ? { paddingTop: 8 } : undefined}>
        <Input
          placeholder="Search conversations…"
          value={listQuery}
          onChange={(e) => setListQuery(e.target.value)}
          aria-label="Search conversations"
        />
      </div>
      {threadsError && (
        <div className={native ? "mob-body" : "px-3 py-2"}>
          <p className="text-sm text-danger" style={{ margin: 0 }}>
            {threadsError}
          </p>
          <button type="button" className={native ? "mob-btn-secondary" : undefined} onClick={loadThreads} style={{ marginTop: 8, minHeight: 44 }}>
            Retry
          </button>
        </div>
      )}
      {threadsLoading ? (
        <p className={native ? "mob-body" : "p-4"} style={{ fontSize: 13, color: "var(--mob-text-muted)" }}>
          Loading conversations…
        </p>
      ) : filteredThreads.length === 0 ? (
        <p className={native ? "mob-body" : "p-4"} style={{ fontSize: 13, color: "var(--mob-text-muted)" }}>
          No conversations yet. Open a member profile and tap Send message, or wait for someone to DM you.
        </p>
      ) : native ? (
        <div className="mob-msg-list" data-no-route-swipe>
          {filteredThreads.map((t) => {
            const name = peerName(t.peer);
            const unread = Number(t.unreadCount) || 0;
            return (
              <button
                key={t.userId}
                type="button"
                className={`mob-msg-row${unread > 0 ? " mob-msg-row--unread" : ""}`}
                onClick={() => selectThread(t.userId)}
              >
                <Avatar src={t.peer?.profileImage} name={name} size="sm" />
                <span style={{ minWidth: 0, flex: 1 }}>
                  <span style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <span style={{ fontWeight: unread > 0 ? 700 : 600, fontSize: 15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {name}
                    </span>
                    <span style={{ fontSize: 11, color: "var(--mob-text-muted)", flexShrink: 0 }}>
                      {formatListTime(t.lastAt)}
                    </span>
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
                    <span
                      style={{
                        flex: 1,
                        fontSize: 12,
                        color: "var(--mob-text-secondary)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        fontWeight: unread > 0 ? 600 : 400,
                      }}
                    >
                      {t.lastFromMe ? "You: " : ""}
                      {t.snippet}
                    </span>
                    {unread > 0 && <span className="mob-msg-unread-badge">{unread > 99 ? "99+" : unread}</span>}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <ul className="flex-1 overflow-y-auto">
          {filteredThreads.map((t) => {
            const name = peerName(t.peer);
            const active = t.userId === selectedId;
            const unread = Number(t.unreadCount) || 0;
            return (
              <li key={t.userId}>
                <button
                  type="button"
                  onClick={() => selectThread(t.userId)}
                  className={cn(
                    "flex w-full items-center gap-3 px-4 py-3 text-left transition ease-out min-h-[44px]",
                    active
                      ? "bg-[color-mix(in_oklab,var(--ms-tint)_55%,transparent)] border-l-2 border-ms"
                      : "hover:bg-surface",
                    unread > 0 && "font-semibold"
                  )}
                >
                  <Avatar src={t.peer?.profileImage} name={name} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="block font-medium truncate">{name}</span>
                      {unread > 0 && (
                        <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-[11px] text-primary-foreground">
                          {unread}
                        </span>
                      )}
                      {active && <span className="badge-ms shrink-0">Active</span>}
                    </span>
                    <span className="block text-xs text-muted truncate">
                      {t.lastFromMe ? "You: " : ""}
                      {t.snippet}
                    </span>
                  </span>
                  <span className="text-[11px] text-muted shrink-0">{formatListTime(t.lastAt)}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );

  const chatPane = !selectedId ? (
    <div className={native ? "mob-body" : "flex flex-1 items-center justify-center p-8 text-muted"}>
      Select a conversation
    </div>
  ) : (
    <>
      {!native && (
        <header className="flex items-center gap-3 border-b border-border px-4 py-3">
          <button
            type="button"
            className="md:hidden text-sm text-primary min-h-[44px]"
            onClick={() => {
              setMobileShowChat(false);
              setSelectedId(null);
            }}
          >
            ← Back
          </button>
          <Avatar src={selectedThread?.peer?.profileImage} name={displayName} size="sm" />
          <span className="font-semibold">{displayName}</span>
        </header>
      )}
      <div className={native ? "mob-msg-thread" : "flex-1 overflow-y-auto p-4 space-y-3"} data-no-route-swipe>
        {messagesLoading ? (
          <p style={{ fontSize: 13, color: "var(--mob-text-muted)" }}>Loading messages…</p>
        ) : messagesError ? (
          <div>
            <Badge variant="danger">{messagesError}</Badge>
            <button type="button" className="mob-btn-secondary" style={{ marginTop: 8, minHeight: 44 }} onClick={() => loadMessages(selectedId)}>
              Retry
            </button>
          </div>
        ) : messages.length === 0 ? (
          <p style={{ fontSize: 13, color: "var(--mob-text-muted)" }}>No messages yet — say hello below.</p>
        ) : (
          messages.map((m) => {
            const mine = m.senderId === user.id;
            return (
              <div
                key={m.id}
                className={native ? undefined : cn("flex", mine ? "justify-end" : "justify-start")}
                style={native ? { display: "flex", justifyContent: mine ? "flex-end" : "flex-start" } : undefined}
              >
                <div
                  className={
                    native
                      ? `mob-msg-bubble ${mine ? "mob-msg-bubble--mine" : "mob-msg-bubble--theirs"}`
                      : cn(
                          "max-w-[70%] rounded-2xl px-4 py-2.5 text-sm shadow-sm",
                          mine
                            ? "bg-primary text-primary-foreground"
                            : "bg-surface border border-border text-foreground"
                        )
                  }
                >
                  {m.content}
                  <p className={native ? "mob-msg-time" : cn("mt-1 text-xs opacity-70", mine ? "text-right" : "")}>
                    {m.createdAt
                      ? new Date(m.createdAt).toLocaleString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : ""}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={listBottomRef} />
      </div>
      <form
        className={native ? "mob-msg-composer" : "flex flex-col gap-2 border-t border-border p-4 sm:flex-row"}
        onSubmit={handleSend}
        data-no-route-swipe
      >
        <Input
          className="flex-1"
          placeholder="Type a message…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          disabled={sending}
          aria-label="Message text"
        />
        <Button type="submit" loading={sending} disabled={sending || !draft.trim()}>
          Send
        </Button>
        {sendError && <Badge variant="danger">{sendError}</Badge>}
      </form>
    </>
  );

  if (native) {
    if (mobileShowChat && selectedId) {
      const composer = (
        <form className="mob-msg-composer" onSubmit={handleSend} data-no-route-swipe>
          <input
            className="mob-search-input"
            style={{ flex: 1, minHeight: 44 }}
            placeholder="Type a message…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            disabled={sending}
            aria-label="Message text"
          />
          <button
            type="submit"
            className="mob-btn-primary"
            style={{ minHeight: 44, padding: "0 16px", flexShrink: 0 }}
            disabled={sending || !draft.trim()}
          >
            {sending ? "…" : "Send"}
          </button>
        </form>
      );
      return (
        <MobileScreen
          title={displayName}
          onBack={() => {
            setMobileShowChat(false);
            setSelectedId(null);
            loadThreads();
          }}
          footer={composer}
          className="mob-screen--messages"
        >
          <div className="mob-msg-thread" data-no-route-swipe>
            {messagesLoading ? (
              <p style={{ fontSize: 13, color: "var(--mob-text-muted)" }}>Loading messages…</p>
            ) : messagesError ? (
              <div>
                <Badge variant="danger">{messagesError}</Badge>
                <button
                  type="button"
                  className="mob-btn-secondary"
                  style={{ marginTop: 8, minHeight: 44 }}
                  onClick={() => loadMessages(selectedId)}
                >
                  Retry
                </button>
              </div>
            ) : messages.length === 0 ? (
              <p style={{ fontSize: 13, color: "var(--mob-text-muted)" }}>No messages yet — say hello below.</p>
            ) : (
              messages.map((m) => {
                const mine = m.senderId === user.id;
                return (
                  <div key={m.id} style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start" }}>
                    <div className={`mob-msg-bubble ${mine ? "mob-msg-bubble--mine" : "mob-msg-bubble--theirs"}`}>
                      {m.content}
                      <p className="mob-msg-time">
                        {m.createdAt
                          ? new Date(m.createdAt).toLocaleString([], {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : ""}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            {sendError && <Badge variant="danger">{sendError}</Badge>}
            <div ref={listBottomRef} />
          </div>
        </MobileScreen>
      );
    }

    return (
      <MobileScreen title="Messages" backTo="/">
        {inboxList}
      </MobileScreen>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <MessageSquare className="h-8 w-8 icon-ms shrink-0" aria-hidden />
        <div>
          <span className="badge-ms">Messages</span>
          <h2 className="page-title mt-1">Messages</h2>
        </div>
      </div>
      <Card className="flex min-h-[min(70vh,560px)] flex-col overflow-hidden md:flex-row">
        <aside
          className={cn(
            "flex w-full flex-col border-b border-border md:w-80 md:border-b-0 md:border-r",
            mobileShowChat && "hidden md:flex"
          )}
        >
          {inboxList}
        </aside>
        <section
          className={cn(
            "flex flex-1 flex-col min-h-0",
            !mobileShowChat && selectedId && "hidden md:flex",
            !selectedId && "flex"
          )}
        >
          {chatPane}
        </section>
      </Card>
    </div>
  );
}
