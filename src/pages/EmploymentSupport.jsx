import { useState } from "react";
import { isNativeApp } from "../lib/platform";
import MobileEmploymentSupport from "./mobile/MobileEmploymentSupport";

const tabs = [
  { id: "rights", label: "Your rights", icon: "📄" },
  { id: "pip", label: "PIP / performance", icon: "⚠️" },
  { id: "resources", label: "Get support", icon: "🤝" },
  { id: "deadlines", label: "Key deadlines", icon: "📅" },
];

const rights = [
  {
    icon: "🕐",
    color: "purple",
    title: "Probation period",
    desc: "Your employer can dismiss you during probation with minimal notice — but they still cannot discriminate on protected grounds.",
    tags: [
      { label: "Up to 12 months", color: "purple" },
      { label: "No redundancy pay", color: "teal" },
    ],
  },
  {
    icon: "⚖️",
    color: "teal",
    title: "Equality Acts",
    desc: "Protected from discrimination on 9 grounds: gender, civil status, family status, age, disability, race, religion, sexual orientation, membership of the Traveller community.",
    tags: [
      { label: "Always applies", color: "teal" },
      { label: "Even in probation", color: "purple" },
    ],
  },
  {
    icon: "🧾",
    color: "coral",
    title: "Written terms",
    desc: "You're entitled to a written statement of your core terms within 5 days of starting. Ask for this in writing if you haven't received it.",
    tags: [{ label: "Day 5 of employment", color: "coral" }],
  },
  {
    icon: "🪪",
    color: "amber",
    title: "Permit holders",
    desc: "On a Critical Skills or General Employment Permit? Your visa clock keeps running during job searches. You have 12 months to find a new role.",
    tags: [
      { label: "12 months to reskill", color: "amber" },
      { label: "Clock doesn't pause", color: "coral" },
    ],
  },
];

const pipSteps = [
  {
    title: "You receive written notice",
    desc: "Your manager outlines specific concerns. Ask for everything in writing — targets, timeline, review dates. Don't sign anything you don't agree with without reading carefully.",
  },
  {
    title: "You have the right to respond",
    desc: "You can request a meeting, bring a colleague or trade union representative, and submit a written response to any concerns raised.",
  },
  {
    title: "Keep a paper trail",
    desc: "Document every meeting with dates, attendees, and what was said. Send follow-up emails summarising discussions. This protects you if proceedings escalate.",
  },
  {
    title: "If you're dismissed",
    desc: "You may have grounds for unfair dismissal (after 12 months service) or discriminatory dismissal (any time). You have 6 months to file a WRC complaint.",
  },
];

const resources = [
  {
    title: "Workplace Relations Commission (WRC)",
    desc: "File complaints about unfair dismissal, discrimination, or unpaid wages. Free to use.",
    url: "https://www.workplacerelations.ie",
  },
  {
    title: "FLAC — Free Legal Advice Centres",
    desc: "Free drop-in legal clinics across Ireland. No appointment needed.",
    url: "https://www.flac.ie",
  },
  {
    title: "Community Law & Mediation (CLM)",
    desc: "Free legal advice and mediation services. Particularly helpful for employment and tenancy issues.",
    url: "https://communitylawandmediation.ie",
  },
  {
    title: "Citizens Information",
    desc: "Plain-English guides to employment rights, permits, and social welfare in Ireland.",
    url: "https://www.citizensinformation.ie",
  },
  {
    title: "Irish Human Rights & Equality Commission",
    desc: "Legal assistance for equality and discrimination cases, including employment.",
    url: "https://www.ihrec.ie",
  },
];

