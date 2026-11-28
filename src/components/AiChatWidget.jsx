import React, { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, RotateCcw } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { sendAssistantMessage } from "../lib/journeyApi";
import { fetchPublishedPosts } from "../lib/blogApi";
import { SUGGESTIONS, enrichReply, localAnswer } from "../lib/assistantKnowledge";
import { cn } from "../lib/cn";
import { isNativeApp } from "../lib/platform";
import "../styles/assistant.css";

const WELCOME =
  "Hi! I'm your **free EXPal guide** for life in Ireland. Ask me about IRP, PPS numbers, bank accounts, housing, jobs or rental scams, or say **my steps**.";

const STORE_KEY = "expal_assistant_chat_v1";
const BLOG_SITE = "https://expalapp.netlify.app";

/** Routes with their own composer / bottom chrome — hide FAB so it does not cover Send. */
function shouldHideAssistant(pathname) {
  if (pathname === "/messages" || pathname.startsWith("/messages/")) return true;
  // In the phone apps the job tracker is a full-screen tool with its own buttons.
  return isNativeApp() && pathname === "/job-tracker";
}

/** **bold**, [links](url), bare URLs and "- " bullet lines. Internal links stay inside the app. */
function renderInline(text, keyBase) {
  const parts = [];
  const re = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)\s]+\)|https?:\/\/[^\s)]+)/g;
  let last = 0;
  let m;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const t = m[0];
    const key = `${keyBase}-${parts.length}`;
    if (t.startsWith("**")) parts.push(<strong key={key}>{t.slice(2, -2)}</strong>);
    else {
      const lm = t.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
      const href = lm ? lm[2] : t;
      const label = lm ? lm[1] : t.replace(/^https?:\/\//, "");
      if (href.startsWith("/blog") && isNativeApp())
        parts.push(
          <a key={key} href={`${BLOG_SITE}${href}`} target="_blank" rel="noopener noreferrer">
            {label}
          </a>
        );
      else if (href.startsWith("/")) parts.push(<Link key={key} to={href}>{label}</Link>);
      else if (/^https?:/i.test(href))
        parts.push(
          <a key={key} href={href} target="_blank" rel="noopener noreferrer">
            {label}
          </a>
        );
      else parts.push(label);
    }
    last = m.index + t.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function RichText({ text }) {
  const lines = String(text || "").split("\n");
  const out = [];
  let list = [];
  const flush = () => {
    if (list.length) {
      out.push(
        <ul key={`ul-${out.length}`}>
          {list.map((l, i) => (
            <li key={i}>{renderInline(l, `li-${out.length}-${i}`)}</li>
          ))}
        </ul>
      );
      list = [];
    }
  };
  lines.forEach((line, i) => {
    const t = line.trim();
    const bullet = t.match(/^[-*•]\s+(.*)$/) || t.match(/^\d+[.)]\s+(.*)$/);
    if (bullet) list.push(bullet[1]);
    else {
      flush();
      if (t) out.push(<p key={`p-${i}`}>{renderInline(t, `p-${i}`)}</p>);
    }
  });
  flush();
  return <div className="assist-rich">{out}</div>;
}

function toApiHistory(messages) {
  return messages
    .filter((m) => (m.role === "user" || m.role === "assistant") && !m.local)
    .slice(-10)
    .map((m) => ({ role: m.role, content: m.text }));
}

function loadStored(userKey) {
  try {
    const raw = sessionStorage.getItem(STORE_KEY);
    const data = raw ? JSON.parse(raw) : null;
    if (data && data.user === userKey && Array.isArray(data.messages) && data.messages.length) return data.messages;
  } catch {
    /* storage unavailable */
  }
  return [{ role: "assistant", text: WELCOME }];
}

