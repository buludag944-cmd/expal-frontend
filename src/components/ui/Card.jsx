import React from "react";
import { cn } from "../../lib/cn";

export function Card({ className, children, ...props }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card text-foreground shadow-md transition ease-out",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children }) {
  return <div className={cn("border-b border-border px-5 py-4 md:px-6", className)}>{children}</div>;
}

export function CardContent({ className, children }) {
  return <div className={cn("px-5 py-4 md:px-6", className)}>{children}</div>;
}

export function CardFooter({ className, children }) {
  return (
    <div className={cn("border-t border-border px-5 py-4 md:px-6", className)}>{children}</div>
  );
}
