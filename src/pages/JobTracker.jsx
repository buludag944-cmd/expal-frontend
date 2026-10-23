import React from "react";
import { useAuth } from "../AuthContext";
import ExpalJobTracker from "../components/ExpalJobTracker";
import PublicSiteHeader from "../components/PublicSiteHeader";
import Seo from "../components/Seo";
import "../styles/public-marketing.css";

export default function JobTracker() {
  const { user } = useAuth();
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
