import React, { useEffect, useMemo, useState } from "react";

const AVATAR_COLORS = ["#534AB7", "#0F6E56", "#C93B55", "#854F0B", "#185FA5", "#639922"];

/** True for data URLs, http(s), or protocol-relative URLs we can render. */
export function isUsableImageSrc(src) {
  if (!src || typeof src !== "string") return false;
  const value = src.trim();
  if (!value) return false;
  if (value.startsWith("data:image/")) return true;
  if (value.startsWith("https://") || value.startsWith("http://")) return true;
  if (value.startsWith("//")) return true;
  return false;
}

/**
 * Google profile CDNs often block WebView loads that send a referrer.
 * Force a stable size when a size hint exists; leave other URLs alone.
 */
export function normalizeProfileImageUrl(src) {
  if (!isUsableImageSrc(src)) return null;
  let url = src.trim();
  if (url.startsWith("//")) url = `https:${url}`;

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    if (host.includes("googleusercontent.com") || host.includes("ggpht.com")) {
      // Replace trailing size tokens like =s96-c or =s96-c-rp-mo-br100
      if (/=s\d+/.test(parsed.pathname + parsed.search)) {
        return url.replace(/=s\d+(-[a-z0-9-]*)?/i, "=s256-c");
      }
      if (!parsed.searchParams.has("sz")) {
        parsed.searchParams.set("sz", "256");
        return parsed.toString();
      }
    }
  } catch {
    /* keep original */
  }
  return url;
}

function initialsFromName(name) {
  return (name || "?")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";
}

function colorForKey(key) {
  const n = Number(key);
  if (Number.isFinite(n) && n > 0) return AVATAR_COLORS[n % AVATAR_COLORS.length];
  const str = String(key || "0");
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) hash = (hash + str.charCodeAt(i) * (i + 1)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[hash];
}

/**
 * Profile photo with Google / WebView-safe loading and initials fallback.
 */
export default function ProfileAvatar({
  src,
  name = "?",
  userId,
  className = "",
  style,
  size,
}) {
  const resolvedSrc = useMemo(() => normalizeProfileImageUrl(src), [src]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [resolvedSrc]);

  const showImage = resolvedSrc && !failed;
  const initials = initialsFromName(name);
  const bg = colorForKey(userId ?? name);
  const sizeStyle = size
    ? { width: size, height: size, borderRadius: size / 2, fontSize: Math.max(11, Math.round(size * 0.32)) }
    : undefined;

  if (showImage) {
    return (
      <img
        src={resolvedSrc}
        alt=""
        className={className}
        style={{ objectFit: "cover", ...sizeStyle, ...style }}
        referrerPolicy="no-referrer"
        decoding="async"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div
      className={className}
      style={{
        background: bg,
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 600,
        flexShrink: 0,
        ...sizeStyle,
        ...style,
      }}
      aria-hidden
    >
      {initials}
    </div>
  );
}
