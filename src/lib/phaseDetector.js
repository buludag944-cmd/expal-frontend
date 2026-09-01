export function monthsDiff(from, to) {
  const years = to.getFullYear() - from.getFullYear();
  const months = to.getMonth() - from.getMonth();
  return years * 12 + months;
}

export function detectPhase(arrivalDate) {
  if (!arrivalDate) return "relocation";
  const months = monthsDiff(new Date(arrivalDate), new Date());
  if (months < 3) return "relocation";
  if (months < 18) return "integration";
  if (months < 36) return "establishment";
  return "longterm";
}

export const PHASE_CLASS = {
  relocation: "phase-relocation",
  integration: "phase-integration",
  establishment: "phase-establishment",
  longterm: "phase-longterm",
};

export const PHASE_LABEL = {
  relocation: "Relocation",
  integration: "Integration",
  establishment: "Establishment",
  longterm: "Long-term",
};

export function phaseBadgeText(phase, arrivalDate, city) {
  const c = city || "your city";
  if (!arrivalDate) return PHASE_LABEL[phase] || phase;
  const months = monthsDiff(new Date(arrivalDate), new Date());
  if (phase === "relocation") return "Recently arrived";
  if (phase === "integration") return `${months} month${months === 1 ? "" : "s"} in ${c}`;
  if (phase === "establishment") return "Established resident";
  if (phase === "longterm") return `Lifer in ${c}`;
  return PHASE_LABEL[phase] || phase;
}
