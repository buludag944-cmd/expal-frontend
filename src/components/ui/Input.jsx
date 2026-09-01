import React from "react";
import { cn } from "../../lib/cn";

export default function Input({ className, error, ...props }) {
  return (
    <input
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
