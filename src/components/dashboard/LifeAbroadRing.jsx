import React from "react";

export default function LifeAbroadRing({ score = 0, size = 72 }) {
  const pct = Math.min(100, Math.max(0, score));
  const filled = Math.round((pct / 100) * 4);

  return (
    <div
      className="relative inline-flex items-center justify-center rounded-full border-[5px] border-[#f0ecec]"
      style={{
        width: size,
        height: size,
        borderTopColor: filled >= 1 ? "rgb(var(--success))" : undefined,
        borderRightColor: filled >= 2 ? "rgb(var(--success))" : undefined,
        borderBottomColor: filled >= 3 ? "rgb(var(--success))" : undefined,
        borderLeftColor: filled >= 4 ? "rgb(var(--success))" : undefined,
      }}
    >
      <div className="text-center">
        <div className="font-display text-[22px] font-extrabold text-[rgb(var(--ink))] leading-none">{pct}</div>
        <div className="text-[9px] text-[rgb(var(--ink-soft))]">/100</div>
      </div>
    </div>
  );
}
