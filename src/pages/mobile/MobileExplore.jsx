import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../AuthContext";
import { PHASE_LABEL } from "../../lib/phaseDetector";
import { MobileScreen, MobileSectionTitle, MobileCard } from "../../components/mobile/MobileShared";

const LINKS = [
  { id: "events", icon: "📅", bg: "#FAECE7", title: "Events", desc: "Workshops and meetups", to: "/community?tab=Events" },
  { id: "housing", icon: "🏠", bg: "#FAECE7", title: "Housing", desc: "Listings and tips", to: "/housing" },
  { id: "knowhow", icon: "💡", bg: "#E6F1FB", title: "Local Know-How", desc: "Daily life shortcuts", to: "/knowhow" },
  { id: "essentials", icon: "📚", bg: "#E1F5EE", title: "Expat Essentials", desc: "Visa, tax, banking guides", to: "/essentials" },
  { id: "referrals", icon: "💼", bg: "#EEEDFE", title: "Referrals", desc: "Jobs and introductions", to: "/referrals" },
  { id: "visa", icon: "🪪", bg: "#E6F1FB", title: "Visa & Permit", desc: "Timeline and IRP", to: "/journey" },
];

export default function MobileExplore() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const phase = user?.phase || "relocation";
  const hint =
    phase === "relocation"
      ? "Practical events and admin guides are highlighted for you."
      : phase === "integration"
        ? "Language and cultural events are a great fit now."
        : "Industry and civic resources match your phase.";

  return (
    <MobileScreen title="Explore">
      <div className="mob-body" style={{ paddingTop: 16 }}>
        <MobileCard>
          <p style={{ fontSize: 13, margin: 0, lineHeight: 1.45, color: "var(--mob-text-secondary)" }}>{hint}</p>
          <p className="mob-explore-phase">● {PHASE_LABEL[phase] || "Relocation"} phase</p>
        </MobileCard>

        <MobileSectionTitle style={{ marginTop: 16 }}>Discover</MobileSectionTitle>
        <div className="mob-explore-grid">
          {LINKS.map((item) => (
            <button
              key={item.id}
              type="button"
              className="mob-explore-card"
              onClick={() => navigate(item.to)}
            >
              <div className="mob-explore-icon" style={{ background: item.bg }}>
                {item.icon}
              </div>
              <div className="mob-explore-text">
                <p className="mob-explore-title">{item.title}</p>
                <p className="mob-explore-desc">{item.desc}</p>
              </div>
              <span className="mob-member-msg" aria-hidden>
                ›
              </span>
            </button>
          ))}
        </div>
      </div>
    </MobileScreen>
  );
}
