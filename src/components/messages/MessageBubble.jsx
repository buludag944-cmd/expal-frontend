import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "../../lib/cn";

const EDIT_WINDOW_MS = 24 * 60 * 60 * 1000;

function formatTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-IE", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

/**
 * One chat message. The sender can edit (within 24 hours) or delete their own messages:
 * tap/long-press the bubble on phones, or use the "⋯" button on desktop.
 */
export default function MessageBubble({ message, mine, native, onEdit, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [text, setText] = useState(message.content || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const pressTimer = useRef(null);
  const editRef = useRef(null);

  const deleted = Boolean(message.deletedAt);
  const canEdit =
    mine && !deleted && (!message.createdAt || Date.now() - new Date(message.createdAt).getTime() < EDIT_WINDOW_MS);
  const canAct = mine && !deleted && (onEdit || onDelete);

  useEffect(() => {
    if (editing && editRef.current) {
      const el = editRef.current;
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    }
  }, [editing]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const close = () => setMenuOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [menuOpen]);

  function startPress() {
    if (!canAct || !native) return;
    pressTimer.current = setTimeout(() => setMenuOpen(true), 450);
  }
  function endPress() {
    clearTimeout(pressTimer.current);
  }

  async function saveEdit() {
    const next = text.trim();
    if (!next || next === message.content) {
      setEditing(false);
      return;
    }
    setBusy(true);
    setError("");
    try {
      await onEdit(message.id, next);
      setEditing(false);
    } catch (e) {
      setError(e.message || "Could not save");
    } finally {
      setBusy(false);
    }
  }

  async function doDelete() {
    setBusy(true);
    setError("");
    try {
      await onDelete(message.id);
      setConfirmDelete(false);
    } catch (e) {
      setError(e.message || "Could not delete");
    } finally {
      setBusy(false);
    }
  }

  const bubbleClass = native
    ? cn("mob-msg-bubble", mine ? "mob-msg-bubble--mine" : "mob-msg-bubble--theirs", deleted && "msg-bubble--deleted")
    : cn(
        "msg-bubble-web max-w-[78%] rounded-2xl px-4 py-2.5 text-sm shadow-sm",
        mine ? "bg-primary text-primary-foreground" : "bg-surface border border-border text-foreground",
        deleted && "msg-bubble--deleted"
      );

  return (
    <div className={cn("msg-row", mine ? "msg-row--mine" : "msg-row--theirs")}>
      {canAct && !native && !editing && (
        <div className="msg-actions-anchor">
          <button
            type="button"
            className="msg-more-btn"
            aria-label="Message options"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((v) => !v);
            }}
          >
            ⋯
          </button>
        </div>
      )}
      <div
        className={bubbleClass}
        onTouchStart={startPress}
        onTouchEnd={endPress}
        onTouchMove={endPress}
        onContextMenu={(e) => {
          if (canAct) {
            e.preventDefault();
            setMenuOpen(true);
          }
        }}
      >
        {editing ? (
          <div className="msg-edit">
            <textarea
              ref={editRef}
              className="msg-edit-input ugc-text"
              value={text}
              rows={Math.min(6, Math.max(2, text.split("\n").length))}
              onChange={(e) => setText(e.target.value)}
              aria-label="Edit message"
              disabled={busy}
            />
            <div className="msg-edit-actions">
              <button type="button" className="msg-link-btn" onClick={() => { setEditing(false); setText(message.content || ""); }} disabled={busy}>
                Cancel
              </button>
              <button type="button" className="msg-save-btn" onClick={saveEdit} disabled={busy || !text.trim()}>
                {busy ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        ) : deleted ? (
          <span className="msg-deleted-text">This message was deleted</span>
        ) : (
          <span className="ugc-text msg-content">{message.content}</span>
        )}
        <p className={native ? "mob-msg-time" : cn("mt-1 text-xs opacity-70", mine ? "text-right" : "")}>
          {message.editedAt && !deleted ? "Edited · " : ""}
          {formatTime(message.createdAt)}
        </p>
        {confirmDelete && (
          <div className="msg-confirm" role="alertdialog" aria-label="Delete message?">
            <span>Delete for everyone?</span>
            <button type="button" className="msg-link-btn" onClick={() => setConfirmDelete(false)} disabled={busy}>
              Cancel
            </button>
            <button type="button" className="msg-danger-btn" onClick={doDelete} disabled={busy}>
              {busy ? "Deleting…" : "Delete"}
            </button>
          </div>
        )}
        {error && <p className="msg-error">{error}</p>}
      </div>
      {menuOpen &&
        (() => {
          const items = (
            <div className={cn("msg-menu", native && "msg-menu--sheet")} role="menu" onClick={(e) => e.stopPropagation()}>
              {canEdit && onEdit && (
                <button type="button" role="menuitem" onClick={() => { setMenuOpen(false); setEditing(true); }}>
                  Edit
                </button>
              )}
              {onDelete && (
                <button type="button" role="menuitem" className="msg-menu-danger" onClick={() => { setMenuOpen(false); setConfirmDelete(true); }}>
                  Delete
                </button>
              )}
              <button type="button" role="menuitem" onClick={() => setMenuOpen(false)}>
                Cancel
              </button>
            </div>
          );
          // On phones the menu is a bottom sheet above the composer and tab bar, so it lives at the top of the page.
          return native
            ? createPortal(
                <div className="msg-sheet-backdrop" onClick={() => setMenuOpen(false)}>
                  {items}
                </div>,
                document.body
              )
            : items;
        })()}
    </div>
  );
}
