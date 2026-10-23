import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../AuthContext';

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
