import React from "react";
import { cn } from "../../lib/cn";

const DATE_TYPES = new Set(["date", "datetime-local", "month", "time", "week"]);

export default function Input({ className, error, type, lang, ...props }) {
  return (
    <input
      type={type}
      lang={lang ?? (DATE_TYPES.has(type) ? "en" : undefined)}
      className={cn(
        "form-input",
        error && "border-[rgb(var(--coral))] focus:ring-[rgb(var(--coral))]/25",
        className
      )}
      {...props}
    />
  );
}

export function Textarea({ className, error, rows = 4, ...props }) {
  return (
    <textarea
      rows={rows}
      className={cn(
        "form-input min-h-[100px] resize-y",
        error && "border-[rgb(var(--coral))]",
        className
      )}
      {...props}
    />
  );
}

export function Label({ className, children, ...props }) {
  return (
    <label className={cn("input-label", className)} {...props}>
      {children}
    </label>
  );
}
