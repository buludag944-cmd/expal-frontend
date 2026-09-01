import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../AuthContext";
import { getApiBaseUrl } from "../../apiConfig";
import { setupPushNotifications } from "../../lib/pushNotifications";
import ProfileAvatar from "../../components/ProfileAvatar";
import { MobileScreen, MobilePostSheet } from "../../components/mobile/MobileShared";
import {
  getStoredThemePreference,
  setThemePreference,
  resolveTheme,
} from "../../components/ThemeToggle";
import { restartWalkthrough } from "../../components/Walkthrough";
import MobileAdminSection from "./MobileAdminSection";

const API = getApiBaseUrl();

const SETTINGS = [
  {
    title: "Account",
    items: [
      { emoji: "🪪", label: "Permit & visa details", bg: "#EEEDFE", to: "/journey" },
      { emoji: "🔔", label: "Enable push alerts", bg: "#E1F5EE", action: "notifications" },
      { emoji: "📬", label: "Notification inbox", bg: "#EEEDFE", to: "/notifications" },
      { emoji: "🔒", label: "Privacy & data", bg: "#FAECE7", to: "/privacy" },
      { emoji: "✏️", label: "Edit profile", bg: "#E6F1FB", action: "edit" },
    ],
  },
  {
    title: "Appearance",
    items: [{ emoji: "🌓", label: "Theme", bg: "#E6F1FB", action: "theme" }],
  },
  {
    title: "Support",
    items: [
      { emoji: "⚖️", label: "Employment rights", bg: "#EEEDFE", to: "/employment-support" },
      { emoji: "❓", label: "Help & FAQs", bg: "#E6F1FB", to: "/help" },
      { emoji: "🧭", label: "Replay walkthrough", bg: "#E1F5EE", action: "walkthrough" },
      { emoji: "📩", label: "Contact founder", bg: "#FAEEDA", action: "contact" },
    ],
  },
];

function daysSince(dateStr) {
  if (!dateStr) return "—";
  return String(Math.max(0, Math.floor((Date.now() - new Date(dateStr)) / (1000 * 60 * 60 * 24))));
}

