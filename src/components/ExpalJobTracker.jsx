import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../AuthContext';

const OVERLAY_GAP = 16;

/**
 * The iframe grows to its full content height, so the tracker's fixed-position dialogs and toast
 * would otherwise be placed relative to the whole (possibly very tall) frame instead of the
 * part the visitor can see. Returns positions in iframe coordinates.
 */
export function visibleOverlayPlacement(frameTop, frameHeight, viewportTop, viewportBottom, dialogHeight) {
  const visibleTop = Math.min(Math.max(0, viewportTop - frameTop), frameHeight);
  const visibleBottom = Math.max(visibleTop, Math.min(frameHeight, viewportBottom - frameTop));
  const visibleHeight = visibleBottom - visibleTop;
  const maxHeight = Math.max(240, visibleHeight - OVERLAY_GAP * 2);
  const height = Math.min(dialogHeight, maxHeight);
  const top = Math.min(
    Math.max(0, frameHeight - height),
    visibleTop + Math.max(OVERLAY_GAP, (visibleHeight - height) / 2)
  );
  return { top, maxHeight, toastBottom: frameHeight - visibleBottom + OVERLAY_GAP };
}

/** Bottom edge of the site's sticky header, which covers the top of the viewport. */
function pinnedHeaderBottom() {
  let bottom = 0;
  document.querySelectorAll('header').forEach((header) => {
    const { position } = window.getComputedStyle(header);
    if (position !== 'sticky' && position !== 'fixed') return;
    const rect = header.getBoundingClientRect();
    if (rect.top <= 1 && rect.bottom > bottom) bottom = rect.bottom;
  });
  return bottom;
}

/** Same-origin tracker embed. Assets live in public/tools/job-tracker/. */
export default function ExpalJobTracker() {
  const { user } = useAuth();
  // Partition browser-local records between EXPAL accounts and guest sessions.
  // This is a local storage scope, never an auth credential or a server-side access check.
  const scope = user?.id ? `account-${String(user.id).replace(/[^a-zA-Z0-9_-]/g, '_')}` : 'guest';
  const src = `/tools/job-tracker/index.html?${new URLSearchParams({ embed: '1', scope })}`;
  const frame = useRef(null);
  const [height, setHeight] = useState(980);
  useEffect(() => {
    function onMessage(event) {
      if (event.origin !== window.location.origin || event.source !== frame.current?.contentWindow) return;
      if (event.data?.type !== 'expal:tracker-height') return;
      const value = event.data.height;
      if (typeof value === 'number' && Number.isFinite(value) && value >= 300 && value <= 20000) {
        setHeight(Math.ceil(value));
      }
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  useEffect(() => {
    const iframe = frame.current;
    if (!iframe) return undefined;
    let observer = null;
    let raf = 0;

    function placeOverlays() {
      let doc;
      try {
        doc = iframe.contentDocument;
      } catch {
        return;
      }
      if (!doc?.body) return;
      const rect = iframe.getBoundingClientRect();
      const viewportTop = pinnedHeaderBottom();
      doc.querySelectorAll('dialog[open]').forEach((dialog) => {
        const { top, maxHeight } = visibleOverlayPlacement(rect.top, rect.height, viewportTop, window.innerHeight, dialog.scrollHeight);
        Object.assign(dialog.style, { top: `${top}px`, bottom: 'auto', margin: '0 auto', maxHeight: `${maxHeight}px` });
      });
      doc.querySelectorAll('.toast:not([hidden])').forEach((toast) => {
        const { toastBottom } = visibleOverlayPlacement(rect.top, rect.height, viewportTop, window.innerHeight, 0);
        toast.style.bottom = `${toastBottom}px`;
      });
    }
    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(placeOverlays);
    };
    function attach() {
      observer?.disconnect();
      try {
        const doc = iframe.contentDocument;
        if (!doc?.body) return;
        observer = new MutationObserver(placeOverlays);
        observer.observe(doc.body, { subtree: true, attributes: true, attributeFilter: ['open', 'hidden'] });
      } catch {
        observer = null;
      }
    }

    iframe.addEventListener('load', attach);
    attach();
    const resizeObserver = typeof ResizeObserver === 'function' ? new ResizeObserver(schedule) : null;
    resizeObserver?.observe(iframe);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      iframe.removeEventListener('load', attach);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      cancelAnimationFrame(raf);
      observer?.disconnect();
      resizeObserver?.disconnect();
    };
  }, [scope]);

  return (
    <section id="job-tracker" aria-label="EXPal job application tracker" style={{ scrollMarginTop: 88, margin: '40px auto', maxWidth: 1440, padding: '0 16px' }}>
      <iframe
        ref={frame}
        title="EXPal job application tracker"
        src={src}
        key={scope}
        width="100%"
        height={height}
        loading="lazy"
        style={{ display: 'block', width: '100%', border: '1px solid #f0d9d5', borderRadius: 18, background: '#fcf9f8' }}
      />
    </section>
  );
}
