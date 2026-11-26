import React, { useEffect, useRef } from "react";

/**
 * Multi-line message box that grows with the text (up to 6 lines).
 * Desktop: Enter sends, Shift+Enter adds a new line. Phones: Enter adds a new line; tap Send.
 */
export default function MessageComposer({ value, onChange, onSubmit, sending, native, error }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 150)}px`;
  }, [value]);

  function handleKeyDown(e) {
    if (!native && e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      if (value.trim() && !sending) onSubmit(e);
    }
  }

  return (
    <form className={native ? "mob-msg-composer msg-composer" : "msg-composer msg-composer--web"} onSubmit={onSubmit} data-no-route-swipe>
      <textarea
        ref={ref}
        className="msg-composer-input"
        rows={1}
        placeholder="Type a message…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={sending}
        aria-label="Message text"
        enterKeyHint={native ? "enter" : "send"}
      />
      <button type="submit" className="msg-send-btn" disabled={sending || !value.trim()}>
        {sending ? "…" : "Send"}
      </button>
      {error && <p className="msg-error msg-composer-error">{error}</p>}
    </form>
  );
}
