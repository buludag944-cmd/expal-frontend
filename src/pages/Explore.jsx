import React from "react";
import { Link } from "react-router-dom";
import { Calendar, House, Lightbulb, BookOpen, Shield, BriefcaseBusiness } from "lucide-react";
import { Card, CardContent } from "../components/ui/Card";
import { useAuth } from "../AuthContext";
import { PHASE_CLASS, PHASE_LABEL } from "../lib/phaseDetector";
import { isNativeApp } from "../lib/platform";
import { exploreLinks } from "../lib/exploreLinks";
import MobileExplore from "./mobile/MobileExplore";

const ICONS = {
  "/events": Calendar,
  "/housing": House,
  "/scam-checker": Shield,
  "/knowhow": Lightbulb,
  "/essentials": BookOpen,
  "/job-tracker": BriefcaseBusiness,
};

export default function Explore() {
  const { user } = useAuth();
  if (isNativeApp()) {
    return <MobileExplore />;
  }
  const phase = user?.phase || "relocation";
  const hint =
    phase === "relocation"
      ? "Practical workshops and admin events are highlighted for you."
      : phase === "integration"
        ? "Language exchanges and cultural events are a great fit now."
        : "Industry and civic events match your phase.";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Explore</h1>
        <p className="page-lead">{hint}</p>
        {PHASE_CLASS[phase] && (
          <span className={`phase-pill mt-2 ${PHASE_CLASS[phase]}`}>
            ● {PHASE_LABEL[phase]} phase
          </span>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {exploreLinks.map(({ to, title, desc, tint }) => {
          const Icon = ICONS[to];
          return (
            <Link key={to} to={to} className="block group">
              <Card className="h-full group-hover:shadow-md transition">
                <CardContent className="flex gap-3 pt-5">
                  <Icon className={`h-8 w-8 shrink-0 ${tint}`} />
                  <div>
                    <h2 className="font-semibold">{title}</h2>
                    <p className="text-sm text-muted">{desc}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
