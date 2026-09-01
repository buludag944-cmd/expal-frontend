import React from "react";
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

/** Fixed top chrome (header stays visible) + independent scroll body. */
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

export function MobilePostSheet({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="mob-post-sheet-backdrop" onClick={onClose} role="presentation">
      <div
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
        <div className="mob-post-sheet-body">{children}</div>
      </div>
    </div>
  );
}
