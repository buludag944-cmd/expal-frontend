import React from "react";
import { useAuth } from "../AuthContext";
import ExpalJobTracker from "../components/ExpalJobTracker";
import PublicSiteHeader from "../components/PublicSiteHeader";
import Seo from "../components/Seo";
import { MobileScreen } from "../components/mobile/MobileShared";
import { isNativeApp } from "../lib/platform";
import "../styles/public-marketing.css";

export default function JobTracker() {
  const { user } = useAuth();

  if (isNativeApp()) {
    return (
      <MobileScreen title="Job tracker" backTo="/explore" className="mob-screen--tracker">
        <ExpalJobTracker native />
      </MobileScreen>
    );
  }

  return (
    <div className={user ? "" : "public-page"}>
      <Seo
        title="Job application tracker"
        description="Organise job opportunities, track application stages and plan your next action with EXPal. Your records stay in this browser."
        path="/job-tracker"
      />
      {!user && <PublicSiteHeader />}
      <ExpalJobTracker />
    </div>
  );
}