const deadlines = [
  {
    color: "#E24B4A",
    title: "WRC complaint — unfair/discriminatory dismissal",
    desc: "Must be filed within 6 months of dismissal date (extendable to 12 in exceptional circumstances)",
    date: "6 months",
  },
  {
    color: "#EF9F27",
    title: "Subject Access Request (SAR) to employer",
    desc: "Employer must respond within 1 month. Useful for obtaining missing documents before WRC filing.",
    date: "1 month reply",
  },
  {
    color: "#EF9F27",
    title: "Critical Skills Permit — job search window",
    desc: "You have up to 12 months to secure new employment after losing your role. Notify DETE.",
    date: "12 months",
  },
  {
    color: "#639922",
    title: "Written terms of employment",
    desc: "Your employer must provide core written terms within 5 days of your start date.",
    date: "Day 5",
  },
  {
    color: "#639922",
    title: "Payslip entitlement",
    desc: "You're entitled to a payslip on or before every pay date, with full breakdowns of deductions.",
    date: "Every pay date",
  },
];

const colorMap = {
  purple: { bg: "#EEEDFE", text: "#3C3489", border: "#AFA9EC" },
  teal: { bg: "#E1F5EE", text: "#085041", border: "#5DCAA5" },
  coral: { bg: "#FAECE7", text: "#712B13", border: "#F0997B" },
  amber: { bg: "#FAEEDA", text: "#633806", border: "#EF9F27" },
};

function Tag({ label, color }) {
  const c = colorMap[color] || colorMap.purple;
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 500,
        padding: "3px 10px",
        borderRadius: 20,
        background: c.bg,
        color: c.text,
        border: `0.5px solid ${c.border}`,
      }}
    >
      {label}
    </span>
  );
}

function RightsTab() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        gap: 10,
      }}
    >
      {rights.map((r) => {
        const c = colorMap[r.color] || colorMap.purple;
        return (
          <div
            key={r.title}
            style={{
              background: "#fff",
              border: "0.5px solid #e5e5e5",
              borderRadius: 12,
              padding: "1rem",
            }}
          >
            <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  flexShrink: 0,
                  background: c.bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                }}
              >
                {r.icon}
              </div>
              <div>
                <p
                  style={{
                    fontWeight: 600,
                    fontSize: 14,
                    margin: "0 0 2px",
                    color: "#1a1814",
                  }}
                >
                  {r.title}
                </p>
                <p style={{ fontSize: 13, color: "#6b6860", lineHeight: 1.55, margin: 0 }}>
                  {r.desc}
                </p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
              {r.tags.map((t) => (
                <Tag key={t.label} {...t} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PipTab() {
  return (
    <div>
      <div
        style={{
          background: "#fff",
          border: "0.5px solid #e5e5e5",
          borderRadius: 12,
          padding: "1.25rem",
          marginBottom: 10,
        }}
      >
        <p style={{ fontSize: 13, color: "#6b6860", marginBottom: "1rem", lineHeight: 1.6 }}>
          A Performance Improvement Plan (PIP) is a formal process — but it doesn't always mean your role
          is at risk. Here's what typically happens:
        </p>
        {pipSteps.map((s, i) => (
          <div key={i} style={{ display: "flex", gap: 12, marginBottom: 14 }}>
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                background: "#EEEDFE",
                color: "#3C3489",
                fontSize: 12,
                fontWeight: 600,
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginTop: 1,
              }}
            >
              {i + 1}
            </div>
            <div>
              <p style={{ fontWeight: 600, fontSize: 13, margin: "0 0 2px", color: "#1a1814" }}>
                {s.title}
              </p>
              <p style={{ fontSize: 12, color: "#6b6860", lineHeight: 1.5, margin: 0 }}>
                {s.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
      <div
        style={{
          background: "#EEEDFE",
          borderLeft: "3px solid #534AB7",
          borderRadius: "0 8px 8px 0",
          padding: "10px 14px",
        }}
      >
        <p style={{ fontSize: 13, color: "#26215C", lineHeight: 1.55, margin: 0 }}>
          <strong style={{ fontWeight: 600 }}>Not sure if your PIP is fair?</strong> Free legal advice is
          available at FLAC and Community Law & Mediation — see the Get support tab.
        </p>
      </div>
    </div>
  );
}

function ResourcesTab() {
  return (
    <div style={{ background: "#fff", border: "0.5px solid #e5e5e5", borderRadius: 12, padding: "0.25rem 1.25rem" }}>
      {resources.map((r, i) => (
        <a
          key={i}
          href={r.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 0",
            textDecoration: "none",
            color: "inherit",
            borderBottom: i < resources.length - 1 ? "0.5px solid #e5e5e5" : "none",
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "#EEEDFE",
              color: "#534AB7",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
              flexShrink: 0,
            }}
          >
            🔗
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 600, fontSize: 13, margin: "0 0 1px", color: "#1a1814" }}>
              {r.title}
            </p>
            <p style={{ fontSize: 12, color: "#6b6860", margin: 0 }}>{r.desc}</p>
          </div>
          <span style={{ fontSize: 14, color: "#9a9890" }}>→</span>
        </a>
      ))}
    </div>
  );
}

function DeadlinesTab() {
  return (
    <div>
      <div style={{ background: "#fff", border: "0.5px solid #e5e5e5", borderRadius: 12, padding: "0.25rem 1.25rem", marginBottom: 10 }}>
        {deadlines.map((d, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 0",
              borderBottom: i < deadlines.length - 1 ? "0.5px solid #e5e5e5" : "none",
            }}
          >
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: d.color, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 600, fontSize: 13, margin: "0 0 1px", color: "#1a1814" }}>
                {d.title}
              </p>
              <p style={{ fontSize: 12, color: "#6b6860", margin: 0 }}>{d.desc}</p>
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#6b6860", whiteSpace: "nowrap" }}>
              {d.date}
            </span>
          </div>
        ))}
      </div>
      <div
        style={{
          background: "#EEEDFE",
          borderLeft: "3px solid #534AB7",
          borderRadius: "0 8px 8px 0",
          padding: "10px 14px",
        }}
      >
        <p style={{ fontSize: 13, color: "#26215C", lineHeight: 1.55, margin: 0 }}>
          <strong style={{ fontWeight: 600 }}>Tip:</strong> Save screenshots of all meetings, emails, and
          HR communications. Even informal messages count as evidence.
        </p>
      </div>
    </div>
  );
}

