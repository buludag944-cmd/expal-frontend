import React, { useEffect, useState } from "react";
import { useAuth } from "../AuthContext";
import CommentsSection from "../components/CommentsSection";
import { getApiBaseUrl } from "../apiConfig";
import Avatar from "../components/ui/Avatar";
import { Share2 } from "lucide-react";
import Button from "../components/ui/Button";
import Input, { Textarea } from "../components/ui/Input";
import { Card, CardContent } from "../components/ui/Card";

const API = getApiBaseUrl();

export default function Referrals() {
  const { token, user } = useAuth();
  const [referrals, setReferrals] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    profession: "",
    company: "",
    message: "",
  });

  useEffect(() => {
    fetch(`${API}/api/referrals`)
      .then((res) => res.json())
      .then(setReferrals)
      .catch(console.error);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const isEditing = editingId !== null;
    const url = isEditing ? `${API}/api/referrals/${editingId}` : `${API}/api/referrals`;
    fetch(url, {
      method: isEditing ? "PUT" : "POST",
      headers: isEditing
        ? { "Content-Type": "application/json" }
        : {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
      body: JSON.stringify(form),
    })
      .then((res) => res.json())
      .then((saved) => {
        if (isEditing) {
          setReferrals((prev) => prev.map((r) => (r.id === saved.id ? saved : r)));
        } else {
          setReferrals((prev) => [...prev, saved]);
        }
        setEditingId(null);
      })
      .catch(console.error);

    setForm({ name: "", profession: "", company: "", message: "" });
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
    fetch(`${API}/api/referrals/${id}`, { method: "DELETE" })
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to delete referral ${id}`);
      })
      .then(() => setReferrals((prev) => prev.filter((r) => r.id !== id)))
      .catch(console.error);
    if (editingId === id) {
      setEditingId(null);
      setForm({ name: "", profession: "", company: "", message: "" });
    }
  };

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

      <Card>
        <CardContent className="space-y-4 pt-6">
          <h2 className="text-lg font-semibold">Ask for a referral</h2>
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
              placeholder="Company"
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
              required
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
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setEditingId(null);
                    setForm({ name: "", profession: "", company: "", message: "" });
                  }}
                >
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
                {user && String(r.userId) === String(user.id) && (
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
