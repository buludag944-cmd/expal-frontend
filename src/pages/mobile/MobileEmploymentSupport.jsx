import React, { useState } from "react";
import { MobileScreen, MobileCard, MobileCallout, MobileBadge } from "../../components/mobile/MobileShared";
import { useLocalTabSwipe } from "../../hooks/useSwipeNav";

const TABS = ["Your rights", "PIP", "Get support", "Deadlines"];

const RIGHTS = [
  { icon: "🕐", title: "Probation period", desc: "Employer can dismiss with minimal notice — but cannot discriminate on protected grounds.", tags: [{ label: "Up to 12 months", color: "purple" }, { label: "No redundancy pay", color: "teal" }] },
  { icon: "⚖️", title: "Equality Acts", desc: "Protected from discrimination on 9 grounds including gender, age, disability, race, religion, and more.", tags: [{ label: "Always applies", color: "teal" }, { label: "Even in probation", color: "purple" }] },
  { icon: "🧾", title: "Written terms", desc: "Entitled to written statement of core terms within 5 days of starting.", tags: [{ label: "Day 5 of employment", color: "coral" }] },
  { icon: "🪪", title: "Permit holders", desc: "On CSEP or GEP? Visa clock keeps running during job searches — 12 months to find a new role.", tags: [{ label: "12 months to reskill", color: "amber" }, { label: "Clock doesn't pause", color: "coral" }] },
];

const PIP_STEPS = [
  { title: "You receive written notice", desc: "Manager outlines specific concerns. Ask for everything in writing." },
  { title: "You have the right to respond", desc: "Request a meeting, bring a colleague or union rep, submit a written response." },
  { title: "Keep a paper trail", desc: "Document every meeting with dates, attendees, and what was said." },
  { title: "If you're dismissed", desc: "You may have grounds for unfair dismissal. File WRC complaint within 6 months." },
];

const RESOURCES = [
  { title: "Workplace Relations Commission", desc: "File complaints about unfair dismissal, discrimination, unpaid wages.", url: "https://www.workplacerelations.ie" },
  { title: "FLAC — Free Legal Advice Centres", desc: "Free drop-in legal clinics across Ireland.", url: "https://www.flac.ie" },
  { title: "Community Law & Mediation", desc: "Free legal advice and mediation.", url: "https://communitylawandmediation.ie" },
  { title: "Citizens Information", desc: "Plain-English guides to employment rights and permits.", url: "https://www.citizensinformation.ie" },
];

const DEADLINES = [
  { dot: "#E24B4A", title: "WRC complaint — dismissal", desc: "File within 6 months of dismissal", date: "6 months" },
  { dot: "#EF9F27", title: "Subject Access Request", desc: "Employer must respond within 1 month", date: "1 month" },
  { dot: "#EF9F27", title: "CSEP job search window", desc: "Up to 12 months to secure new employment", date: "12 months" },
  { dot: "#0F6E56", title: "Written employment terms", desc: "Employer must provide within 5 days", date: "Day 5" },
];

export default function MobileEmploymentSupport() {
  const [activeTab, setActiveTab] = useState("Your rights");
  const { onTouchStart, onTouchMove, onTouchEnd } = useLocalTabSwipe(TABS, activeTab, setActiveTab);

  return (
    <MobileScreen
      title="Employment support"
      backTo="/"
      chromeExtra={
        <div className="mob-chip-scroll">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              className={`mob-chip${activeTab === t ? " mob-chip--on" : ""}`}
              onClick={() => setActiveTab(t)}
            >
              {t}
            </button>
          ))}
        </div>
      }
    >
      <div
        className="mob-body"
        style={{ paddingTop: 12 }}
        data-no-route-swipe
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {activeTab === "Your rights" && (
          <>
            <MobileCallout>You have more rights than you think — even during probation.</MobileCallout>
            {RIGHTS.map((r) => (
              <MobileCard key={r.title}>
                <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 20 }}>{r.icon}</span>
                  <div>
                    <p className="mob-ref-name">{r.title}</p>
                    <p className="mob-ref-role" style={{ lineHeight: 1.45 }}>{r.desc}</p>
                  </div>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {r.tags.map((tag) => (
                    <MobileBadge key={tag.label} label={tag.label} color={tag.color} />
                  ))}
                </div>
              </MobileCard>
            ))}
          </>
        )}

        {activeTab === "PIP" && (
          <>
            <MobileCard>
              <p style={{ fontSize: 12, color: "var(--mob-text-secondary)", lineHeight: 1.45, margin: "0 0 12px" }}>
                A Performance Improvement Plan is formal — but it doesn&apos;t always mean your role is at risk.
              </p>
              {PIP_STEPS.map((s, i) => (
                <div key={s.title} className="mob-pip-step">
                  <div className="mob-step-num">{i + 1}</div>
                  <div>
                    <p className="mob-ref-name" style={{ fontSize: 12 }}>{s.title}</p>
                    <p className="mob-ref-role" style={{ lineHeight: 1.4 }}>{s.desc}</p>
                  </div>
                </div>
              ))}
            </MobileCard>
            <MobileCallout>Free legal advice at FLAC and CLM — see Get support tab.</MobileCallout>
          </>
        )}

        {activeTab === "Get support" && (
          <MobileCard style={{ padding: 0 }}>
            {RESOURCES.map((r) => (
              <a key={r.title} href={r.url} target="_blank" rel="noopener noreferrer" className="mob-resource-item">
                <span style={{ fontSize: 16 }}>🔗</span>
                <div style={{ flex: 1 }}>
                  <p className="mob-ref-name" style={{ fontSize: 12 }}>{r.title}</p>
                  <p className="mob-ref-role">{r.desc}</p>
                </div>
                <span className="mob-settings-arrow">›</span>
              </a>
            ))}
          </MobileCard>
        )}

        {activeTab === "Deadlines" && (
          <>
            <MobileCard style={{ padding: 0 }}>
              {DEADLINES.map((d) => (
                <div key={d.title} className="mob-deadline-item">
                  <div className="mob-deadline-dot" style={{ background: d.dot }} />
                  <div style={{ flex: 1 }}>
                    <p className="mob-ref-name" style={{ fontSize: 12 }}>{d.title}</p>
                    <p className="mob-ref-role">{d.desc}</p>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 600, color: d.dot }}>{d.date}</span>
                </div>
              ))}
            </MobileCard>
            <MobileCallout color="amber">
              Save screenshots of meetings, emails, and HR communications — they count as evidence.
            </MobileCallout>
          </>
        )}
      </div>
    </MobileScreen>
  );
}
