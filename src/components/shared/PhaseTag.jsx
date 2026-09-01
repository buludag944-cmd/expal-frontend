import React from "react";
import { PHASE_CLASS, phaseBadgeText } from "../../lib/phaseDetector";
import { cn } from "../../lib/cn";

export default function PhaseTag({ phase, arrivalDate, city, className }) {
  const pillClass = PHASE_CLASS[phase] || PHASE_CLASS.relocation;
  return (
    <span className={cn("phase-pill", pillClass, className)}>
      ● {phaseBadgeText(phase, arrivalDate, city)}
    </span>
  );
}
