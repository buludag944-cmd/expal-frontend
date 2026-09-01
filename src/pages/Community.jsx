import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { Card, CardContent } from "../components/ui/Card";
import FeedCard from "../components/feed/FeedCard";
import Button from "../components/ui/Button";
import Input, { Textarea } from "../components/ui/Input";
import { fetchForumSpaces, fetchForumThreads } from "../lib/journeyApi";
import { getApiBaseUrl } from "../apiConfig";
import { isNativeApp } from "../lib/platform";
import MobileCommunity from "./mobile/MobileCommunity";

export default function Community() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const native = isNativeApp();
  const [searchParams] = useSearchParams();
  const [spaces, setSpaces] = useState([]);
  const [spaceId, setSpaceId] = useState(null);
  const [threads, setThreads] = useState([]);
  const [showNew, setShowNew] = useState(false);
  const [newThread, setNewThread] = useState({ title: "", body: "" });
  const API = getApiBaseUrl();

  useEffect(() => {
    fetchForumSpaces(token).then(setSpaces);
  }, [token]);

  useEffect(() => {
    if (native && spaces.length && !spaceId) setSpaceId(spaces[0].id);
  }, [native, spaces, spaceId]);

  useEffect(() => {
    if (spaceId) fetchForumThreads(token, spaceId).then(setThreads);
  }, [token, spaceId]);

  useEffect(() => {
    const threadParam = searchParams.get("thread");
    if (threadParam) {
      navigate(`/community/thread/${threadParam}`, { replace: true });
    }
  }, [searchParams, navigate]);

  const createThread = async (e) => {
    e.preventDefault();
    const res = await fetch(`${API}/api/journey/forums/threads`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ spaceId, ...newThread }),
    });
    if (res.ok) {
      setShowNew(false);
      setNewThread({ title: "", body: "" });
      setThreads(await fetchForumThreads(token, spaceId));
    }
  };

  if (native) {
    const initialTab = searchParams.get("tab");
    return <MobileCommunity initialTab={initialTab} />;
  }

  return (
    <div className="space-y-6">
      <h1 className="page-title">Community</h1>

      <div className="flex gap-2 overflow-x-auto pb-2">
        <Link to="/referrals" className="expal-card !p-2.5 text-sm font-medium no-underline text-foreground shrink-0">Referrals</Link>
        <Link to="/users" className="expal-card !p-2.5 text-sm font-medium no-underline text-foreground shrink-0">Members</Link>
        <Link to="/search" className="expal-card !p-2.5 text-sm font-medium no-underline text-foreground shrink-0">Search</Link>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <h2 className="font-semibold text-sm text-muted">Forum spaces</h2>
          {spaces.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSpaceId(s.id)}
              className={`block w-full text-left rounded-lg border px-3 py-2 text-sm ${
                spaceId === s.id ? "border-primary bg-primary/5" : "border-border"
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>

        <div className="md:col-span-2 space-y-3">
          {!spaceId && <p className="text-muted text-sm">Select a forum space</p>}
          {spaceId && (
            <>
              <div className="flex justify-between items-center">
                <h2 className="font-semibold">Threads</h2>
                <Button size="sm" onClick={() => setShowNew(!showNew)}>New thread</Button>
              </div>
              {showNew && (
                <Card>
                  <CardContent className="pt-4 space-y-3">
                    <form onSubmit={createThread}>
                      <Input placeholder="Title" value={newThread.title} onChange={(e) => setNewThread({ ...newThread, title: e.target.value })} required />
                      <Textarea className="mt-2" placeholder="Body" value={newThread.body} onChange={(e) => setNewThread({ ...newThread, body: e.target.value })} required rows={4} />
                      <Button type="submit" className="mt-2">Post</Button>
                    </form>
                  </CardContent>
                </Card>
              )}
              <div className="expal-feed">
                {threads.map((t) => (
                  <FeedCard
                    key={t.id}
                    username={[t.Author?.firstName, t.Author?.lastName].filter(Boolean).join(" ") || "Member"}
                    timestamp={t.cityTag || "Forum"}
                    footerLeft={`💬 ${t.replyCount} replies`}
                    onClick={() => navigate(`/community/thread/${t.id}`)}
                  >
                    <span className="font-medium text-foreground">{t.title}</span>
                    <span className="block text-xs text-muted mt-1 line-clamp-2">{t.body}</span>
                  </FeedCard>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
