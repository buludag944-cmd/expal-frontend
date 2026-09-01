import React, { useState } from "react";
import { getApiBaseUrl } from "../../apiConfig";

const API = getApiBaseUrl();

/** Admin tools for mobile profile — same API as web AdminPanel. */
export default function MobileAdminSection({ token }) {
  const [promoteEmail, setPromoteEmail] = useState("");
  const [promoteMsg, setPromoteMsg] = useState("");
  const [purgeMsg, setPurgeMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmPurge, setConfirmPurge] = useState(false);

  const handlePromote = async (e) => {
    e.preventDefault();
    setPromoteMsg("");
    setBusy(true);
    try {
      const res = await fetch(`${API}/api/admin/promote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: promoteEmail.trim().toLowerCase() }),
      });
      const data = await res.json().catch(() => ({}));
      setPromoteMsg(res.ok ? data.message || "Promoted to admin." : data.error || `Failed (${res.status})`);
    } catch {
      setPromoteMsg("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  };

  const handlePurge = async () => {
    setPurgeMsg("");
    setBusy(true);
    try {
      const res = await fetch(`${API}/api/admin/users`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setPurgeMsg(`Deleted ${data.deletedUsers ?? 0} non-admin user(s).`);
        setConfirmPurge(false);
      } else {
        setPurgeMsg(data.error || `Failed (${res.status})`);
      }
    } catch {
      setPurgeMsg("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mob-settings-section">
      <p className="mob-settings-label">Admin</p>
      <div className="mob-settings-card" style={{ padding: 14 }}>
        <p style={{ fontSize: 11, color: "var(--mob-text-muted)", margin: "0 0 12px" }}>Privileged tools</p>

        <form onSubmit={handlePromote} style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>Promote user to admin</p>
          <input
            className="mob-search-input"
            type="email"
            placeholder="email@example.com"
            value={promoteEmail}
            onChange={(e) => setPromoteEmail(e.target.value)}
            required
          />
          <button type="submit" className="mob-btn-secondary" disabled={busy}>
            {busy ? "Working…" : "Promote"}
          </button>
          {promoteMsg && (
            <p style={{ fontSize: 12, margin: 0, color: promoteMsg.includes("Promoted") ? "#0f6e56" : "#a32d2d" }}>
              {promoteMsg}
            </p>
          )}
        </form>

        <div style={{ borderTop: "0.5px solid var(--mob-border)", paddingTop: 12 }}>
          <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 8px" }}>Purge non-admin users</p>
          <p style={{ fontSize: 12, color: "var(--mob-text-muted)", margin: "0 0 10px", lineHeight: 1.45 }}>
            Deletes all non-admin accounts and their content.
          </p>
          {!confirmPurge ? (
            <button type="button" className="mob-btn-secondary mob-btn-danger" onClick={() => setConfirmPurge(true)} disabled={busy}>
              Delete all non-admin users…
            </button>
          ) : (
            <div className="mob-content-actions">
              <button type="button" className="mob-btn-secondary mob-btn-danger" onClick={handlePurge} disabled={busy}>
                Confirm purge
              </button>
              <button type="button" className="mob-btn-secondary" onClick={() => setConfirmPurge(false)} disabled={busy}>
                Cancel
              </button>
            </div>
          )}
          {purgeMsg && (
            <p style={{ fontSize: 12, marginTop: 10, color: purgeMsg.startsWith("Deleted") ? "#0f6e56" : "#a32d2d" }}>
              {purgeMsg}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
