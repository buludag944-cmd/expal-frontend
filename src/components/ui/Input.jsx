import React from "react";
import { cn } from "../../lib/cn";

const fieldClass =
  "w-full min-h-[44px] rounded-xl border border-border bg-surface px-4 py-2.5 text-foreground placeholder:text-muted transition ease-out focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25";

export default function Input({ className, error, ...props }) {
  return (
    <input
      className={cn(fieldClass, error && "border-danger focus:ring-danger/25", className)}
      {...props}
    />
  );
}

export function Textarea({ className, error, rows = 4, ...props }) {
  return (
    <textarea
      rows={rows}
      className={cn(fieldClass, "min-h-[100px] resize-y", error && "border-danger focus:ring-danger/25", className)}
      {...props}
    />
  );
}

export function Label({ className, children, ...props }) {
  return (
    <label className={cn("mb-1.5 block text-sm font-medium text-foreground", className)} {...props}>
      {children}
    </label>
  );
}
