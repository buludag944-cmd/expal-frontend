import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { fetchSearch } from "../lib/searchApi";
import { isNativeApp } from "../lib/platform";
import ProfileAvatar from "../components/ProfileAvatar";
import Avatar from "../components/ui/Avatar";
import { MobileScreen, MobileSectionTitle } from "../components/mobile/MobileShared";

const FILTERS = ["All", "Members", "Topics"];

function memberName(m) {
  return `${m.firstName || ""} ${m.lastName || ""}`.trim() || "Member";
}

function authorName(a) {
  if (!a) return "Member";
  return `${a.firstName || ""} ${a.lastName || ""}`.trim() || "Member";
}

function useDebounced(value, ms = 320) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), ms);
    return () => window.clearTimeout(id);
  }, [value, ms]);
  return debounced;
}

function SearchResults({ filter, members, threads, loading, error, query, userId, onMember, onThread, native }) {
  const showMembers = filter === "All" || filter === "Members";
  const showTopics = filter === "All" || filter === "Topics";
  const hasQuery = query.trim().length > 0;

  if (!hasQuery) {
    return (
      <p className={native ? "mob-search-hint" : "text-sm text-muted"}>
        Search members by name, city, or industry — or community topics by title and content.
      </p>
    );
  }

  if (loading) {
    return <p className={native ? "mob-search-hint" : "text-sm text-muted"}>Searching…</p>;
  }

  if (error) {
    return (
      <p className={native ? "mob-search-error" : "text-sm text-danger"} role="alert">
        {error}
      </p>
    );
  }

  const empty = (!showMembers || members.length === 0) && (!showTopics || threads.length === 0);

  if (empty) {
    return (
      <p className={native ? "mob-search-hint" : "text-sm text-muted"}>
        No results for &ldquo;{query}&rdquo;. Try a different name or topic keyword.
      </p>
    );
  }

  return (
    <>
      {showMembers && members.length > 0 && (
        <section className={native ? "mob-search-section" : "space-y-3"}>
          {native ? (
            <MobileSectionTitle>Members ({members.length})</MobileSectionTitle>
          ) : (
            <h3 className="text-sm font-semibold text-foreground">Members ({members.length})</h3>
          )}
          <div className={native ? undefined : "grid gap-3"}>
            {members.map((profile) => {
              const name = memberName(profile);
              const isSelf = Number(profile.id) === Number(userId);
              if (native) {
                return (
                  <button
                    key={profile.id}
                    type="button"
                    className="mob-member-card mob-card w-full text-left"
                    onClick={() => onMember(profile)}
                    disabled={isSelf}
                    style={isSelf ? { opacity: 0.75 } : undefined}
                  >
                    <div className="mob-ref-top">
                      <ProfileAvatar
                        src={profile.profileImage}
                        name={name}
                        userId={profile.id}
                        className="mob-member-avatar"
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p className="mob-ref-name">
                          {name}
                          {isSelf ? " (you)" : ""}
                        </p>
                        <p className="mob-ref-role">
                          {[profile.nationality, profile.currentCity].filter(Boolean).join(" · ") ||
                            "Community member"}
                        </p>
                      </div>
                      {!isSelf && <span className="mob-member-msg">›</span>}
                    </div>
                  </button>
                );
              }
              return (
                <div key={profile.id} className="item-card flex gap-4">
                  <Avatar src={profile.profileImage} name={name} size="lg" />
                  <div className="flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={() => onMember(profile)}
                      className="font-semibold text-left hover:underline"
                      disabled={isSelf}
                    >
                      {name}
                      {isSelf ? " (you)" : ""}
                    </button>
                    <p className="text-sm text-muted">
                      {[profile.nationality, profile.currentCity, profile.industry]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    {!isSelf && (
                      <button
                        type="button"
                        className="text-sm text-primary mt-1"
                        onClick={() => onMember(profile, true)}
                      >
                        Message
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {showTopics && threads.length > 0 && (
        <section className={native ? "mob-search-section" : "space-y-3 mt-6"}>
          {native ? (
            <MobileSectionTitle>Topics ({threads.length})</MobileSectionTitle>
          ) : (
            <h3 className="text-sm font-semibold text-foreground">Topics ({threads.length})</h3>
          )}
          <div className={native ? undefined : "grid gap-3"}>
            {threads.map((thread) => {
              const snippet = (thread.body || "").replace(/\s+/g, " ").slice(0, 120);
              if (native) {
                return (
                  <button
                    key={thread.id}
                    type="button"
                    className="mob-card w-full text-left mob-search-thread"
                    onClick={() => onThread(thread.id)}
                  >
                    <p className="mob-ref-name">{thread.title}</p>
                    <p className="mob-ref-role">
                      {thread.spaceName ? `${thread.spaceName} · ` : ""}
                      {authorName(thread.author)}
                      {thread.replyCount ? ` · ${thread.replyCount} replies` : ""}
                    </p>
                    {snippet && (
                      <p className="mob-search-snippet">{snippet}{thread.body?.length > 120 ? "…" : ""}</p>
                    )}
                  </button>
                );
              }
              return (
                <button
                  key={thread.id}
                  type="button"
                  className="item-card text-left w-full"
                  onClick={() => onThread(thread.id)}
                >
                  <p className="font-semibold">{thread.title}</p>
                  <p className="text-xs text-muted mt-1">
                    {thread.spaceName ? `${thread.spaceName} · ` : ""}
                    {authorName(thread.author)}
                    {thread.replyCount ? ` · ${thread.replyCount} replies` : ""}
                  </p>
                  {snippet && <p className="text-sm text-muted mt-2 line-clamp-2">{snippet}…</p>}
                </button>
              );
            })}
          </div>
        </section>
      )}
    </>
  );
}

export default function SearchPage({ backTo }) {
  const native = isNativeApp();
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [filter, setFilter] = useState("All");
  const [members, setMembers] = useState([]);
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const debouncedQuery = useDebounced(query);

  const runSearch = useCallback(async () => {
    const q = debouncedQuery.trim();
    if (!token) return;
    if (!q) {
      setMembers([]);
      setThreads([]);
      setError("");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await fetchSearch(token, q);
      setMembers(data.members);
      setThreads(data.threads);
    } catch (e) {
      if (String(e.message || "").includes("401")) {
        logout();
      }
      setError(e.message || "Search failed");
      setMembers([]);
      setThreads([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, token, logout]);

  useEffect(() => {
    runSearch();
  }, [runSearch]);

  useEffect(() => {
    const q = debouncedQuery.trim();
    if (q) {
      setSearchParams({ q }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  }, [debouncedQuery, setSearchParams]);

  const openMember = useCallback(
    (profile, message = false) => {
      if (!profile?.id) return;
      if (message) {
        const displayName = memberName(profile);
        navigate(`/messages?user=${profile.id}`, {
          state: { openChatWith: { id: profile.id, displayName } },
        });
        return;
      }
      navigate(`/members/${profile.id}`, { state: { profile } });
    },
    [navigate]
  );

  const openThread = useCallback(
    (threadId) => {
      navigate(`/community/thread/${threadId}`);
    },
    [navigate]
  );

  const resolvedBack = backTo ?? (native ? "/" : "/community");

  const filterChips = (
    <div className={native ? "mob-chip-scroll mob-search-filters" : "flex gap-2 flex-wrap mb-4"}>
      {FILTERS.map((f) => (
        <button
          key={f}
          type="button"
          className={native ? `mob-chip${filter === f ? " mob-chip--on" : ""}` : undefined}
          style={
            native
              ? undefined
              : {
                  padding: "6px 12px",
                  borderRadius: 999,
                  border: "1px solid var(--border)",
                  background: filter === f ? "var(--primary)" : "var(--card)",
                  color: filter === f ? "#fff" : "inherit",
                  fontSize: 13,
                }
          }
          onClick={() => setFilter(f)}
        >
          {f}
        </button>
      ))}
    </div>
  );

  const searchInput = (
    <input
      className={native ? "mob-search-input" : "form-input w-full"}
      placeholder="Search members or community topics…"
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      aria-label="Search members and topics"
      autoFocus={!native}
    />
  );

  const results = (
    <SearchResults
      filter={filter}
      members={members}
      threads={threads}
      loading={loading}
      error={error}
      query={debouncedQuery}
      userId={user?.id}
      onMember={openMember}
      onThread={openThread}
      native={native}
    />
  );

  if (native) {
    return (
      <MobileScreen
        title="Search"
        backTo={resolvedBack}
        chromeExtra={<div className="mob-search-wrap">{searchInput}</div>}
      >
        <div className="mob-body" style={{ paddingTop: 12 }}>
          {filterChips}
          {results}
        </div>
      </MobileScreen>
    );
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link to={resolvedBack} className="text-sm text-primary hover:underline">
          ← Back
        </Link>
        <h2 className="page-title mb-0">🔎 Search</h2>
      </div>
      {searchInput}
      {filterChips}
      {results}
    </div>
  );
}
