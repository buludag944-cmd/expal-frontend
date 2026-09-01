import React from "react";
import { cn } from "../../lib/cn";

export function Card({ className, children, ...props }) {
  return (
    <div className={cn("expal-card", className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ className, children }) {
  return <div className={cn("border-b border-border px-4 py-3 md:px-5", className)}>{children}</div>;
}

export function CardContent({ className, children }) {
  return <div className={cn("px-4 py-4 md:px-5", className)}>{children}</div>;
}

export function CardFooter({ className, children }) {
  return (
    <div className={cn("border-t border-border px-4 py-3 md:px-5 text-[13px] text-muted", className)}>
      {children}
    </div>
  );
}
