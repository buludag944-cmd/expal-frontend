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

const API = getApiBaseUrl();

function peerName(userLike) {
  if (!userLike) return "Member";
  return `${userLike.firstName || ""} ${userLike.lastName || ""}`.trim() || "Member";
}

function buildThreadsFromConversations(rows, myId) {
  const byPeer = new Map();
  for (const m of rows) {
    const peerId = m.senderId === myId ? m.receiverId : m.senderId;
    const peer =
      m.senderId === myId
        ? m.Receiver || { id: peerId, firstName: "", lastName: "" }
        : m.Sender || { id: peerId, firstName: "", lastName: "" };
    const t = new Date(m.createdAt || m.created_at || 0).getTime();
    const cur = byPeer.get(peerId);
    if (!cur || t > cur.sortKey) {
      byPeer.set(peerId, {
        userId: peerId,
        peer,
        snippet: (m.content || "").slice(0, 120),
        sortKey: t,
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
            peer: { id, firstName: label || "", lastName: "" },
            snippet: label ? "Tap to open chat" : "Start the conversation…",
            sortKey: Date.now(),
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
    if (!text || !selectedId || !token) return;
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
  const displayName = selectedThread ? peerName(selectedThread.peer) : "";

  const filteredThreads = threads.filter((t) => {
    const q = listQuery.trim().toLowerCase();
    if (!q) return true;
    return peerName(t.peer).toLowerCase().includes(q);
  });

  const selectThread = (id) => {
    setSelectedId(id);
    setMobileShowChat(true);
  };

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
          <div className="border-b border-border p-3">
            <Input
              placeholder="Search conversations…"
              value={listQuery}
              onChange={(e) => setListQuery(e.target.value)}
              aria-label="Search conversations"
            />
          </div>
          {threadsError && (
            <p className="px-3 py-2 text-sm text-danger">{threadsError}</p>
          )}
          {threadsLoading ? (
            <p className="p-4 text-sm text-muted">Loading conversations…</p>
          ) : filteredThreads.length === 0 ? (
            <p className="p-4 text-sm text-muted">No conversations yet.</p>
          ) : (
            <ul className="flex-1 overflow-y-auto">
              {filteredThreads.map((t) => {
                const name = peerName(t.peer);
                const active = t.userId === selectedId;
                return (
                  <li key={t.userId}>
                    <button
                      type="button"
                      onClick={() => selectThread(t.userId)}
                      className={cn(
                        "flex w-full items-center gap-3 px-4 py-3 text-left transition ease-out min-h-[44px]",
                        active ? "bg-[color-mix(in_oklab,var(--ms-tint)_55%,transparent)] border-l-2 border-ms" : "hover:bg-surface"
                      )}
                    >
                      <Avatar name={name} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="block font-medium truncate">{name}</span>
                          {active && <span className="badge-ms shrink-0">Active</span>}
                        </span>
                        <span className="block text-xs text-muted truncate">{t.snippet}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        <section
          className={cn(
            "flex flex-1 flex-col min-h-0",
            !mobileShowChat && selectedId && "hidden md:flex",
            !selectedId && "flex"
          )}
        >
          {!selectedId ? (
            <div className="flex flex-1 items-center justify-center p-8 text-muted">
              Select a conversation
            </div>
          ) : (
            <>
              <header className="flex items-center gap-3 border-b border-border px-4 py-3">
                <button
                  type="button"
                  className="md:hidden text-sm text-primary min-h-[44px]"
                  onClick={() => setMobileShowChat(false)}
                >
                  ← Back
                </button>
                <Avatar name={displayName} size="sm" />
                <span className="font-semibold">{displayName}</span>
              </header>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messagesLoading ? (
                  <p className="text-sm text-muted">Loading messages…</p>
                ) : messagesError ? (
                  <Badge variant="danger">{messagesError}</Badge>
                ) : messages.length === 0 ? (
                  <p className="text-sm text-muted">No messages yet — say hello below.</p>
                ) : (
                  messages.map((m) => {
                    const mine = m.senderId === user.id;
                    return (
                      <div
                        key={m.id}
                        className={cn("flex", mine ? "justify-end" : "justify-start")}
                      >
                        <div
                          className={cn(
                            "max-w-[70%] rounded-2xl px-4 py-2.5 text-sm shadow-sm",
                            mine
                              ? "bg-primary text-primary-foreground"
                              : "bg-surface border border-border text-foreground"
                          )}
                        >
                          {m.content}
                          <p className={cn("mt-1 text-xs opacity-70", mine ? "text-right" : "")}>
                            {m.createdAt
                              ? new Date(m.createdAt).toLocaleTimeString([], {
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
                className="flex flex-col gap-2 border-t border-border p-4 sm:flex-row"
                onSubmit={handleSend}
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
                {sendError && <Badge variant="danger" className="sm:col-span-2">{sendError}</Badge>}
              </form>
            </>
          )}
        </section>
      </Card>
    </div>
  );
}