export default function MobileProfile() {
  const { user, token, logout, refreshUser } = useAuth();
  const [showEdit, setShowEdit] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [contactMsg, setContactMsg] = useState("");
  const [contactBusy, setContactBusy] = useState(false);
  const [contactStatus, setContactStatus] = useState("");
  const [themePref, setThemePref] = useState(getStoredThemePreference);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    nationality: "",
    currentCity: "",
    company: "",
    industry: "",
    bio: "",
    profileImage: "",
    interests: [],
  });

  useEffect(() => {
    if (!user) return;
    setForm({
      nationality: user.nationality || "",
      currentCity: user.currentCity || user.destinationCity || "",
      company: user.company || "",
      industry: user.industry || "",
      bio: user.bio || "",
      profileImage: user.profileImage || "",
      interests: user.interests || [],
    });
  }, [user]);

  const name = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Expat";
  const email = user?.email || "";
  const city = user?.destinationCity || "Dublin";
  const visa = user?.visaType || "Visa pending";
  const since = user?.arrivalDate
    ? new Date(user.arrivalDate).toLocaleDateString("en-IE", { month: "short", year: "numeric" })
    : "";

  const badges = [
    user?.nationality ? `🌍 ${user.nationality}` : null,
    user?.profession ? `💼 ${user.profession}` : null,
    city ? `📍 ${city}` : null,
  ].filter(Boolean);

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file || file.size > 2 * 1024 * 1024) return;
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, profileImage: reader.result }));
    reader.readAsDataURL(file);
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const res = await fetch(`${API}/api/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Could not save profile");
      await refreshUser();
      setMessage("Profile saved");
      setShowEdit(false);
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage(err.message || "Save failed");
    }
  };

  const handleSignOut = () => {
    if (window.confirm("Sign out of EXPal?")) logout();
  };

  const enableNotifications = async () => {
    setMessage("");
    const result = await setupPushNotifications(token);
    if (result.granted && result.registered) {
      setMessage("Push notifications enabled");
    } else if (result.reason === "denied") {
      setMessage("Allow notifications in your phone Settings → Apps → EXPal → Notifications");
    } else if (result.reason === "web") {
      setMessage("Push notifications work in the Android app");
    } else if (result.reason === "token_failed" || result.reason === "no_token") {
      setMessage("Could not connect to Firebase. Check your internet and try again.");
    } else if (result.reason === "register_failed") {
      setMessage(result.detail ? `Server: ${result.detail}` : "Could not register device. Try again.");
    } else {
      setMessage("Could not enable notifications. Try again after signing in.");
    }
    setTimeout(() => setMessage(""), 5000);
  };

  const cycleTheme = () => {
    const order = ["auto", "light", "dark"];
    const next = order[(order.indexOf(themePref) + 1) % order.length];
    setThemePref(next);
    setThemePreference(next);
    const resolved = resolveTheme(next);
    setMessage(
      next === "auto"
        ? `Theme: Auto (${resolved} now — dark at night)`
        : `Theme: ${next}`
    );
    setTimeout(() => setMessage(""), 3000);
  };

  const sendContact = async (e) => {
    e.preventDefault();
    setContactBusy(true);
    setContactStatus("");
    try {
      const res = await fetch(`${API}/api/support/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: contactMsg }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not send message");
      setContactStatus("Message sent to the founder. Thanks!");
      setContactMsg("");
      setTimeout(() => {
        setShowContact(false);
        setContactStatus("");
      }, 1800);
    } catch (err) {
      setContactStatus(err.message || "Send failed");
    } finally {
      setContactBusy(false);
    }
  };

  const themeLabel =
    themePref === "auto"
      ? `Auto · ${resolveTheme("auto")}`
      : themePref === "dark"
        ? "Dark"
        : "Light";

  return (
    <MobileScreen
      chromeExtra={
        <div className="mob-profile-header" style={{ borderRadius: 0 }}>
          <ProfileAvatar
            src={showEdit ? form.profileImage : user?.profileImage}
            name={name}
            userId={user?.id}
            className="mob-profile-avatar"
          />
          <h1 className="mob-profile-name">{name}</h1>
          <p className="mob-profile-email">{email}</p>
          <p className="mob-profile-sub">
            {city} · {visa}{since ? ` · Since ${since}` : ""}
          </p>
          <div className="mob-profile-badges">
            {badges.map((b) => (
              <span key={b} className="mob-profile-badge">{b}</span>
            ))}
          </div>
        </div>
      }
    >
      <div className="mob-profile-stats">
        <div className="mob-profile-stat">
          <div className="mob-stat-val">{daysSince(user?.arrivalDate)}</div>
          <div className="mob-stat-label">Days here</div>
        </div>
        <div className="mob-profile-stat">
          <div className="mob-stat-val">—</div>
          <div className="mob-stat-label">Events joined</div>
        </div>
        <div className="mob-profile-stat">
          <div className="mob-stat-val">—</div>
          <div className="mob-stat-label">Connections</div>
        </div>
      </div>

      {showEdit && (
        <div className="mob-settings-section">
          <p className="mob-settings-label">Edit profile</p>
          <form onSubmit={saveProfile} className="mob-settings-card" style={{ padding: 12 }}>
            <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ marginBottom: 8, fontSize: 12 }} />
            <input className="mob-search-input" placeholder="Nationality" value={form.nationality} onChange={(e) => setForm({ ...form, nationality: e.target.value })} style={{ marginBottom: 8 }} />
            <input className="mob-search-input" placeholder="Current city" value={form.currentCity} onChange={(e) => setForm({ ...form, currentCity: e.target.value })} style={{ marginBottom: 8 }} />
            <input className="mob-search-input" placeholder="Company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} style={{ marginBottom: 8 }} />
            <input className="mob-search-input" placeholder="Industry" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} style={{ marginBottom: 8 }} />
            <textarea className="mob-search-input" placeholder="Bio" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} style={{ minHeight: 72, marginBottom: 8 }} />
            <div className="mob-ref-actions">
              <button type="submit" className="mob-btn-primary">Save</button>
              <button type="button" className="mob-btn-secondary" onClick={() => setShowEdit(false)}>Cancel</button>
            </div>
            {message && <p style={{ fontSize: 12, marginTop: 8, color: message.includes("saved") ? "#0f6e56" : "#a32d2d" }}>{message}</p>}
          </form>
        </div>
      )}

      {SETTINGS.map((section) => (
        <div key={section.title} className="mob-settings-section">
          <p className="mob-settings-label">{section.title}</p>
          <div className="mob-settings-card">
            {section.items.map((item) => {
              if (item.action === "edit") {
                return (
                  <button
                    key={item.label}
                    type="button"
                    className="mob-settings-item"
                    onClick={() => setShowEdit(!showEdit)}
                  >
                    <span className="mob-settings-icon" style={{ background: item.bg }}>{item.emoji}</span>
                    <span>{item.label}</span>
                    <span className="mob-settings-arrow">›</span>
                  </button>
                );
              }
              if (item.action === "notifications") {
                return (
                  <button
                    key={item.label}
                    type="button"
                    className="mob-settings-item"
                    onClick={enableNotifications}
                  >
                    <span className="mob-settings-icon" style={{ background: item.bg }}>{item.emoji}</span>
                    <span>{item.label}</span>
                    <span className="mob-settings-arrow">›</span>
                  </button>
                );
              }
              if (item.action === "theme") {
                return (
                  <button
                    key={item.label}
                    type="button"
                    className="mob-settings-item"
                    onClick={cycleTheme}
                  >
                    <span className="mob-settings-icon" style={{ background: item.bg }}>{item.emoji}</span>
                    <span>{item.label}</span>
                    <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--mob-text-muted)", marginRight: 6 }}>
                      {themeLabel}
                    </span>
                    <span className="mob-settings-arrow">›</span>
                  </button>
                );
              }
              if (item.action === "contact") {
                return (
                  <button
                    key={item.label}
                    type="button"
                    className="mob-settings-item"
                    onClick={() => {
                      setShowContact(true);
                      setContactStatus("");
                    }}
                  >
                    <span className="mob-settings-icon" style={{ background: item.bg }}>{item.emoji}</span>
                    <span>{item.label}</span>
                    <span className="mob-settings-arrow">›</span>
                  </button>
                );
              }
              if (item.action === "walkthrough") {
                return (
                  <button
                    key={item.label}
                    type="button"
                    className="mob-settings-item"
                    onClick={() => {
                      restartWalkthrough();
                      window.location.href = "/";
                    }}
                  >
                    <span className="mob-settings-icon" style={{ background: item.bg }}>{item.emoji}</span>
                    <span>{item.label}</span>
                    <span className="mob-settings-arrow">›</span>
                  </button>
                );
              }
              if (item.to) {
                return (
                  <Link key={item.label} to={item.to} className="mob-settings-item">
                    <span className="mob-settings-icon" style={{ background: item.bg }}>{item.emoji}</span>
                    <span>{item.label}</span>
                    <span className="mob-settings-arrow">›</span>
                  </Link>
                );
              }
              return null;
            })}
          </div>
        </div>
      ))}

      {user?.isAdmin && token && <MobileAdminSection token={token} />}

      {message && !showEdit && (
        <p style={{ fontSize: 12, margin: "0 16px 8px", color: message.includes("enabled") || message.includes("Theme") || message.includes("saved") ? "#0f6e56" : "#5c5c5c" }}>
          {message}
        </p>
      )}

      <button type="button" className="mob-sign-out" onClick={handleSignOut}>
        Sign out
      </button>
      <p className="mob-version">EXPal · Built with ♥ for expats</p>

      <MobilePostSheet open={showContact} onClose={() => setShowContact(false)} title="Contact founder">
        <form onSubmit={sendContact}>
          <p style={{ fontSize: 13, color: "var(--mob-text-secondary)", margin: "0 0 12px", lineHeight: 1.45 }}>
            Your message is delivered with your name ({name}) and email so the founder knows who wrote.
          </p>
          <textarea
            className="mob-search-input"
            placeholder="Write your message…"
            value={contactMsg}
            onChange={(e) => setContactMsg(e.target.value)}
            required
            minLength={5}
            style={{ minHeight: 120, marginBottom: 12 }}
          />
          <button type="submit" className="mob-btn-primary" style={{ width: "100%" }} disabled={contactBusy}>
            {contactBusy ? "Sending…" : "Send message"}
          </button>
          {contactStatus && (
            <p
              style={{
                fontSize: 12,
                marginTop: 10,
                color: contactStatus.includes("sent") ? "#0f6e56" : "#a32d2d",
              }}
            >
              {contactStatus}
            </p>
          )}
        </form>
      </MobilePostSheet>
    </MobileScreen>
  );
}