export default function AiChatWidget() {
  const { token, user } = useAuth();
  const { pathname } = useLocation();
  const userKey = user?.id ? String(user.id) : "guest";
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState(() => loadStored(userKey));
  const [posts, setPosts] = useState([]);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const hidden = shouldHideAssistant(pathname);
  const native = isNativeApp();

  useEffect(() => {
    if (hidden) setOpen(false);
  }, [hidden]);

  useEffect(() => {
    setMessages(loadStored(userKey));
  }, [userKey]);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORE_KEY, JSON.stringify({ user: userKey, messages: messages.slice(-40) }));
    } catch {
      /* storage unavailable */
    }
  }, [messages, userKey]);

  useEffect(() => {
    if (!open || posts.length) return;
    fetchPublishedPosts()
      .then((p) => setPosts(Array.isArray(p) ? p : []))
      .catch(() => {});
  }, [open, posts.length]);

  useEffect(() => {
    if (!open || !scrollRef.current) return;
    // Fresh chat: start at the top so the welcome text is visible on short phones.
    scrollRef.current.scrollTop = messages.length === 1 && !busy ? 0 : scrollRef.current.scrollHeight;
  }, [messages, open, busy]);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 110)}px`;
  }, [input]);

  async function ask(text) {
    const question = text.trim();
    if (!question || busy) return;
    setInput("");
    const nextMessages = [...messages, { role: "user", text: question }];
    setMessages(nextMessages);
    setBusy(true);
    try {
      if (!token) throw new Error("offline");
      const { reply } = await sendAssistantMessage(token, question, toApiHistory(nextMessages));
      const extras = enrichReply(question, reply, posts);
      setMessages((m) => [...m, { role: "assistant", text: reply, ...extras }]);
    } catch {
      // Server unreachable or signed out: answer from EXPal's own guides and features.
      const local = localAnswer(question, posts);
      setMessages((m) => [...m, { role: "assistant", text: local.text, actions: local.actions, guides: local.guides, local: true }]);
    } finally {
      setBusy(false);
    }
  }

  function onKeyDown(e) {
    if (!native && e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      ask(input);
    }
  }

  function resetChat() {
    setMessages([{ role: "assistant", text: WELCOME }]);
  }

  const subtitle = user?.visaType
    ? `Free guide · ${user.visaType.split("(")[0].trim()}`
    : "Free guide · Life in Ireland";
  const onlyWelcome = messages.length === 1;

  if (hidden) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "fixed z-[60] flex h-14 w-14 items-center justify-center rounded-full shadow-lg",
          "bg-primary text-white hover:opacity-90 transition-opacity",
          native ? "mob-chat-fab right-4" : "bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-4 md:bottom-6 md:right-6"
        )}
        aria-label={open ? "Close assistant" : "Open EXPal assistant"}
        aria-expanded={open}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="EXPal guide"
          className={cn(
            "assist-panel fixed z-[59] flex flex-col bg-card border border-border shadow-xl rounded-2xl overflow-hidden",
            "right-4 left-4 h-[min(520px,62vh)]",
            native ? "mob-chat-panel" : "bottom-[calc(9.5rem+env(safe-area-inset-bottom))] md:left-auto md:w-[400px] md:bottom-24"
          )}
        >
          <div className="assist-head">
            <div>
              <h2>EXPal guide</h2>
              <p>{subtitle}</p>
            </div>
            {!onlyWelcome && (
              <button type="button" className="assist-icon-btn" onClick={resetChat} aria-label="Start a new chat" title="New chat">
                <RotateCcw className="h-4 w-4" />
              </button>
            )}
          </div>

          <div ref={scrollRef} className="assist-body" aria-live="polite">
            {messages.map((m, i) => (
              <div key={i} className={cn("assist-msg", m.role === "user" ? "assist-msg--user" : "assist-msg--bot")}>
                {m.role === "assistant" ? <RichText text={m.text} /> : <span className="ugc-text">{m.text}</span>}
                {m.role === "assistant" && (m.guides?.length > 0 || m.actions?.length > 0) && (
                  <div className="assist-extras">
                    {m.guides?.map((g) =>
                      native ? (
                        // The blog lives on the website only, so the apps open the article in the phone's browser.
                        <a
                          key={g.slug}
                          href={`${BLOG_SITE}/blog/${g.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="assist-guide"
                        >
                          <span className="assist-guide-kicker">EXPal guide · opens website</span>
                          <span className="assist-guide-title">{g.title}</span>
                        </a>
                      ) : (
                        <Link key={g.slug} to={`/blog/${g.slug}`} className="assist-guide">
                          <span className="assist-guide-kicker">EXPal guide</span>
                          <span className="assist-guide-title">{g.title}</span>
                        </Link>
                      )
                    )}
                    {m.actions?.length > 0 && (
                      <div className="assist-actions">
                        {m.actions.map((a) => (
                          <Link key={a.to} to={a.to} className="assist-action" onClick={() => setOpen(false)}>
                            {a.label} →
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            {onlyWelcome && (
              <div className="assist-suggestions" aria-label="Suggested questions">
                {SUGGESTIONS.map((s) => (
                  <button key={s} type="button" onClick={() => ask(s)}>
                    {s}
                  </button>
                ))}
              </div>
            )}
            {busy && (
              <div className="assist-msg assist-msg--bot assist-typing" aria-label="Thinking">
                <span />
                <span />
                <span />
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              ask(input);
            }}
            className="assist-form"
          >
            <textarea
              ref={inputRef}
              rows={1}
              placeholder="Ask a question…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              disabled={busy}
              aria-label="Ask the EXPal guide"
              className="assist-input"
            />
            <button type="submit" className="assist-send" disabled={busy || !input.trim()} aria-label="Send">
              <Send className="h-4 w-4" />
            </button>
          </form>
          <p className="assist-note">General guidance, not legal advice. Check official sources before acting.</p>
        </div>
      )}
    </>
  );
}
