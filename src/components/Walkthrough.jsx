import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { isNativeApp } from "../lib/platform";

const STORAGE_KEY = "expal_walkthrough_done";

export function hasCompletedWalkthrough() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function markWalkthroughDone() {
  try {
    localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function restartWalkthrough() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.setItem("expal_walkthrough_force", "1");
  } catch {
    /* ignore */
  }
  // Soft reload of overlay via storage event for same-tab consumers
  try {
    window.dispatchEvent(new Event("expal-walkthrough-restart"));
  } catch {
    /* ignore */
  }
}

/**
 * Tour steps navigate real routes so users see live UI (not screenshots).
 * Pointer-events on the panel only — underlying screens remain scrollable.
 */
const STEPS = [
  {
    id: "home",
    path: "/",
    title: "Home",
    body: "Your hub for shortcuts, alerts, and days in Ireland. Open Messages and Notifications from here anytime — you never need swipe-only navigation.",
  },
  {
    id: "housing",
    path: "/housing",
    title: "Housing",
    body: "Scroll listings, tap ＋ to post, and enquire. Main tabs change only from an edge swipe or the bottom bar — scrolling Housing will not jump to Community.",
  },
  {
    id: "community",
    path: "/community",
    title: "Community",
    body: "Events, Threads, and Groups. Prefer App General for app questions, bugs, and feedback. Open a thread to read and reply; edit or delete your own posts from ⋯.",
  },
  {
    id: "referrals",
    path: "/referrals",
    title: "Referrals",
    body: "Browse and share referrals. Comment on posts and manage your own comments from the thread actions.",
  },
  {
    id: "visa",
    path: "/journey",
    title: "Visa & Permit",
    body: "Track permit progress, deadlines, and checklist items. Use the tabs or bottom navigation — everything stays reachable without gestures.",
  },
  {
    id: "messages",
    path: "/messages",
    title: "Messages / DMs",
    body: "Your inbox lists everyone you messaged or who messaged you — name, preview, time, and unread badge. Tap a row for the full conversation. You do not need member profiles to find existing chats.",
  },
  {
    id: "notifications",
    path: "/notifications",
    title: "Notifications",
    body: "DMs, replies on your posts, and forum activity appear here with read/unread state. Tap any item to open the related message, post, or thread.",
  },
  {
    id: "help",
    path: "/help",
    title: "Help & FAQ",
    body: "Expand common questions here. You can replay this tour anytime from Help or Profile.",
  },
  {
    id: "contact",
    path: "/profile",
    title: "Contact Founder",
    body: "In Profile → Support, tap Contact founder. Your account identity is attached automatically so the founder knows who wrote. Profile also has theme (Auto night dark / Light / Dark).",
  },
];

/**
 * Lightweight guided tour that navigates real routes.
 * Shown once after onboarding unless restarted from Help/Profile.
 */
export default function Walkthrough({ enabled }) {
  const native = isNativeApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const onRestart = () => setTick((t) => t + 1);
    window.addEventListener("expal-walkthrough-restart", onRestart);
    return () => window.removeEventListener("expal-walkthrough-restart", onRestart);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setVisible(false);
      return;
    }
    let force = false;
    try {
      force = localStorage.getItem("expal_walkthrough_force") === "1";
    } catch {
      /* ignore */
    }
    if (!force && hasCompletedWalkthrough()) {
      setVisible(false);
      return;
    }
    setVisible(true);
    setStep(0);
  }, [enabled, tick]);

  const current = STEPS[step];
  const isLast = step >= STEPS.length - 1;

  useEffect(() => {
    if (!visible || !current) return;
    if (location.pathname !== current.path) {
      navigate(current.path);
    }
  }, [visible, current, location.pathname, navigate]);

  const finish = () => {
    markWalkthroughDone();
    try {
      localStorage.removeItem("expal_walkthrough_force");
    } catch {
      /* ignore */
    }
    setVisible(false);
    navigate("/");
  };

  const skip = () => finish();

  const next = () => {
    if (isLast) finish();
    else setStep((s) => s + 1);
  };

  const back = () => setStep((s) => Math.max(0, s - 1));

  const panelStyle = useMemo(
    () => ({
      position: "fixed",
      left: 12,
      right: 12,
      bottom: native ? undefined : 24,
      zIndex: 80,
      background: "var(--mob-card, #fff)",
      color: "var(--mob-text, #1a1814)",
      borderRadius: 16,
      padding: "16px 16px 14px",
      boxShadow: "0 12px 40px rgba(0,0,0,0.22)",
      border: "1px solid var(--mob-border, rgba(0,0,0,0.08))",
      maxWidth: 480,
      margin: "0 auto",
      pointerEvents: "auto",
    }),
    [native]
  );

  if (!visible || !current) return null;

  return (
    <>
      {/* Dim overlay does NOT capture scroll — only the card is interactive */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 79,
          background: "rgba(0,0,0,0.18)",
          pointerEvents: "none",
        }}
      />
      <div
        role="dialog"
        aria-modal="false"
        aria-label="App walkthrough"
        className={native ? "mob-walkthrough-panel" : undefined}
        style={panelStyle}
        data-no-route-swipe
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "var(--mob-purple, #534ab7)",
            }}
          >
            Tour {step + 1}/{STEPS.length}
          </span>
          <button
            type="button"
            onClick={skip}
            style={{
              background: "none",
              border: "none",
              color: "var(--mob-text-muted)",
              fontSize: 12,
              cursor: "pointer",
              minHeight: 44,
              minWidth: 44,
            }}
          >
            Skip
          </button>
        </div>
        <h2 style={{ margin: "0 0 6px", fontSize: 18 }}>{current.title}</h2>
        <p style={{ margin: "0 0 14px", fontSize: 13, lineHeight: 1.45, color: "var(--mob-text-secondary, #6b6860)" }}>
          {current.body}
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            className="mob-btn-secondary"
            style={{ flex: 1, minHeight: 44, opacity: step === 0 ? 0.45 : 1 }}
            disabled={step === 0}
            onClick={back}
          >
            Back
          </button>
          <button type="button" className="mob-btn-primary" style={{ flex: 1, minHeight: 44 }} onClick={next}>
            {isLast ? "Finish" : "Next"}
          </button>
        </div>
      </div>
    </>
  );
}
