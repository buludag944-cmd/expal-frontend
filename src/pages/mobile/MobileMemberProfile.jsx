import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../AuthContext";
import { getApiBaseUrl } from "../../apiConfig";
import ProfileAvatar from "../../components/ProfileAvatar";
import { MobileScreen, MobileBadge } from "../../components/mobile/MobileShared";

const API = getApiBaseUrl();

function displayName(profile) {
  return `${profile?.firstName || ""} ${profile?.lastName || ""}`.trim() || "Member";
}

export default function MobileMemberProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { token, user } = useAuth();
  const [profile, setProfile] = useState(location.state?.profile || null);
  const [loading, setLoading] = useState(!location.state?.profile);

  useEffect(() => {
    if (!token || !userId) {
      setLoading(false);
      return;
    }

    if (location.state?.profile && String(location.state.profile.id) === String(userId)) {
      setProfile(location.state.profile);
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
        const data = await res.json().catch(() => []);
        if (cancelled) return;
        const found = (Array.isArray(data) ? data : []).find((p) => String(p.id) === String(userId));
        setProfile(found || null);
      } catch {
        if (!cancelled) setProfile(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, userId, location.state?.profile]);

  const isSelf = Number(profile?.id) === Number(user?.id);
  const name = displayName(profile);

  const sendMessage = () => {
    if (!profile?.id || isSelf) return;
    navigate(`/messages?user=${profile.id}`, {
      state: { openChatWith: { id: profile.id, displayName: name } },
    });
  };

  if (loading) {
    return (
      <MobileScreen title="Member profile" backTo="/users">
        <div className="mob-body" style={{ paddingTop: 16 }}>
          <p style={{ fontSize: 12, color: "var(--mob-text-muted)" }}>Loading profile…</p>
        </div>
      </MobileScreen>
    );
  }

  if (!profile) {
    return (
      <MobileScreen title="Member profile" backTo="/users">
        <div className="mob-body" style={{ paddingTop: 16 }}>
          <p style={{ fontSize: 12, color: "var(--mob-text-muted)" }}>Member not found.</p>
        </div>
      </MobileScreen>
    );
  }

  return (
    <MobileScreen title="Member profile" backTo="/users">
      <div className="mob-body" style={{ paddingTop: 16 }}>
        <div className="mob-member-profile-card mob-card">
          <div className="mob-member-profile-top">
            <ProfileAvatar
              src={profile.profileImage}
              name={name}
              userId={profile.id}
              className="mob-member-profile-avatar"
            />
            <div style={{ flex: 1 }}>
              <h2 className="mob-member-profile-name">{name}{isSelf ? " (you)" : ""}</h2>
              <p className="mob-ref-role">
                {[profile.nationality, profile.currentCity].filter(Boolean).join(" · ") || "Community member"}
              </p>
            </div>
          </div>

          {(profile.industry || profile.company) && (
            <p className="mob-member-profile-line">💼 {[profile.industry, profile.company].filter(Boolean).join(" at ")}</p>
          )}

          {profile.bio && (
            <div className="mob-member-profile-bio">
              <p className="mob-section-title">About</p>
              <p>{profile.bio}</p>
            </div>
          )}

          {profile.interests?.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <p className="mob-section-title">Interests</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {profile.interests.map((interest) => (
                  <MobileBadge key={interest} label={interest} color="teal" />
                ))}
              </div>
            </div>
          )}

          {!isSelf && (
            <button type="button" className="mob-btn-primary mob-member-profile-msg" onClick={sendMessage}>
              💬 Send message
            </button>
          )}
        </div>
      </div>
    </MobileScreen>
  );
}
