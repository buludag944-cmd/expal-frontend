import React, { useEffect, useMemo, useState } from "react";
import { cn } from "../../lib/cn";
import { normalizeProfileImageUrl } from "../ProfileAvatar";

export default function Avatar({ src, name = "?", size = "md", className }) {
  const initials = (name || "?")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";

  const sizeClass =
    size === "sm" ? "h-8 w-8 text-xs" : size === "lg" ? "h-12 w-12 text-base" : "h-10 w-10 text-sm";

  const resolvedSrc = useMemo(() => normalizeProfileImageUrl(src), [src]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [resolvedSrc]);

  if (resolvedSrc && !failed) {
    return (
      <img
        src={resolvedSrc}
        alt=""
        referrerPolicy="no-referrer"
        decoding="async"
        onError={() => setFailed(true)}
        className={cn("rounded-full object-cover ring-2 ring-border", sizeClass, className)}
      />
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-[rgb(var(--coral-pale))] font-display font-bold text-[rgb(var(--coral-dark))] ring-0",
        sizeClass,
        className
      )}
      aria-hidden
    >
      {initials}
    </span>
  );
}
