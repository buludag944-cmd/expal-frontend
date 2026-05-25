import React from "react";
import { cn } from "../../lib/cn";

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

  if (src) {
    return (
      <img
        src={src}
        alt=""
        className={cn("rounded-full object-cover ring-2 ring-border", sizeClass, className)}
      />
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-primary/15 font-semibold text-primary ring-2 ring-border",
        sizeClass,
        className
      )}
      aria-hidden
    >
      {initials}
    </span>
  );
}
