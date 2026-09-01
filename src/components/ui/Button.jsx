import React from "react";
import { cn } from "../../lib/cn";

const variants = {
  primary:
    "bg-primary text-primary-foreground hover:bg-primary-700 shadow-md font-display font-semibold rounded-full",
  secondary:
    "bg-white text-primary border-[1.5px] border-primary hover:bg-[rgb(var(--coral-pale))] font-display font-semibold rounded-full",
  sky: "bg-[rgb(var(--sky))] text-white hover:opacity-90 font-display font-semibold rounded-full shadow-[0_6px_20px_rgba(58,189,224,0.28)]",
  ghost:
    "bg-transparent text-[rgb(var(--ink-soft))] border border-[rgba(0,0,0,0.06)] hover:bg-[rgb(var(--surface-2))] font-display font-semibold rounded-full",
  danger: "bg-danger text-white hover:opacity-90 font-display font-semibold rounded-full",
};

const sizes = {
  sm: "h-9 min-h-[36px] px-4 text-xs",
  md: "h-11 min-h-[44px] px-6 text-sm",
  lg: "h-12 min-h-[48px] px-8 text-base",
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
        "inline-flex items-center justify-center gap-2 transition ease-out active:scale-[0.97]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
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
