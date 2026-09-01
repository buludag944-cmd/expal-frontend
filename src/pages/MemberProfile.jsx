import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { getApiBaseUrl } from "../apiConfig";
import { isNativeApp } from "../lib/platform";
import MobileMemberProfile from "./mobile/MobileMemberProfile";
import { Card, CardContent } from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import Avatar from "../components/ui/Avatar";

const API = getApiBaseUrl();

function fullName(profile) {
  return `${profile?.firstName || ""} ${profile?.lastName || ""}`.trim() || "Member";
}

export default function MemberProfile() {
  if (isNativeApp()) {
    return <MobileMemberProfile />;
  }
  return <WebMemberProfile />;
}

function WebMemberProfile() {
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
        const found = (Array.isArray(data) ? data : []).find(
          (p) => String(p.id) === String(userId)
        );
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
  const name = fullName(profile);

  const sendMessage = () => {
    if (!profile?.id || isSelf) return;
    navigate(`/messages?user=${profile.id}`, {
      state: { openChatWith: { id: profile.id, displayName: name } },
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Link to="/users" className="text-sm text-primary hover:underline">
          ← Back to Members
        </Link>
        <p className="text-muted">Loading profile…</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="space-y-6">
        <Link to="/users" className="text-sm text-primary hover:underline">
          ← Back to Members
        </Link>
        <Badge variant="danger">Member not found.</Badge>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <Link
        to="/users"
        className="text-sm font-medium text-primary hover:underline inline-flex min-h-[44px] items-center"
      >
        ← Back to Members
      </Link>

      <Card>
        <CardContent className="pt-6 space-y-5">
          <div className="flex items-center gap-4">
            <Avatar src={profile.profileImage} name={name} size="lg" />
            <div className="min-w-0">
              <h1 className="page-title mb-1">
                {name}
                {isSelf ? " (you)" : ""}
              </h1>
              <p className="text-sm text-muted">
                {[profile.nationality, profile.currentCity].filter(Boolean).join(" · ") ||
                  "Community member"}
              </p>
            </div>
          </div>

          {(profile.industry || profile.company) && (
            <p className="text-sm">
              💼 {[profile.industry, profile.company].filter(Boolean).join(" at ")}
            </p>
          )}

          {profile.bio && (
            <div>
              <h2 className="font-semibold text-sm text-muted mb-1">About</h2>
              <p className="text-sm whitespace-pre-wrap">{profile.bio}</p>
            </div>
          )}

          {profile.interests?.length > 0 && (
            <div>
              <h2 className="font-semibold text-sm text-muted mb-2">Interests</h2>
              <div className="flex flex-wrap gap-2">
                {profile.interests.map((interest) => (
                  <Badge key={interest} variant="secondary">
                    {interest}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {!isSelf && (
            <Button type="button" onClick={sendMessage}>
              💬 Send message
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
