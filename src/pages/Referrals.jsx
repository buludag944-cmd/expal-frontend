import React, { useEffect, useState } from "react";
import { useAuth } from "../AuthContext";
import CommentsSection from "../components/CommentsSection";
import { getApiBaseUrl } from "../apiConfig";
import { isNativeApp } from "../lib/platform";
import MobileReferrals from "./mobile/MobileReferrals";
import Avatar from "../components/ui/Avatar";
import { Share2 } from "lucide-react";
import Button from "../components/ui/Button";
import Input, { Textarea } from "../components/ui/Input";
import { Card, CardContent } from "../components/ui/Card";
import Badge from "../components/ui/Badge";

const API = getApiBaseUrl();

function canModifyReferral(user, referral) {
  if (!user) return false;
  const ownerId = referral.userId ?? referral.User?.id;
  return Number(ownerId) === Number(user.id) || !!user.isAdmin;
}

export default function Referrals() {
  const { token, user } = useAuth();
  const [referrals, setReferrals] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    profession: "",
    company: "",
    message: "",
  });
  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  const loadReferrals = () => {
    fetch(`${API}/api/referrals`)
      .then((res) => res.json())
      .then(setReferrals)
      .catch(console.error);
  };

  useEffect(() => {
    loadReferrals();
  }, []);

  const resetForm = () => {
    setForm({ name: "", profession: "", company: "", message: "" });
    setEditingId(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    if (!token) {
      setError("You must be logged in.");
      return;
    }
    const isEditing = editingId !== null;
    const url = isEditing ? `${API}/api/referrals/${editingId}` : `${API}/api/referrals`;
    fetch(url, {
      method: isEditing ? "PUT" : "POST",
      headers: authHeaders,
      body: JSON.stringify({
        ...form,
        company: (form.company || "").trim() || "Open",
      }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Save failed");
        return data;
      })
      .then(() => {
        resetForm();
        setShowForm(false);
        loadReferrals();
      })
      .catch((err) => setError(err.message));
  };

  const startEditReferral = (r) => {
    setEditingId(r.id);
    setForm({
      name: r.name || "",
      profession: r.profession || "",
      company: r.company || "",
      message: r.message || "",
    });
  };

  const handleDeleteReferral = (id) => {
    if (!window.confirm("Delete this referral?")) return;
    fetch(`${API}/api/referrals/${id}`, { method: "DELETE", headers: authHeaders })
      .then((res) => {
        if (!res.ok && res.status !== 204) {
          return res.json().then((d) => {
            throw new Error(d.error || "Delete failed");
          });
        }
      })
      .then(() => {
        setReferrals((prev) => prev.filter((r) => r.id !== id));
        if (editingId === id) resetForm();
      })
      .catch((err) => setError(err.message));
  };

  const native = isNativeApp();

  if (native) {
    return (
      <MobileReferrals
        referrals={referrals}
        user={user}
        token={token}
        form={form}
        setForm={setForm}
        handleSubmit={handleSubmit}
        editingId={editingId}
        resetForm={resetForm}
        error={error}
        startEditReferral={startEditReferral}
        handleDeleteReferral={handleDeleteReferral}
        canModifyReferral={canModifyReferral}
        showForm={showForm}
        setShowForm={setShowForm}
      />
    );
  }

  return (
    <section className="space-y-8">
      <header>
        <div className="flex items-start gap-3 mb-2">
          <Share2 className="h-8 w-8 icon-rf shrink-0 mt-1" aria-hidden />
          <div>
            <span className="badge-rf">Referrals</span>
            <h1 className="page-title mt-1">Referrals &amp; recommendations</h1>
          </div>
        </div>
        <p className="page-lead">
          Find or share trusted contacts, jobs, and services within the expat community.
        </p>
      </header>

      {error && <Badge variant="danger">{error}</Badge>}

      <Card>
        <CardContent className="space-y-4 pt-6">
          <h2 className="text-lg font-semibold">
            {editingId ? "Edit referral" : "Ask for a referral"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <Input
              placeholder="Profession"
              value={form.profession}
              onChange={(e) => setForm({ ...form, profession: e.target.value })}
              required
            />
            <Input
              placeholder="Company (optional)"
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
            />
            <Textarea
              placeholder="Message"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              required
            />
            <div className="flex flex-wrap gap-2">
              <Button type="submit">
                {editingId !== null ? "Save changes" : "Submit referral request"}
              </Button>
              {editingId !== null && (
                <Button type="button" variant="secondary" onClick={resetForm}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {referrals.map((r) => {
          const author = r.User
            ? `${r.User.firstName || ""} ${r.User.lastName || ""}`.trim() || "Unknown"
            : "Unknown";
          return (
            <Card key={r.id} className="lborder-rf flex flex-col pl-1">
              <CardContent className="flex flex-1 flex-col gap-3 pt-5">
                <span className="badge-rf w-fit">Referral</span>
                <div className="flex items-start justify-between gap-2">
                  <Avatar name={author} size="sm" />
                  <span className="badge-rf">{r.category || r.profession || "General"}</span>
                </div>
                <h3 className="text-lg font-semibold">{r.title || r.name}</h3>
                <p className="text-sm text-muted line-clamp-4">{r.description || r.message}</p>
                {r.company && (
                  <p className="text-xs text-muted">Company: {r.company}</p>
                )}
                <p className="text-xs text-muted">Posted by {author}</p>
                {canModifyReferral(user, r) && (
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => startEditReferral(r)}>
                      Edit
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => handleDeleteReferral(r.id)}>
                      Delete
                    </Button>
                  </div>
                )}
                <div className="mt-auto border-t border-border pt-4">
                  <CommentsSection
                    targetType="referral"
                    targetId={r.id}
                    apiBase={API}
                    user={user}
                    token={token}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
