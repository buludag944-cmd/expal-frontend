import React, { useEffect, useState } from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { cn } from "../lib/cn";

const STORAGE_KEY = "expal-theme";
const NIGHT_START = 19; // 7pm local
const NIGHT_END = 7; // 7am local

export function isNightLocal(date = new Date()) {
  const h = date.getHours();
  return h >= NIGHT_START || h < NIGHT_END;
}

export function getStoredThemePreference() {
  if (typeof window === "undefined") return "auto";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "dark" || stored === "light" || stored === "auto") return stored;
  // Legacy: bare prefers-color-scheme users → auto
  return "auto";
}

export function resolveTheme(preference = getStoredThemePreference(), date = new Date()) {
  if (preference === "dark" || preference === "light") return preference;
  return isNightLocal(date) ? "dark" : "light";
}

export function getInitialTheme() {
  return resolveTheme(getStoredThemePreference());
}

export function applyTheme(themeOrPref) {
  const pref =
    themeOrPref === "dark" || themeOrPref === "light" || themeOrPref === "auto"
      ? themeOrPref
      : getStoredThemePreference();
  try {
    localStorage.setItem(STORAGE_KEY, pref);
  } catch {
    /* ignore */
  }
  const resolved = resolveTheme(pref);
  document.documentElement.setAttribute("data-theme", resolved);
  document.documentElement.setAttribute("data-theme-pref", pref);
  return resolved;
}

/** Apply preference without jarring mid-session flips unless returning to foreground. */
export function initThemeLifecycle() {
  applyTheme(getStoredThemePreference());

  const onVisibility = () => {
    if (document.visibilityState !== "visible") return;
    if (getStoredThemePreference() !== "auto") return;
    applyTheme("auto");
  };
  document.addEventListener("visibilitychange", onVisibility);

  // Soft check near night/day boundaries while app stays open
  const timer = window.setInterval(() => {
    if (getStoredThemePreference() !== "auto") return;
    const current = document.documentElement.getAttribute("data-theme");
    const next = resolveTheme("auto");
    if (current !== next) applyTheme("auto");
  }, 5 * 60 * 1000);

  return () => {
    document.removeEventListener("visibilitychange", onVisibility);
    window.clearInterval(timer);
  };
}

export function setThemePreference(pref) {
  return applyTheme(pref);
}

export default function ThemeToggle({ onHeader = false, mode = "binary" }) {
  const [pref, setPref] = useState(getStoredThemePreference);
  const [resolved, setResolved] = useState(getInitialTheme);

  useEffect(() => {
    const r = applyTheme(pref);
    setResolved(r);
  }, [pref]);

  if (mode === "cycle") {
    const cycle = () => {
      const order = ["auto", "light", "dark"];
      const next = order[(order.indexOf(pref) + 1) % order.length];
      setPref(next);
    };
    const Icon = pref === "auto" ? Monitor : resolved === "dark" ? Sun : Moon;
    const label =
      pref === "auto" ? "Theme: Auto (night dark)" : pref === "dark" ? "Theme: Dark" : "Theme: Light";
    return (
      <button
        type="button"
        aria-label={label}
        title={label}
        onClick={cycle}
        className={cn(
          "inline-flex h-11 w-11 min-h-[44px] items-center justify-center rounded-xl transition ease-out",
          onHeader ? "text-white/90 hover:bg-white/15" : "text-muted hover:bg-surface"
        )}
      >
        <Icon className="h-5 w-5" aria-hidden />
      </button>
    );
  }

  return (
    <button
      type="button"
      aria-label={resolved === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => setPref(resolved === "dark" ? "light" : "dark")}
      className={cn(
        "inline-flex h-11 w-11 min-h-[44px] items-center justify-center rounded-xl transition ease-out",
        onHeader
          ? "text-white/90 hover:bg-white/15"
          : "text-muted hover:bg-surface"
      )}
    >
      {resolved === "dark" ? <Sun className="h-5 w-5" aria-hidden /> : <Moon className="h-5 w-5" aria-hidden />}
    </button>
  );
}
