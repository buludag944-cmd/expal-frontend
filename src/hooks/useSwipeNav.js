import { useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const DEFAULT_TABS = ["/", "/explore", "/community", "/journey", "/profile"];

/** Scroll surfaces and interactive chrome must never trigger main-tab route swipe. */
const IGNORE_SELECTOR =
  ".mob-screen-scroll, .mob-tab-pane-scroll, .mob-swipe-viewport, .mob-swipe-pane, .mob-chip-scroll, .mob-body, .mob-post-sheet-backdrop, .mob-post-sheet, .mob-msg-thread, .mob-msg-list, input, textarea, select, button, a, [data-no-route-swipe], [role='dialog']";

/**
 * Horizontal swipe between ordered routes (e.g. bottom tab pages).
 * Edge-only: gesture must start within EDGE_PX of left/right screen edge.
 * Cancels when primarily vertical or started on ignored scroll/interactive regions.
 */
export function useRouteSwipe(routes = DEFAULT_TABS, { threshold = 140, edgePx = 28 } = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const startX = useRef(null);
  const startY = useRef(null);
  const fromEdge = useRef(false);
  const cancelled = useRef(false);

  const currentIndex = (() => {
    const path = location.pathname;
    const exact = routes.findIndex((r) => r === path);
    if (exact >= 0) return exact;
    return -1;
  })();

  const onTouchStart = useCallback(
    (e) => {
      cancelled.current = false;
      if (e.target?.closest?.(IGNORE_SELECTOR)) {
        startX.current = null;
        return;
      }
      const x = e.changedTouches[0].clientX;
      const w = typeof window !== "undefined" ? window.innerWidth : 400;
      fromEdge.current = x <= edgePx || x >= w - edgePx;
      // Only edge starts can navigate — prevents Housing body swipe → Community
      if (!fromEdge.current) {
        startX.current = null;
        return;
      }
      startX.current = x;
      startY.current = e.changedTouches[0].clientY;
    },
    [edgePx]
  );

  const onTouchMove = useCallback((e) => {
    if (startX.current == null || cancelled.current) return;
    const dx = e.changedTouches[0].clientX - startX.current;
    const dy = e.changedTouches[0].clientY - (startY.current ?? 0);
    // Vertical scroll intent wins immediately
    if (Math.abs(dy) > 12 && Math.abs(dy) >= Math.abs(dx) * 0.85) {
      cancelled.current = true;
      startX.current = null;
    }
  }, []);

  const onTouchEnd = useCallback(
    (e) => {
      if (startX.current == null || currentIndex < 0 || cancelled.current || !fromEdge.current) {
        startX.current = null;
        startY.current = null;
        cancelled.current = false;
        return;
      }
      const dx = e.changedTouches[0].clientX - startX.current;
      const dy = e.changedTouches[0].clientY - (startY.current ?? 0);
      startX.current = null;
      startY.current = null;
      cancelled.current = false;
      if (Math.abs(dx) < threshold || Math.abs(dx) < Math.abs(dy) * 2.5) return;
      if (dx < 0 && currentIndex < routes.length - 1) {
        navigate(routes[currentIndex + 1]);
      } else if (dx > 0 && currentIndex > 0) {
        navigate(routes[currentIndex - 1]);
      }
    },
    [currentIndex, navigate, routes, threshold]
  );

  return { onTouchStart, onTouchMove, onTouchEnd, currentIndex };
}

/**
 * Local tabs swipe (Events/Threads style) without routing.
 */
export function useLocalTabSwipe(tabs, activeTab, setActiveTab, { threshold = 72 } = {}) {
  const startX = useRef(null);
  const startY = useRef(null);
  const cancelled = useRef(false);

  const onTouchStart = useCallback((e) => {
    cancelled.current = false;
    startX.current = e.changedTouches[0].clientX;
    startY.current = e.changedTouches[0].clientY;
  }, []);

  const onTouchMove = useCallback((e) => {
    if (startX.current == null || cancelled.current) return;
    const dx = e.changedTouches[0].clientX - startX.current;
    const dy = e.changedTouches[0].clientY - (startY.current ?? 0);
    if (Math.abs(dy) > 14 && Math.abs(dy) >= Math.abs(dx)) {
      cancelled.current = true;
      startX.current = null;
    }
  }, []);

  const onTouchEnd = useCallback(
    (e) => {
      if (startX.current == null || cancelled.current) {
        startX.current = null;
        startY.current = null;
        cancelled.current = false;
        return;
      }
      const dx = e.changedTouches[0].clientX - startX.current;
      const dy = e.changedTouches[0].clientY - (startY.current ?? 0);
      startX.current = null;
      startY.current = null;
      cancelled.current = false;
      if (Math.abs(dx) < threshold || Math.abs(dx) < Math.abs(dy) * 2) return;
      const idx = tabs.indexOf(activeTab);
      if (idx < 0) return;
      if (dx < 0 && idx < tabs.length - 1) setActiveTab(tabs[idx + 1]);
      if (dx > 0 && idx > 0) setActiveTab(tabs[idx - 1]);
    },
    [activeTab, setActiveTab, tabs, threshold]
  );

  return { onTouchStart, onTouchMove, onTouchEnd, tabIndex: Math.max(0, tabs.indexOf(activeTab)) };
}
