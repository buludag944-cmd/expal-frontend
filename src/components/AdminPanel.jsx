import React, { useState } from "react";
import { getApiBaseUrl } from "../apiConfig";
import Badge from "./ui/Badge";
import Button from "./ui/Button";
import Input from "./ui/Input";
import { Card, CardContent } from "./ui/Card";

const API = getApiBaseUrl();

/** Admin tools — server enforces 403; shown only when user.isAdmin from profile/JWT. */
export default function AdminPanel({ token }) {
  const [promoteEmail, setPromoteEmail] = useState("");
  const [promoteMsg, setPromoteMsg] = useState("");
  const [purgeMsg, setPurgeMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmPurge, setConfirmPurge] = useState(false);

  async function handlePromote(e) {
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
      if (res.ok) {
        setPromoteMsg(data.message || "Promoted to admin.");
      } else {
        setPromoteMsg(data.error || `Failed (${res.status})`);
      }
    } catch {
      setPromoteMsg("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  async function handlePurge() {
    setPurgeMsg("");
    setBusy(true);
    try {
      const res = await fetch(`${API}/api/admin/users`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setPurgeMsg(
          `Deleted ${data.deletedUsers ?? 0} non-admin user(s).` +
            (data.counts ? ` Content: ${JSON.stringify(data.counts)}` : "")
        );
        setConfirmPurge(false);
      } else {
        setPurgeMsg(data.error || `Failed (${res.status})`);
      }
    } catch {
      setPurgeMsg("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="border-danger/30">
      <CardContent className="space-y-4 pt-5">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Admin</h3>
          <Badge variant="warn">Privileged</Badge>
        </div>

        <form onSubmit={handlePromote} className="space-y-3">
          <p className="text-sm text-muted">Promote a user to admin</p>
          <Input
            type="email"
            placeholder="email@example.com"
            value={promoteEmail}
            onChange={(e) => setPromoteEmail(e.target.value)}
            required
          />
          <Button type="submit" variant="secondary" size="sm" loading={busy} disabled={busy}>
            Promote
          </Button>
          {promoteMsg && (
            <Badge variant={promoteMsg.includes("Promoted") ? "success" : "danger"}>
              {promoteMsg}
            </Badge>
          )}
        </form>

        <div className="border-t border-border pt-4 space-y-3">
          <p className="text-sm text-muted">
            Delete all non-admin users and their content (housing, events, messages, comments, etc.).
          </p>
          {!confirmPurge ? (
            <Button variant="danger" size="sm" onClick={() => setConfirmPurge(true)} disabled={busy}>
              Delete all non-admin users…
            </Button>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button variant="danger" size="sm" loading={busy} disabled={busy} onClick={handlePurge}>
                Confirm purge
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setConfirmPurge(false)} disabled={busy}>
                Cancel
              </Button>
            </div>
          )}
          {purgeMsg && (
            <Badge variant={purgeMsg.startsWith("Deleted") ? "success" : "danger"}>{purgeMsg}</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
