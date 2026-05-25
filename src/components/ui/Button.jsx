import React from "react";
import { cn } from "../../lib/cn";

const variants = {
  primary:
    "bg-primary-600 text-primary-foreground hover:bg-primary-700 shadow-sm focus-visible:ring-primary-600 dark:focus-visible:ring-[#60a5fa]",
  secondary:
    "bg-surface text-foreground border border-border hover:bg-card shadow-sm",
  ghost: "bg-transparent text-primary hover:bg-primary/10",
  danger: "bg-danger text-white hover:opacity-90 shadow-sm",
};

const sizes = {
  sm: "h-9 min-h-[36px] px-3 text-sm rounded-lg",
  md: "h-11 min-h-[44px] px-4 text-base rounded-xl",
  lg: "h-12 min-h-[44px] px-6 text-base rounded-xl",
};

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className,
  children,
  disabled,
  ...props
}) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium transition ease-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:pointer-events-none disabled:opacity-50",
        variants[variant] || variants.primary,
        sizes[size] || sizes.md,
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden
        />
      )}
      {children}
    </button>
  );
}
