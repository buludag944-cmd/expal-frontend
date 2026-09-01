import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../AuthContext";
import { fetchDashboard } from "../../lib/journeyApi";
import { fetchUnreadNotificationCount } from "../../lib/notificationsApi";
import { MobileCard, MobileSectionTitle, MobileScreen } from "../../components/mobile/MobileShared";

const FEATURES = [
  { id: "explore", icon: "🧭", bg: "#E6F1FB", to: "/explore" },
  { id: "housing", icon: "🏠", bg: "#FAECE7", to: "/housing" },
  { id: "community", icon: "👥", bg: "#E1F5EE", to: "/community" },
  { id: "members", icon: "🧑‍🤝‍🧑", bg: "#EEEDFE", to: "/users" },
  { id: "referrals", icon: "💼", bg: "#E6F1FB", to: "/referrals" },
  { id: "visa", icon: "🪪", bg: "#E6F1FB", to: "/journey" },
  { id: "messages", icon: "💬", bg: "#EEEDFE", to: "/messages" },
  { id: "rights", icon: "⚖️", bg: "#FAEEDA", to: "/employment-support" },
  { id: "events", icon: "📅", bg: "#FAECE7", to: "/community?tab=Events" },
  { id: "help", icon: "❓", bg: "#E1F5EE", to: "/help" },
];

function daysSince(dateStr) {
  if (!dateStr) return null;
  const start = new Date(dateStr);
  const now = new Date();
  return Math.max(0, Math.floor((now - start) / (1000 * 60 * 60 * 24)));
}

function greetingForNow() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function MobileHome() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!token) return;
    fetchDashboard(token).then(setData).catch(() => setData(null));
    const loadUnread = () =>
      fetchUnreadNotificationCount(token).then(setUnread).catch(() => setUnread(0));
    loadUnread();
    const id = window.setInterval(loadUnread, 30000);
    const onFocus = () => loadUnread();
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [token]);

  const firstName = user?.firstName || "there";
  const daysHere = daysSince(user?.arrivalDate) ?? "—";
  const city = user?.destinationCity || "Ireland";
  const since = user?.arrivalDate
    ? `Since ${new Date(user.arrivalDate).toLocaleDateString("en-IE", { month: "short", year: "numeric" })}`
    : "Complete onboarding";

  const alerts = [];
  if (unread > 0) {
    alerts.push({
      dot: "#534AB7",
      title: unread === 1 ? "1 unread notification" : `${unread} unread notifications`,
      sub: "Messages and community activity",
      to: "/notifications",
    });
  }
  if (data?.urgentTasks?.length) {
    const t = data.urgentTasks[0];
    alerts.push({
      dot: "#E24B4A",
      title: t.title,
      sub: t.dueDate ? `Due ${t.dueDate}` : "Action needed",
      to: "/journey",
    });
  }
  alerts.push({
    dot: "#EF9F27",
    title: `Expat community in ${city}`,
    sub: "Join threads and events nearby",
    to: "/community",
  });
  if (data?.mentorMatch?.mentor) {
    alerts.push({
      dot: "#0F6E56",
      title: "Mentor match found",
      sub: `${data.mentorMatch.mentor.firstName} can help with your move`,
      to: "/messages",
    });
  }

  if (user && !user.onboardingComplete) {
    return (
      <MobileScreen
        chromeExtra={
          <div className="mob-home-header">
            <p className="mob-home-greeting">Welcome</p>
            <h1 className="mob-home-name">Let&apos;s set up your move</h1>
          </div>
        }
      >
        <div className="mob-body" style={{ paddingTop: 16 }}>
          <MobileCard>
            <p style={{ fontSize: 14, margin: "0 0 12px", color: "var(--mob-text-secondary)" }}>
              Personalise your visa guide, timeline, and community in a few steps.
            </p>
            <Link to="/onboarding" className="mob-btn-primary" style={{ display: "block", textAlign: "center", height: 44, lineHeight: "44px", textDecoration: "none" }}>
              Continue setup →
            </Link>
          </MobileCard>
        </div>
      </MobileScreen>
    );
  }

  return (
    <MobileScreen
      chromeExtra={
        <div className="mob-home-header">
          <div className="mob-home-header-top">
            <div>
              <p className="mob-home-greeting">{greetingForNow()} 👋</p>
              <h1 className="mob-home-name">Welcome back, {firstName}</h1>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <Link to="/notifications" className="mob-home-avatar-btn" aria-label="Notifications" style={{ position: "relative" }}>
                🔔
                {unread > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: 2,
                      right: 2,
                      minWidth: 16,
                      height: 16,
                      borderRadius: 8,
                      background: "#c93b55",
                      color: "#fff",
                      fontSize: 10,
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "0 4px",
                    }}
                  >
                    {unread > 99 ? "99+" : unread}
                  </span>
                )}
              </Link>
              <Link to="/profile" className="mob-home-avatar-btn" aria-label="Profile">
                👤
              </Link>
            </div>
          </div>
          <div className="mob-stat-row">
            <div className="mob-stat-card">
              <div className="mob-stat-label">Days in {city}</div>
              <div className="mob-stat-val">{daysHere}</div>
              <div className="mob-stat-sub">{since}</div>
            </div>
            <div className="mob-stat-card">
              <div className="mob-stat-label">Visa pathway</div>
              <div className="mob-stat-val" style={{ fontSize: 13 }}>
                {user?.visaType ? "✓" : "—"}
              </div>
              <div className="mob-stat-sub">{user?.visaType ? "Set" : "Add in onboarding"}</div>
            </div>
            <div className="mob-stat-card">
              <div className="mob-stat-label">Open tasks</div>
              <div className="mob-stat-val">{data?.urgentTasks?.length ?? 0}</div>
              <div className="mob-stat-sub">View timeline</div>
            </div>
          </div>
        </div>
      }
    >
      <div className="mob-body" style={{ paddingTop: 16 }}>
        <button
          type="button"
          className="mob-search-wrap mob-home-search"
          onClick={() => navigate("/search")}
          aria-label="Search members and topics"
        >
          <span className="mob-home-search-icon" aria-hidden>
            🔍
          </span>
          <span className="mob-home-search-placeholder">Search members or topics…</span>
        </button>

        <MobileSectionTitle>Quick access</MobileSectionTitle>
        <div className="mob-feature-grid">
          {FEATURES.map((f) => (
            <button
              key={f.id}
              type="button"
              className="mob-feature-item"
              onClick={() => navigate(f.to)}
            >
              <div className="mob-feature-icon" style={{ background: f.bg }}>
                {f.icon}
              </div>
              <span className="mob-feature-label">{f.id.charAt(0).toUpperCase() + f.id.slice(1)}</span>
            </button>
          ))}
        </div>

        <MobileSectionTitle style={{ marginTop: 12 }}>Alerts for you</MobileSectionTitle>
        {alerts.map((a, i) => (
          <Link key={i} to={a.to} className="mob-alert-card mob-card">
            <div className="mob-alert-dot" style={{ background: a.dot }} />
            <div style={{ flex: 1 }}>
              <p className="mob-alert-title">{a.title}</p>
              <p className="mob-alert-sub">{a.sub}</p>
            </div>
            <span className="mob-alert-arrow">›</span>
          </Link>
        ))}
      </div>
    </MobileScreen>
  );
}
