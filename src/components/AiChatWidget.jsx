import React, { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { useAuth } from "../AuthContext";
import { sendAssistantMessage } from "../lib/journeyApi";
import Button from "./ui/Button";
import Input from "./ui/Input";
import { cn } from "../lib/cn";
import { isNativeApp } from "../lib/platform";

const WELCOME =
  "Hi! I'm your **free Expal visa guide** for Ireland — CSEP, General Work Permit, and EU Passport. Ask about IRP, PPS, bank accounts, housing, or say **my steps**.";

function renderMarkdownLite(text) {
  return String(text)
    .split(/\*\*(.+?)\*\*/g)
    .map((part, i) => (i % 2 === 1 ? <strong key={i}>{part}</strong> : part));
}

function toApiHistory(messages) {
  return messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .slice(-10)
    .map((m) => ({ role: m.role, content: m.text }));
}

export default function AiChatWidget() {
  const { token, user } = useAuth();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState([{ role: "assistant", text: WELCOME }]);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  const send = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    const nextMessages = [...messages, { role: "user", text }];
    setMessages(nextMessages);
    setBusy(true);
    try {
      const { reply } = await sendAssistantMessage(token, text, toApiHistory(nextMessages));
      setMessages((m) => [...m, { role: "assistant", text: reply }]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text: err.message || "Could not reach the server. Try again in a moment.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  };

  const subtitle = user?.visaType
    ? `Free visa guide · ${user.visaType.split("(")[0].trim()}`
    : "Free visa guide · Ireland";

  const native = isNativeApp();

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
        aria-label={open ? "Close assistant" : "Open Expal assistant"}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {open && (
        <div
          className={cn(
            "fixed z-[59] flex flex-col bg-card border border-border shadow-xl rounded-2xl overflow-hidden",
            "right-4 left-4 h-[min(420px,55vh)]",
            native ? "mob-chat-panel" : "bottom-[calc(9.5rem+env(safe-area-inset-bottom))] md:left-auto md:w-[380px] md:bottom-24",
            !native && "md:left-auto md:w-[380px] md:bottom-24"
          )}
        >
          <div className="px-4 py-3 border-b border-border bg-primary/10">
            <h2 className="font-semibold text-sm">Expal guide</h2>
            <p className="text-xs text-muted">{subtitle}</p>
          </div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "text-sm rounded-xl px-3 py-2 max-w-[90%] whitespace-pre-wrap",
                  m.role === "user"
                    ? "ml-auto bg-primary text-white"
                    : "mr-auto bg-muted/30 text-foreground"
                )}
              >
                {m.role === "assistant" ? renderMarkdownLite(m.text) : m.text}
              </div>
            ))}
            {busy && <p className="text-xs text-muted px-1">Thinking…</p>}
          </div>
          <form onSubmit={send} className="p-3 border-t border-border flex gap-2">
            <Input
              placeholder="e.g. IRP steps, PPS, my steps…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={busy}
              className="flex-1"
            />
            <Button type="submit" size="sm" disabled={busy || !input.trim()} aria-label="Send">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
