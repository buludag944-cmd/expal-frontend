import React from "react";
import { cn } from "../lib/cn";
import { ReactComponent as ExpalLogoSvg } from "../assets/expal-logo.svg";
import { ReactComponent as ExpalLogoFullSvg } from "../assets/expal-logo-full.svg";

export default function AppLogo({ size = 36, showText = false, variant = "default", className }) {
  const isHeader = variant === "header";
  const isBrand = variant === "brand";
  const Logo = isBrand ? ExpalLogoFullSvg : ExpalLogoSvg;

  return (
    <span className={cn("flex items-center gap-2 shrink-0", className)}>
      <Logo
        role="img"
        aria-label="Expal"
        className={cn(
          "shrink-0 block overflow-hidden",
          isHeader ? "rounded-[10px]" : isBrand ? "rounded-2xl shadow-md" : "rounded-xl shadow-sm"
        )}
        style={{ width: size, height: size }}
      />
      {showText && !isHeader ? (
        <span className="font-semibold text-foreground hidden sm:inline">Expal</span>
      ) : null}
    </span>
  );
}
