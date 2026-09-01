import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../AuthContext";
import { getApiBaseUrl } from "../../apiConfig";
import { fetchForumSpaces, fetchForumThreads } from "../../lib/journeyApi";
import {
  MobileScreen,
  MobileSectionTitle,
  MobileBadge,
  MobileFab,
  MobilePostSheet,
} from "../../components/mobile/MobileShared";
import CommentsSection from "../../components/CommentsSection";
import { useLocalTabSwipe } from "../../hooks/useSwipeNav";

const TABS = ["Events", "Threads", "Groups"];
const API = getApiBaseUrl();

function formatEventDate(dateStr) {
  if (!dateStr) return { month: "—", day: "?" };
  const d = new Date(dateStr);
  return {
    month: d.toLocaleDateString("en-IE", { month: "short" }).toUpperCase(),
    day: String(d.getDate()),
  };
}

function forumSpaceEmoji(name = "") {
  const n = name.toLowerCase();
  if (n.includes("app") || n.includes("general")) return "📱";
  if (n.includes("bank")) return "🏦";
  if (n.includes("career") || n.includes("work")) return "💼";
  if (n.includes("family") || n.includes("kid")) return "👨‍👩‍👧";
  if (n.includes("health")) return "🏥";
  if (n.includes("housing") || n.includes("rent")) return "🏠";
  if (n.includes("tax") || n.includes("finance")) return "📊";
  if (n.includes("legal") || n.includes("visa")) return "⚖️";
  if (n.includes("social") || n.includes("meet")) return "🤝";
  return "💬";
}

