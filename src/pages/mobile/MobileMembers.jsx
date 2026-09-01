import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../AuthContext";
import { getApiBaseUrl } from "../../apiConfig";
import ProfileAvatar from "../../components/ProfileAvatar";
import { MobileScreen, MobileSectionTitle } from "../../components/mobile/MobileShared";

const API = getApiBaseUrl();

function displayName(profile) {
  return `${profile.firstName || ""} ${profile.lastName || ""}`.trim() || "Member";
}

export default function MobileMembers({ backTo = "/community" }) {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setProfiles([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const res = await fetch(`${API}/api/users/profiles`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (res.status === 401) {
          logout();
          setProfiles([]);
          return;
        }
        if (!res.ok) {
          setProfiles([]);
          return;
        }
        setProfiles(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!cancelled) console.error(err);
        if (!cancelled) setProfiles([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, logout]);

  const filtered = profiles.filter((profile) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      displayName(profile).toLowerCase().includes(q) ||
      profile.nationality?.toLowerCase().includes(q) ||
      profile.currentCity?.toLowerCase().includes(q) ||
      profile.industry?.toLowerCase().includes(q) ||
      profile.company?.toLowerCase().includes(q) ||
      profile.bio?.toLowerCase().includes(q)
    );
  });

  const openProfile = (profile) => {
    if (!profile?.id) return;
    navigate(`/members/${profile.id}`, { state: { profile } });
  };

  return (
    <MobileScreen
      title="Members"
      backTo={backTo}
      count={filtered.length}
      chromeExtra={
        <div className="mob-search-wrap">
          <input
            className="mob-search-input"
            placeholder="Search by name, city, nationality, industry..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      }
    >
      <div className="mob-body" style={{ paddingTop: 16 }}>
        <p style={{ fontSize: 12, color: "var(--mob-text-muted)", margin: "0 0 12px", lineHeight: 1.45 }}>
          Tap a member to view their profile and send a message.
        </p>

        {loading && <p style={{ fontSize: 12, color: "var(--mob-text-muted)" }}>Loading members…</p>}

        {!loading && filtered.length === 0 && (
          <p style={{ fontSize: 12, color: "var(--mob-text-muted)" }}>
            No members found yet. As people join on web or mobile, they appear here.
          </p>
        )}

        <MobileSectionTitle>Expat community</MobileSectionTitle>

        {filtered.map((profile) => {
          const name = displayName(profile);
          const isSelf = Number(profile.id) === Number(user?.id);
          return (
            <button
              key={profile.id}
              type="button"
              className="mob-member-card mob-card w-full text-left"
              onClick={() => openProfile(profile)}
              disabled={isSelf}
              style={isSelf ? { opacity: 0.75 } : undefined}
            >
              <div className="mob-ref-top">
                <ProfileAvatar
                  src={profile.profileImage}
                  name={name}
                  userId={profile.id}
                  className="mob-member-avatar"
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p className="mob-ref-name">{name}{isSelf ? " (you)" : ""}</p>
                  <p className="mob-ref-role">
                    {[profile.nationality, profile.currentCity].filter(Boolean).join(" · ") || "Community member"}
                  </p>
                  {(profile.industry || profile.company) && (
                    <p style={{ fontSize: 11, color: "var(--mob-text-muted)", margin: "4px 0 0" }}>
                      💼 {[profile.industry, profile.company].filter(Boolean).join(" at ")}
                    </p>
                  )}
                </div>
                {!isSelf && <span className="mob-member-msg">›</span>}
              </div>
              {profile.bio && (
                <p style={{ fontSize: 12, color: "var(--mob-text-secondary)", margin: "8px 0 0", lineHeight: 1.45 }}>
                  {profile.bio.length > 140 ? `${profile.bio.slice(0, 140)}…` : profile.bio}
                </p>
              )}
              {profile.interests?.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                  {profile.interests.slice(0, 4).map((interest) => (
                    <span key={interest} className="mob-prop-tag">
                      {interest}
                    </span>
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </MobileScreen>
  );
}