export default function EmploymentSupport() {
  const [activeTab, setActiveTab] = useState("rights");

  if (isNativeApp()) {
    return <MobileEmploymentSupport />;
  }

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "1.5rem 1rem" }}>
      <div style={{ marginBottom: "1.75rem" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.07em",
            textTransform: "uppercase",
            color: "#3C3489",
            background: "#EEEDFE",
            border: "0.5px solid #AFA9EC",
            borderRadius: 20,
            padding: "3px 12px",
            marginBottom: "0.75rem",
          }}
        >
          🛡️ Employment support
        </div>
        <p style={{ fontSize: 22, fontWeight: 700, color: "#1a1814", margin: "0 0 0.35rem" }}>
          You have more rights than you think
        </p>
        <p style={{ fontSize: 14, color: "#6b6860", lineHeight: 1.6, margin: 0 }}>
          Navigating work issues in a new country is hard. Here's everything you need to know — in plain
          language.
        </p>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: "10px 14px",
              minHeight: 44,
              fontSize: 13,
              fontWeight: 600,
              borderRadius: 10,
              cursor: "pointer",
              transition: "all 0.15s",
              border: activeTab === t.id ? "0.5px solid #AFA9EC" : "0.5px solid #d5d5d5",
              background: activeTab === t.id ? "#EEEDFE" : "#fff",
              color: activeTab === t.id ? "#3C3489" : "#6b6860",
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {activeTab === "rights" && <RightsTab />}
      {activeTab === "pip" && <PipTab />}
      {activeTab === "resources" && <ResourcesTab />}
      {activeTab === "deadlines" && <DeadlinesTab />}
    </div>
  );
}

