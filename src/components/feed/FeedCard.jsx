import React from "react";
import Avatar from "../ui/Avatar";
import { cn } from "../../lib/cn";

export default function FeedCard({
  username,
  timestamp,
  avatarSrc,
  avatarName,
  children,
  footerLeft,
  footerRight,
  className,
  onClick,
}) {
  const Wrapper = onClick ? "button" : "div";
  const wrapperProps = onClick
    ? { type: "button", onClick, className: cn("expal-card w-full text-left", className) }
    : { className: cn("expal-card", className) };

  return (
    <Wrapper {...wrapperProps}>
      <div className="flex items-center gap-2.5 mb-2.5">
        <Avatar
          src={avatarSrc}
          name={avatarName || username}
          size="md"
          className="!ring-0 !bg-[rgb(var(--coral-pale))] !text-[rgb(var(--coral-dark))]"
        />
        <div className="min-w-0 text-left">
          <div className="font-display text-xs font-semibold text-[rgb(var(--ink))]">{username}</div>
          {timestamp && <div className="text-[11px] text-[rgb(var(--ink-soft))]">{timestamp}</div>}
        </div>
      </div>
      <div className="text-sm text-[rgb(var(--ink-mid))] leading-relaxed mb-2">{children}</div>
      {(footerLeft || footerRight) && (
        <div className="flex justify-between text-[13px] text-[rgb(var(--ink-soft))]">
          <span>{footerLeft}</span>
          <span>{footerRight}</span>
        </div>
      )}
    </Wrapper>
  );
}