export default function MobileCommunity({ initialTab }) {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tabFromUrl = initialTab || searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(() =>
    tabFromUrl && TABS.includes(tabFromUrl) ? tabFromUrl : "Threads"
  );
  const [search, setSearch] = useState("");
  const [showPost, setShowPost] = useState(false);
  const [events, setEvents] = useState([]);
  const [spaces, setSpaces] = useState([]);
  const [spaceId, setSpaceId] = useState(null);
  const [threads, setThreads] = useState([]);
  const [newThread, setNewThread] = useState({ title: "", body: "" });
  const [eventForm, setEventForm] = useState({ title: "", description: "", date: "", location: "" });
  const [editingEventId, setEditingEventId] = useState(null);
  const [postError, setPostError] = useState("");

  const resetEventForm = () => {
    setEventForm({ title: "", description: "", date: "", location: "" });
    setEditingEventId(null);
  };

  const canModifyEvent = (ev) =>
    user && (Number(ev.createdBy) === Number(user.id) || user.isAdmin);

  const startEditEvent = (ev) => {
    const d = ev.date ? new Date(ev.date) : new Date();
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setEditingEventId(ev.id);
    setEventForm({
      title: ev.title || "",
      description: ev.description || "",
      date: local,
      location: ev.location || "",
    });
    setPostError("");
    setShowPost(true);
  };

  const deleteEvent = async (id) => {
    if (!token || !window.confirm("Delete this event?")) return;
    setPostError("");
    try {
      const res = await fetch(`${API}/api/events/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok && res.status !== 204) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Delete failed");
      }
      setEvents((prev) => prev.filter((ev) => ev.id !== id));
      if (editingEventId === id) {
        setShowPost(false);
        resetEventForm();
      }
    } catch (err) {
      setPostError(err.message);
    }
  };

  useEffect(() => {
    if (tabFromUrl && TABS.includes(tabFromUrl) && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl, activeTab]);

  const loadEvents = () => {
    fetch(`${API}/api/events`)
      .then((r) => r.json())
      .then(setEvents)
      .catch(() => setEvents([]));
  };

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    fetchForumSpaces(token).then((list) => {
      setSpaces(list);
      if (list.length && !spaceId) {
        const appGeneral = list.find((s) => /app general/i.test(s.name || ""));
        setSpaceId((appGeneral || list[0]).id);
      }
    });
  }, [token, spaceId]);

  useEffect(() => {
    if (spaceId) fetchForumThreads(token, spaceId).then(setThreads);
  }, [token, spaceId]);

  const createThread = async (e) => {
    e.preventDefault();
    setPostError("");
    if (!spaceId) {
      setPostError("Select a forum group first.");
      return;
    }
    const res = await fetch(`${API}/api/journey/forums/threads`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ spaceId, ...newThread }),
    });
    if (res.ok) {
      setShowPost(false);
      setNewThread({ title: "", body: "" });
      setThreads(await fetchForumThreads(token, spaceId));
    } else {
      const data = await res.json().catch(() => ({}));
      setPostError(data.error || "Could not post thread");
    }
  };

  const postEvent = async (e) => {
    e.preventDefault();
    setPostError("");
    if (!token) {
      setPostError("Sign in to post an event.");
      return;
    }
    const isEditing = editingEventId != null;
    const res = await fetch(isEditing ? `${API}/api/events/${editingEventId}` : `${API}/api/events`, {
      method: isEditing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        title: eventForm.title.trim(),
        description: eventForm.description.trim(),
        date: eventForm.date,
        location: eventForm.location.trim(),
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setPostError(data.error || "Could not save event");
      return;
    }
    setShowPost(false);
    resetEventForm();
    loadEvents();
  };

  const q = search.toLowerCase();
  const filteredEvents = events.filter(
    (e) => !q || (e.title || "").toLowerCase().includes(q) || (e.location || "").toLowerCase().includes(q)
  );
  const filteredThreads = threads.filter(
    (t) => !q || (t.title || "").toLowerCase().includes(q) || (t.body || "").toLowerCase().includes(q)
  );
  const filteredGroups = spaces.filter((s) => !q || (s.name || "").toLowerCase().includes(q));
  const activeSpace = spaces.find((s) => s.id === spaceId);
  const canPost = activeTab === "Threads" || activeTab === "Events";

  const openPost = () => {
    if (!canPost) {
      setPostError("Switch to Threads or Events to post.");
      return;
    }
    setPostError("");
    if (activeTab === "Events") resetEventForm();
    setShowPost(true);
  };

  const closePost = () => {
    setShowPost(false);
    if (activeTab === "Events") resetEventForm();
  };

  const selectTab = (tab) => {
    setActiveTab(tab);
    setShowPost(false);
    setPostError("");
    const next = new URLSearchParams(searchParams);
    if (tab === "Threads") {
      next.delete("tab");
    } else {
      next.set("tab", tab);
    }
    navigate({ pathname: "/community", search: next.toString() ? `?${next.toString()}` : "" }, { replace: true });
  };

  const selectGroup = (id) => {
    setSpaceId(id);
    if (activeTab === "Groups") selectTab("Threads");
  };

  const { onTouchStart, onTouchMove, onTouchEnd } = useLocalTabSwipe(TABS, activeTab, selectTab);

  return (
    <div className="mob-page-stack">
      <MobileScreen
        title="Community"
        action={
          canPost ? (
            <button
              type="button"
              className="mob-back-btn"
              style={{ background: "none", fontSize: 22 }}
              onClick={() => (showPost ? closePost() : openPost())}
              aria-label={activeTab === "Events" ? "Post event" : "New thread"}
            >
              {showPost ? "✕" : "＋"}
            </button>
          ) : (
            <span className="mob-back-btn--placeholder w-8" />
          )
        }
        chromeExtra={
          <>
            <div className="mob-search-wrap">
              <input
                className="mob-search-input"
                placeholder={`Search ${activeTab.toLowerCase()}...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="mob-chip-scroll" style={{ paddingTop: 4, paddingBottom: 10 }}>
              <button type="button" className="mob-chip" onClick={() => navigate("/referrals")}>
                Referrals
              </button>
              <button type="button" className="mob-chip" onClick={() => navigate("/users")}>
                Members
              </button>
              <button type="button" className="mob-chip" onClick={() => navigate("/search")}>
                Search
              </button>
            </div>

        <div className="mob-tab-row" data-no-route-swipe onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              className={`mob-tab-btn${activeTab === t ? " mob-tab-btn--on" : ""}`}
              onClick={() => selectTab(t)}
            >
              {t}
            </button>
          ))}
        </div>
          </>
        }
      >
        <div>
          {postError && !showPost && (
            <p style={{ color: "#a32d2d", fontSize: 12, margin: "0 0 12px" }}>{postError}</p>
          )}
        {activeTab === "Events" && (
          <>
            <MobileSectionTitle>Upcoming near {user?.destinationCity || "you"}</MobileSectionTitle>
            {filteredEvents.length === 0 && (
              <p style={{ fontSize: 12, color: "var(--mob-text-muted)" }}>No events yet — tap ＋ to add one.</p>
            )}
            {filteredEvents.map((e) => {
              const { month, day } = formatEventDate(e.date);
              return (
                <div key={e.id} className="mob-event-card mob-card">
                  <div className="mob-event-date">
                    <span className="mob-event-month">{month}</span>
                    <span className="mob-event-day">{day}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p className="mob-event-title">{e.title}</p>
                    <p className="mob-event-loc">📍 {e.location || "TBA"}</p>
                    {e.description && (
                      <p style={{ fontSize: 12, color: "var(--mob-text-secondary)", margin: "6px 0", lineHeight: 1.4 }}>
                        {e.description}
                      </p>
                    )}
                    {canModifyEvent(e) && (
                      <div className="mob-content-actions">
                        <button type="button" className="mob-btn-secondary" onClick={() => startEditEvent(e)}>
                          Edit
                        </button>
                        <button type="button" className="mob-btn-secondary mob-btn-danger" onClick={() => deleteEvent(e.id)}>
                          Delete
                        </button>
                      </div>
                    )}
                    <CommentsSection
                      targetType="event"
                      targetId={e.id}
                      apiBase={API}
                      user={user}
                      token={token}
                      mobile
                    />
                  </div>
                </div>
              );
            })}
          </>
        )}

        {activeTab === "Threads" && (
          <>
            {activeSpace && (
              <p style={{ fontSize: 11, color: "var(--mob-text-muted)", margin: "0 0 8px" }}>
                Forum: {activeSpace.name} · change in Groups tab
              </p>
            )}
            <MobileSectionTitle>Hot discussions</MobileSectionTitle>
            {filteredThreads.length === 0 && (
              <p style={{ fontSize: 12, color: "var(--mob-text-muted)" }}>No threads yet — tap ＋ to start one.</p>
            )}
            {filteredThreads.map((t) => {
              const author = [t.Author?.firstName, t.Author?.lastName].filter(Boolean).join(" ") || "Member";
              return (
                <button
                  key={t.id}
                  type="button"
                  className="mob-thread-card mob-card w-full text-left"
                  onClick={() => navigate(`/community/thread/${t.id}`)}
                >
                  <div className="mob-thread-top">
                    <p className="mob-thread-title">{t.title}</p>
                    {(t.replyCount || 0) > 5 && <MobileBadge label="🔥 Hot" color="amber" />}
                  </div>
                  <p style={{ fontSize: 12, color: "var(--mob-text-muted)", margin: "0 0 8px", lineHeight: 1.4 }}>
                    {t.body?.slice(0, 100)}
                    {(t.body?.length || 0) > 100 ? "…" : ""}
                  </p>
                  <div className="mob-thread-footer">
                    <span>{author}</span>
                    <span>💬 {t.replyCount || 0} replies</span>
                  </div>
                </button>
              );
            })}
          </>
        )}

        {activeTab === "Groups" && (
          <>
            <MobileSectionTitle>Forum spaces</MobileSectionTitle>
            {filteredGroups.length === 0 && (
              <p style={{ fontSize: 12, color: "var(--mob-text-muted)" }}>No forum spaces available.</p>
            )}
            {filteredGroups.map((g) => (
              <div key={g.id} className="mob-group-card mob-card">
                <div className="mob-group-emoji">{forumSpaceEmoji(g.name)}</div>
                <div style={{ flex: 1 }}>
                  <p className="mob-ref-name">{g.name}</p>
                  <p className="mob-ref-role">{g.description || "Expat forum space"}</p>
                </div>
                <button
                  type="button"
                  className={`mob-join-btn${spaceId === g.id ? " mob-join-btn--on" : ""}`}
                  onClick={() => selectGroup(g.id)}
                >
                  {spaceId === g.id ? "Active" : "Select"}
                </button>
              </div>
            ))}
            <p style={{ fontSize: 11, color: "var(--mob-text-muted)", marginTop: 8 }}>
              Tap Select on a forum — you&apos;ll jump to Threads to read and post.
            </p>
          </>
        )}
        </div>
      </MobileScreen>

      <MobileFab
        onClick={openPost}
        label={activeTab === "Events" ? "Post event" : "New thread"}
        visible={canPost && !showPost}
      />

      <MobilePostSheet
        open={showPost && canPost}
        onClose={closePost}
        title={activeTab === "Events" ? (editingEventId ? "Edit event" : "Add an event") : "New thread"}
      >
        {activeTab === "Threads" ? (
          <form onSubmit={createThread} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {activeSpace && (
              <p style={{ fontSize: 12, color: "var(--mob-text-muted)", margin: 0 }}>
                Posting in: {activeSpace.name}
              </p>
            )}
            <input className="mob-search-input" placeholder="Title" value={newThread.title} onChange={(e) => setNewThread({ ...newThread, title: e.target.value })} required />
            <textarea className="mob-search-input" placeholder="What's on your mind?" value={newThread.body} onChange={(e) => setNewThread({ ...newThread, body: e.target.value })} required />
            {postError && <p style={{ color: "#a32d2d", fontSize: 12, margin: 0 }}>{postError}</p>}
            <button type="submit" className="mob-btn-primary" style={{ height: 44 }}>Post thread</button>
          </form>
        ) : (
          <form onSubmit={postEvent} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input className="mob-search-input" placeholder="Title" value={eventForm.title} onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })} required />
            <textarea className="mob-search-input" placeholder="Description" value={eventForm.description} onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })} required />
            <input className="mob-search-input" type="datetime-local" value={eventForm.date} onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })} required />
            <input className="mob-search-input" placeholder="Location" value={eventForm.location} onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })} required />
            {postError && <p style={{ color: "#a32d2d", fontSize: 12, margin: 0 }}>{postError}</p>}
            <button type="submit" className="mob-btn-primary" style={{ height: 44 }}>
              {editingEventId ? "Save changes" : "Post event"}
            </button>
          </form>
        )}
      </MobilePostSheet>
    </div>
  );
}
