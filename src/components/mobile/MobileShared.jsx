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
 *
 * On iOS the keyboard overlays the layout viewport without resizing it.
 * We lift the sheet with visualViewport so fields stay above the keyboard.
 */
export function MobilePostSheet({ open, onClose, title, children, footer = null }) {
  const backdropRef = useRef(null);
  const sheetRef = useRef(null);
  const bodyRef = useRef(null);
  const focusedRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const root = document.documentElement;
    root.classList.add("mob-sheet-open");
    const sheetEl = sheetRef.current;
    const backdropEl = backdropRef.current;

    const keyboardBottomInset = () => {
      const vv = window.visualViewport;
      if (!vv) return 0;
      // Distance from layout viewport bottom to visual viewport bottom (= keyboard)
      return Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop));
    };

    const syncToVisualViewport = () => {
      const sheet = sheetRef.current;
      const backdrop = backdropRef.current;
      const vv = window.visualViewport;
      if (!sheet) return;

      const inset = keyboardBottomInset();
      const viewH = vv?.height ?? window.innerHeight;
      const max = Math.min(Math.round(viewH * (inset > 40 ? 0.95 : 0.85)), 720);

      // Resize backdrop to the *visible* viewport (above the keyboard on iOS).
      // Sheet stays bottom:0 inside that box — no double-lift.
      if (backdrop && vv) {
        backdrop.style.top = `${Math.round(vv.offsetTop)}px`;
        backdrop.style.height = `${Math.round(vv.height)}px`;
        backdrop.style.bottom = "auto";
        backdrop.style.left = "0";
        backdrop.style.right = "0";
      }

      sheet.style.bottom = "0px";
      sheet.style.maxHeight = `${max}px`;
      root.classList.toggle("mob-sheet-keyboard", inset > 40);
    };

    const scrollFieldIntoBody = (field) => {
      const body = bodyRef.current;
      if (!body || !field) return;

      // Prefer scrolling the sheet body (not the document / WKWebView)
      const bodyRect = body.getBoundingClientRect();
      const fieldRect = field.getBoundingClientRect();
      const pad = 28;

      if (fieldRect.bottom > bodyRect.bottom - pad) {
        body.scrollTop += fieldRect.bottom - bodyRect.bottom + pad;
      } else if (fieldRect.top < bodyRect.top + pad) {
        body.scrollTop -= bodyRect.top - fieldRect.top + pad;
      }

      // Fallback for edge cases (select pickers, slow layout)
      try {
        field.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });
      } catch {
        /* older WebKit */
      }
    };

    const isNativePickerField = (el) => {
      if (!(el instanceof HTMLInputElement) && !(el instanceof HTMLSelectElement)) return false;
      if (el instanceof HTMLSelectElement) return true;
      const t = (el.type || "").toLowerCase();
      return t === "date" || t === "time" || t === "datetime-local" || t === "month" || t === "week";
    };

    const ensureFocusedVisible = () => {
      const field = focusedRef.current;
      // Resizing / scrollIntoView while a native date/time picker is opening dismisses it on iOS/Android WebView.
      if (field && isNativePickerField(field)) {
        syncToVisualViewport();
        return;
      }
      syncToVisualViewport();
      if (field && bodyRef.current?.contains(field)) {
        scrollFieldIntoBody(field);
      }
    };

    const onFocusIn = (e) => {
      const t = e.target;
      if (!(t instanceof HTMLElement)) return;
      if (!bodyRef.current?.contains(t)) return;
      if (!/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
      focusedRef.current = t;
      // Native pickers: only a light viewport sync — do not scrollIntoView (breaks the picker).
      if (isNativePickerField(t)) {
        syncToVisualViewport();
        return;
      }
      // iOS keyboard animation ~250–350ms; sync before and after
      syncToVisualViewport();
      window.setTimeout(ensureFocusedVisible, 50);
      window.setTimeout(ensureFocusedVisible, 300);
      window.setTimeout(ensureFocusedVisible, 450);
    };

    const onFocusOut = (e) => {
      if (focusedRef.current === e.target) {
        focusedRef.current = null;
      }
      // Reset lift after keyboard dismisses
      window.setTimeout(syncToVisualViewport, 100);
      window.setTimeout(syncToVisualViewport, 350);
    };

    syncToVisualViewport();
    const vv = window.visualViewport;
    vv?.addEventListener("resize", ensureFocusedVisible);
    vv?.addEventListener("scroll", syncToVisualViewport);
    window.addEventListener("resize", syncToVisualViewport);
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);

    return () => {
      root.classList.remove("mob-sheet-open");
      root.classList.remove("mob-sheet-keyboard");
      vv?.removeEventListener("resize", ensureFocusedVisible);
      vv?.removeEventListener("scroll", syncToVisualViewport);
      window.removeEventListener("resize", syncToVisualViewport);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
      focusedRef.current = null;
      if (sheetEl) {
        sheetEl.style.maxHeight = "";
        sheetEl.style.bottom = "";
      }
      if (backdropEl) {
        backdropEl.style.top = "";
        backdropEl.style.height = "";
        backdropEl.style.bottom = "";
        backdropEl.style.left = "";
        backdropEl.style.right = "";
      }
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div ref={backdropRef} className="mob-post-sheet-backdrop" onClick={onClose} role="presentation">
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

