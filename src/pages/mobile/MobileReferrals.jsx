import React, { useState } from "react";
import CommentsSection from "../../components/CommentsSection";
import { getApiBaseUrl } from "../../apiConfig";
import ProfileAvatar from "../../components/ProfileAvatar";
import { MobileScreen, MobileSectionTitle, MobileBadge, MobileFab, MobilePostSheet } from "../../components/mobile/MobileShared";

const API = getApiBaseUrl();

export default function MobileReferrals({
  referrals,
  user,
  token,
  form,
  setForm,
  handleSubmit,
  editingId,
  resetForm,
  error,
  startEditReferral,
  handleDeleteReferral,
  canModifyReferral,
  showForm,
  setShowForm,
}) {
  const [search, setSearch] = useState("");

  const filtered = referrals.filter((r) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      (r.name || "").toLowerCase().includes(q) ||
      (r.title || "").toLowerCase().includes(q) ||
      (r.company || "").toLowerCase().includes(q) ||
      (r.profession || "").toLowerCase().includes(q) ||
      (r.message || r.description || "").toLowerCase().includes(q)
    );
  });

  const toggleForm = () => {
    if (showForm) {
      resetForm();
      setShowForm(false);
    } else {
      setShowForm(true);
    }
  };

  return (
    <div className="mob-page-stack">
      <MobileScreen
        title="Referrals"
        count={filtered.length}
        action={
          <button
            type="button"
            className="mob-back-btn"
            style={{ background: "none", fontSize: 22 }}
            onClick={() => (showForm ? toggleForm() : setShowForm(true))}
            aria-label="Post referral request"
          >
            {showForm ? "✕" : "＋"}
          </button>
        }
        chromeExtra={
          <div className="mob-search-wrap">
            <input
              className="mob-search-input"
              placeholder="Search posts, roles, companies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        }
      >
        <div className="mob-body" style={{ paddingTop: 0 }}>
          {error && <p style={{ color: "#a32d2d", fontSize: 12 }}>{error}</p>}

          <div className="mob-ref-banner">
            🤝 Post a request and let the community respond in the comments — referrals work best when everyone can see and reply.
          </div>

          <MobileSectionTitle>Community posts</MobileSectionTitle>

          {filtered.length === 0 && (
            <p style={{ fontSize: 12, color: "var(--mob-text-muted)" }}>
              No posts yet — tap ＋ to publish your first referral request.
            </p>
          )}

          {filtered.map((r) => {
            const author = r.User
              ? `${r.User.firstName || ""} ${r.User.lastName || ""}`.trim() || "Member"
              : "Member";
            const headline = r.title || r.name || "Referral request";
            const body = r.description || r.message || "";
            return (
              <div key={r.id} className="mob-ref-card mob-card">
                <div className="mob-ref-top">
                  <ProfileAvatar src={r.User?.profileImage} name={author} userId={r.User?.id || r.id} className="mob-ref-avatar" />
                  <div style={{ flex: 1 }}>
                    <MobileBadge label="Referral" color="purple" />
                    <p className="mob-ref-name" style={{ marginTop: 6 }}>{headline}</p>
                    <p className="mob-ref-role">
                      {[r.profession, r.company].filter(Boolean).join(" · ") || "Open request"}
                    </p>
                    <p style={{ fontSize: 10, color: "var(--mob-text-muted)", margin: "4px 0 0" }}>
                      Posted by {author}
                    </p>
                  </div>
                </div>
                {body && (
                  <p style={{ fontSize: 12, color: "var(--mob-text-secondary)", margin: "8px 0", lineHeight: 1.45 }}>
                    {body}
                  </p>
                )}
                {canModifyReferral(user, r) && (
                  <div className="mob-ref-actions" style={{ marginBottom: 8 }}>
                    <button type="button" className="mob-btn-secondary" onClick={() => { startEditReferral(r); setShowForm(true); }}>
                      Edit
                    </button>
                    <button type="button" className="mob-btn-secondary" onClick={() => handleDeleteReferral(r.id)}>
                      Delete
                    </button>
                  </div>
                )}
                <CommentsSection
                  targetType="referral"
                  targetId={r.id}
                  apiBase={API}
                  user={user}
                  token={token}
                  mobile
                />
              </div>
            );
          })}
        </div>
      </MobileScreen>

      <MobileFab onClick={() => setShowForm(true)} label="Post referral request" visible={!showForm} />

      <MobilePostSheet
        open={showForm}
        onClose={toggleForm}
        title={editingId ? "Edit your post" : "Post a referral request"}
      >
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <p style={{ fontSize: 12, color: "var(--mob-text-muted)", margin: 0, lineHeight: 1.45 }}>
            Publish to the community so members can comment and help.
          </p>
          <input className="mob-search-input" placeholder="Your name or headline" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input className="mob-search-input" placeholder="Role you're looking for" value={form.profession} onChange={(e) => setForm({ ...form, profession: e.target.value })} required />
          <input className="mob-search-input" placeholder="Company or industry (optional)" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
          <textarea className="mob-search-input" placeholder="What help are you looking for?" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required />
          <button type="submit" className="mob-btn-primary" style={{ height: 44 }}>
            {editingId != null ? "Save changes" : "Publish post"}
          </button>
        </form>
      </MobilePostSheet>
    </div>
  );
}
