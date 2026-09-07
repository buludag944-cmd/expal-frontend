import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";

const BADGE_MAP = {
  purple: "mob-badge--purple",
  teal: "mob-badge--teal",
  coral: "mob-badge--coral",
  red: "mob-badge--red",
  amber: "mob-badge--amber",
};

export function MobileSectionTitle({ children, className = "" }) {
  return <h2 className={`mob-section-title ${className}`.trim()}>{children}</h2>;
}

export function MobileBadge({ label, color = "purple" }) {
  return (
    <span className={`mob-badge ${BADGE_MAP[color] || BADGE_MAP.purple}`}>{label}</span>
  );
}

export function MobileCard({ children, className = "", style }) {
  return (
    <div className={`mob-card ${className}`.trim()} style={style}>
      {children}
    </div>
  );
}

export function MobileCallout({ children, color = "purple" }) {
  return <div className={`mob-callout mob-callout--${color}`}>{children}</div>;
}

export function MobileEmptyState({ title, children }) {
  return (
    <div className="mob-empty-state">
      {title ? <p className="mob-empty-state-title">{title}</p> : null}
      {children ? <p className="mob-empty-state-body">{children}</p> : null}
    </div>
  );
}

export function MobileScreenHeader({ title, backTo, onBack, action, count }) {
  const trailing = action || count != null ? (
    <div className="mob-header-actions">
      {count != null ? <span className="mob-header-count">{count}</span> : null}
      {action || <span className="mob-back-btn--placeholder w-8" />}
    </div>
  ) : (
    <span className="mob-back-btn--placeholder w-8" />
  );

  let leading = <span className="mob-back-btn mob-back-btn--placeholder" />;
  if (typeof onBack === "function") {
    leading = (
      <button type="button" className="mob-back-btn" onClick={onBack} aria-label="Go back">
        ‹
      </button>
    );
  } else if (backTo) {
    leading = (
      <Link to={backTo} className="mob-back-btn" aria-label="Go back">
        ‹
      </Link>
    );
  }

  return (
    <header className="mob-screen-header">
      {leading}
      <h1 className="mob-screen-title">{title}</h1>
      {trailing}
    </header>
  );
}

/** Fixed top chrome (outside scroll) + independent scroll body. Safe-area top lives on chrome CSS. */
export function MobileScreen({
  title,
  backTo,
  onBack,
  action,
  count,
  chromeExtra = null,
  footer = null,
  children,
  className = "",
}) {
  return (
    <div className={`mob-screen mob-screen--split ${className}`.trim()}>
      <div className="mob-screen-chrome">
        {(title != null || action || count != null || backTo || onBack) && (
          <MobileScreenHeader
            title={title}
            backTo={backTo}
            onBack={onBack}
            action={action}
            count={count}
          />
        )}
        {chromeExtra}
      </div>
      <div className="mob-screen-scroll">{children}</div>
      {footer ? <div className="mob-screen-footer">{footer}</div> : null}
    </div>
  );
}

export function MobileFab({ onClick, label = "Post", visible = true, side = "left" }) {
  if (!visible) return null;
  return (
    <button
      type="button"
      className={`mob-fab${side === "right" ? " mob-fab--right" : " mob-fab--left"}`}
      onClick={onClick}
      aria-label={label}
    >
      ＋
    </button>
  );
}

/**
 * Shared bottom sheet for create/edit forms (iOS WebKit–safe).
 * Portaled to document.body. Structure:
 *   header (fixed) → scrollable body → optional pinned footer (Save/Post).
 * Prefer putting the primary submit in `footer` so it stays visible on iPhone.
 */
export function MobilePostSheet({ open, onClose, title, children, footer = null }) {
  const sheetRef = useRef(null);
  const bodyRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const root = document.documentElement;
    root.classList.add("mob-sheet-open");

    const syncHeight = () => {
      const sheet = sheetRef.current;
      if (!sheet) return;
      const vv = window.visualViewport;
      const viewH = vv?.height ?? window.innerHeight;
      // Cap sheet to 85% of the *visible* viewport (tracks keyboard on iOS)
      const max = Math.min(Math.round(viewH * 0.85), 720);
      sheet.style.maxHeight = `${max}px`;
    };

    const onFocusIn = (e) => {
      const t = e.target;
      if (!(t instanceof HTMLElement)) return;
      if (!bodyRef.current?.contains(t)) return;
      if (!/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
      window.setTimeout(() => {
        syncHeight();
        t.scrollIntoView({ block: "center", behavior: "smooth" });
      }, 250);
    };

    syncHeight();
    const vv = window.visualViewport;
    vv?.addEventListener("resize", syncHeight);
    vv?.addEventListener("scroll", syncHeight);
    window.addEventListener("resize", syncHeight);
    document.addEventListener("focusin", onFocusIn);

    return () => {
      root.classList.remove("mob-sheet-open");
      vv?.removeEventListener("resize", syncHeight);
      vv?.removeEventListener("scroll", syncHeight);
      window.removeEventListener("resize", syncHeight);
      document.removeEventListener("focusin", onFocusIn);
      if (sheetRef.current) sheetRef.current.style.maxHeight = "";
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="mob-post-sheet-backdrop" onClick={onClose} role="presentation">
      <div
        ref={sheetRef}
        className="mob-post-sheet"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="mob-post-sheet-header">
          <h2 className="mob-post-sheet-title">{title}</h2>
          <button type="button" className="mob-back-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div ref={bodyRef} className="mob-post-sheet-body">
          {children}
        </div>
        {footer ? <div className="mob-post-sheet-footer">{footer}</div> : null}
      </div>
    </div>,
    document.body
  );
}

