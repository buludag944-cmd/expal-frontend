import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useNavigate,
} from "react-router-dom";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ResendVerification from "./components/ResendVerification";
import AppShell from "./components/AppShell";
import AppLogo from "./components/AppLogo";
import Home from "./pages/Home";
import { AuthProvider, useAuth } from "./AuthContext";
import Messages from "./pages/Messages";
import ExpatEssentials from "./pages/ExpatEssentials";
import LocalKnowHow from "./pages/LocalKnowHow";
import Referrals from "./pages/Referrals";
import CommentsSection from "./components/CommentsSection";
import Button from "./components/ui/Button";
import Input, { Label, Textarea } from "./components/ui/Input";
import { Card, CardContent } from "./components/ui/Card";
import Badge from "./components/ui/Badge";
import Avatar from "./components/ui/Avatar";
import { Calendar, House as HouseIcon } from "lucide-react";
import AdminPanel from "./components/AdminPanel";
import { getApiBaseUrl } from "./apiConfig";

const API = getApiBaseUrl();

/* ---------- Pages ---------- */

function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [registerNotice, setRegisterNotice] = useState("");
  const [submitBusy, setSubmitBusy] = useState(false);
  const { login, register } = useAuth();
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setRegisterNotice("");
    setSubmitBusy(true);
    let result;
    try {
      result = isLogin
        ? await login(form.email, form.password)
        : await register(form.firstName, form.lastName, form.email, form.password);
    } finally {
      setSubmitBusy(false);
    }

    if (!result.success) {
      setError(result.error);
      return;
    }
    if (result.requiresVerification) {
      setRegisterNotice(result.message || "Check your email to verify your account.");
      setIsLogin(true);
    }
  };
  return (
    <Card className="mx-auto max-w-md">
      <CardContent className="space-y-4 pt-6">
        <div className="flex justify-center">
          <AppLogo size={72} />
        </div>
        <h2 className="page-title text-center">{isLogin ? "Login" : "Sign Up"}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <Input
                placeholder="First name"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                required
              />
              <Input
                placeholder="Last name"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                required
              />
            </>
          )}
          <Input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <Input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          {isLogin && (
            <p className="text-right text-sm">
              <Link
                to="/forgot"
                className="font-medium text-primary underline-offset-2 hover:underline min-h-[44px] inline-flex items-center"
              >
                Forgot your password?
              </Link>
            </p>
          )}
          {error && (
            <div className="space-y-2">
              <Badge variant="danger">{error}</Badge>
              {isLogin && error === "Please verify your email first." && (
                <ResendVerification initialEmail={form.email} inline />
              )}
            </div>
          )}
          {registerNotice && <Badge variant="success">{registerNotice}</Badge>}
          {!isLogin && submitBusy && (
            <p className="text-sm text-muted">Checking backend and submitting…</p>
          )}
          <Button type="submit" className="w-full" loading={submitBusy} disabled={submitBusy}>
            {isLogin ? "Login" : "Sign Up"}
          </Button>
        </form>
        <p className="text-center text-sm text-muted">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setRegisterNotice("");
              setError("");
            }}
            className="font-medium text-primary underline-offset-2 hover:underline min-h-[44px] inline-flex items-center"
          >
            {isLogin ? "Sign Up" : "Login"}
          </button>
        </p>
      </CardContent>
    </Card>
  );
}

function Profile() {
  const { user, token } = useAuth();
  const [form, setForm] = useState({
    nationality: user?.nationality || "",
    currentCity: user?.currentCity || "",
    company: user?.company || "",
    interests: user?.interests || [],
    industry: user?.industry || "",
    bio: user?.bio || "",
    profileImage: user?.profileImage || "",
  });
  const [photoPreview, setPhotoPreview] = useState(user?.profileImage || "");
  const [message, setMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size (limit to 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setMessage("❌ Photo too large. Please choose a file under 2MB.");
      return;
    }

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      // Resize to max 300x300 pixels
      const maxSize = 300;
      let { width, height } = img;

      if (width > height && width > maxSize) {
        height = (height * maxSize) / width;
        width = maxSize;
      } else if (height > maxSize) {
        width = (width * maxSize) / height;
        height = maxSize;
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      const resizedBase64 = canvas.toDataURL("image/jpeg", 0.5); // 50% quality
      console.log("Photo size after resize:", resizedBase64.length);
      setPhotoPreview(resizedBase64);
      setForm({ ...form, profileImage: resizedBase64 });
    };

    img.src = URL.createObjectURL(file);
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Submitting profile:", form);
    console.log("Request size:", JSON.stringify(form).length);

    try {
      const response = await fetch(`${API}/api/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log("Profile updated:", result);
      setMessage("✅ Profile updated successfully!");
      setIsEditing(false);
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Profile update error:", error);
      setMessage(`❌ Error: ${error.message}`);
      setTimeout(() => setMessage(""), 5000);
    }
  };
  const handleInterestAdd = (interest) => {
    if (interest && !form.interests.includes(interest)) {
      setForm({ ...form, interests: [...form.interests, interest] });
    }
  };
  const removeInterest = (index) => {
    setForm({
      ...form,
      interests: form.interests.filter((_, i) => i !== index),
    });
  };
  return (
    <div className="space-y-6 max-w-prose">
      {user?.isAdmin && token && <AdminPanel token={token} />}
      {!isEditing ? (
        <div>
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <h2 className="page-title">Your profile</h2>
            <Button onClick={() => setIsEditing(true)}>Edit profile</Button>
          </div>

          <div style={{ display: "flex", gap: "2rem", alignItems: "start" }}>
            {form.profileImage && (
              <img
                src={form.profileImage}
                alt="Profile"
                style={{
                  width: "120px",
                  height: "120px",
                  borderRadius: "50%",
                  objectFit: "cover",
                }}
              />
            )}
            <div style={{ flex: 1 }}>
              <h3>
                {[user?.firstName, user?.lastName].filter(Boolean).join(" ")}
              </h3>
              {form.nationality && <p>🏴 Nationality: {form.nationality}</p>}
              {form.currentCity && <p>📍 Current City: {form.currentCity}</p>}
              {form.industry && <p>💼 Industry: {form.industry}</p>}
              {form.company && <p>🏢 Company: {form.company}</p>}
              {form.interests && form.interests.length > 0 && (
                <div>
                  <p>
                    <strong>Interests:</strong>
                  </p>
                  <div
                    style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}
                  >
                    {form.interests.map((interest, i) => (
                      <span
                        key={i}
                        style={{
                          background: "#0070f3",
                          color: "white",
                          padding: "0.25rem 0.5rem",
                          borderRadius: "4px",
                          fontSize: "0.8rem",
                        }}
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {form.bio && (
                <div style={{ marginTop: "1rem" }}>
                  <p>
                    <strong>Bio:</strong>
                  </p>
                  <p style={{ color: "#666", lineHeight: 1.5 }}>{form.bio}</p>
                </div>
              )}
            </div>
          </div>

          {message && (
            <p
              style={{
                color: message.startsWith("✅") ? "green" : "red",
                textAlign: "center",
                marginTop: "1.5rem",
              }}
            >
              {message}
            </p>
          )}
        </div>
      ) : (
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1rem",
            }}
          >
            <h2 className="page-title">✏️ Edit Profile</h2>
            <button
              onClick={() => setIsEditing(false)}
              style={{
                background: "#6b7280",
                color: "white",
                border: "none",
                padding: "0.5rem 1rem",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleSubmit} className="form-grid">
            <div
              className="form-group"
              style={{ textAlign: "center", marginBottom: "1.5rem" }}
            >
              <div style={{ marginBottom: "1rem" }}>
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Profile"
                    style={{
                      width: "100px",
                      height: "100px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: "3px solid #0070f3",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "100px",
                      height: "100px",
                      borderRadius: "50%",
                      background: "#f0f0f0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto",
                      border: "2px dashed #ccc",
                    }}
                  >
                    📷
                  </div>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="form-input"
                style={{ maxWidth: "200px" }}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Nationality:</label>
              <input
                className="form-input"
                value={form.nationality}
                onChange={(e) =>
                  setForm({ ...form, nationality: e.target.value })
                }
                placeholder="Turkish, Spanish, German, etc."
              />
            </div>
            <div className="form-group">
              <label className="form-label">Current City:</label>
              <input
                className="form-input"
                value={form.currentCity}
                onChange={(e) =>
                  setForm({ ...form, currentCity: e.target.value })
                }
                placeholder="Berlin, Paris, Amsterdam, etc."
              />
            </div>
            <div className="form-group">
              <label className="form-label">Company:</label>
              <input
                className="form-input"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                placeholder="Your current employer or startup"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Industry:</label>
              <input
                className="form-input"
                value={form.industry}
                onChange={(e) => setForm({ ...form, industry: e.target.value })}
                placeholder="Tech, Finance, Healthcare, Design, etc."
              />
            </div>
            <div className="form-group">
              <label className="form-label">Interests:</label>
              <div
                style={{
                  display: "flex",
                  gap: "0.5rem",
                  flexWrap: "wrap",
                  marginBottom: "0.5rem",
                }}
              >
                {form.interests.map((interest, i) => (
                  <span
                    key={i}
                    style={{
                      background: "#0070f3",
                      color: "white",
                      padding: "0.25rem 0.5rem",
                      borderRadius: "4px",
                      fontSize: "0.8rem",
                      cursor: "pointer",
                    }}
                    onClick={() => removeInterest(i)}
                  >
                    {interest} ✕
                  </span>
                ))}
              </div>
              <input
                className="form-input"
                placeholder="Type interest and press Enter (e.g., hiking, cooking, startups)"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleInterestAdd(e.target.value.trim());
                    e.target.value = "";
                  }
                }}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Bio:</label>
              <textarea
                className="form-input form-textarea"
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                placeholder="Tell other expats about yourself, your experience living abroad, what you're looking for..."
              />
            </div>
            {message && (
              <p
                style={{
                  color: message.startsWith("✅") ? "green" : "red",
                  textAlign: "center",
                }}
              >
                {message}
              </p>
            )}
            <button type="submit" className="btn-primary">
              Update Profile
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function SearchProfiles() {
  const [profiles, setProfiles] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      setProfiles([]);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`${API}/api/users/profiles`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        /* 401 returns { error } — never treat that as profile list or profiles.filter crashes */
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
      } catch (e) {
        if (!cancelled) console.error(e);
        if (!cancelled) setProfiles([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, logout]);
  const filteredProfiles = profiles.filter(
    (profile) =>
      `${profile.firstName || ""} ${profile.lastName || ""}`
        .trim()
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      profile.nationality?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.currentCity?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.industry?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  /* Moved message composer to dedicated /messages page — open thread for this member */
  function goToMessagesWith(profileMember) {
    const displayName =
      `${profileMember.firstName || ""} ${profileMember.lastName || ""}`.trim() || "Member";
    navigate(`/messages?user=${profileMember.id}`, {
      state: { openChatWith: { id: profileMember.id, displayName } },
    });
  }

  return (
    <div className="space-y-6">
      <h2 className="page-title">🔎 Search Expat Profiles</h2>
      <input
        className="form-input"
        placeholder="Search by name, nationality, city, or industry..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ marginBottom: "1rem" }}
      />
      <div style={{ display: "grid", gap: "1rem" }}>
        {filteredProfiles.map((profile) => (
          <div
            key={profile.id}
            className="item-card"
            style={{ display: "flex", gap: "1rem" }}
          >
            {profile.profileImage && (
              <img
                src={profile.profileImage}
                alt={`${profile.firstName || ""} ${profile.lastName || ""}`.trim()}
                style={{
                  width: "60px",
                  height: "60px",
                  borderRadius: "50%",
                  objectFit: "cover",
                }}
              />
            )}
            <div style={{ flex: 1 }}>
              <strong>
                {`${profile.firstName || ""} ${profile.lastName || ""}`.trim()}
              </strong>
              {profile.nationality && <span> 🏴 {profile.nationality}</span>}
              {profile.currentCity && <span> 📍 {profile.currentCity}</span>}
              <br />
              {profile.industry && <small>💼 {profile.industry}</small>}
              {profile.company && <small> at {profile.company}</small>}
              {profile.bio && (
                <p style={{ margin: "0.5rem 0", fontSize: "0.9rem", color: "#666" }}>
                  {profile.bio}
                </p>
              )}
              {profile.interests && profile.interests.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    gap: "0.25rem",
                    flexWrap: "wrap",
                    marginTop: "0.5rem",
                  }}
                >
                  {profile.interests.map((interest, i) => (
                    <span
                      key={i}
                      style={{
                        background: "#e0f2fe",
                        color: "#0369a1",
                        padding: "0.1rem 0.4rem",
                        borderRadius: "3px",
                        fontSize: "0.7rem",
                      }}
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              )}
              {user && profile.id !== user.id ? (
                <div style={{ marginTop: "0.5rem" }}>
                  <button
                    type="button"
                    className="btn-primary"
                    style={{ fontSize: "0.9rem", padding: "0.5rem 1rem" }}
                    onClick={() => goToMessagesWith(profile)}
                  >
                    💬 Message
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Users() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetch(`${API}/api/users`)
      .then((res) => res.json())
      .then(setUsers)
      .catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="page-title">Expat community nearby</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {users.map((u) => (
          <Card key={u.id}>
            <CardContent className="flex items-center gap-3 py-4">
              <Avatar name={`${u.firstName || ""} ${u.lastName || ""}`} />
              <div>
                <p className="font-semibold">
                  {`${u.firstName || ""} ${u.lastName || ""}`.trim() || "Unknown"}
                </p>
                <p className="text-sm text-muted">
                  {u.nationality} {u.city ? `· ${u.city}` : ""}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Housing() {
  const { token, user } = useAuth();
  const [homes, setHomes] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    title: "",
    city: "",
    price: "",
    description: "",
    images: [],
  });

  // Fetch existing listings
  useEffect(() => {
    fetch(`${API}/api/housing`)
      .then((res) => res.json())
      .then(setHomes)
      .catch(console.error);
  }, []);

  // Handle image upload (convert to base64 for demo)
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const imagePromises = files.map((file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(imagePromises).then((base64Images) => {
      setForm({ ...form, images: [...form.images, ...base64Images] });
    });
  };

  // Submit new listing
  const handleSubmit = (e) => {
    e.preventDefault();
    const isEditing = editingId !== null;
    const url = isEditing ? `${API}/api/housing/${editingId}` : `${API}/api/housing`;
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
      .then((newListing) => {
        if (isEditing) {
          setHomes((prev) =>
            prev.map((h) => (h.id === newListing.id ? newListing : h))
          );
        } else {
          setHomes((prev) => [...prev, newListing]);
        }
        setForm({ title: "", city: "", price: "", description: "", images: [] });
        setShowForm(false);
        setEditingId(null);
      })
      .catch(console.error);
  };

  const handleEditHousing = (housing) => {
    setEditingId(housing.id);
    setForm({
      title: housing.title || "",
      city: housing.city || "",
      price: housing.price ?? "",
      description: housing.description || "",
      images: Array.isArray(housing.images) ? housing.images : [],
    });
    setShowForm(true);
  };

  const handleDeleteHousing = (id) => {
    fetch(`${API}/api/housing/${id}`, { method: "DELETE" })
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to delete housing ${id}`);
      })
      .then(() => setHomes((prev) => prev.filter((item) => item.id !== id)))
      .catch(console.error);
    if (editingId === id) {
      setEditingId(null);
      setShowForm(false);
      setForm({ title: "", city: "", price: "", description: "", images: [] });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <HouseIcon className="h-8 w-8 icon-ho shrink-0" aria-hidden />
          <div>
            <span className="badge-ho">Housing</span>
            <h2 className="page-title mt-1">Housing listings</h2>
          </div>
        </div>
        <Button
          onClick={() => {
            if (showForm) {
              setShowForm(false);
              setEditingId(null);
              setForm({ title: "", city: "", price: "", description: "", images: [] });
            } else {
              setShowForm(true);
            }
          }}
        >
          {showForm ? "Cancel" : "+ Add listing"}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="space-y-4 pt-6">
            <h3 className="text-lg font-semibold">{editingId !== null ? "Edit housing" : "Post new housing"}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Cozy 2BR apartment" required />
              </div>
              <div>
                <Label>City</Label>
                <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Berlin, Barcelona…" required />
              </div>
              <div>
                <Label>Price (€/month)</Label>
                <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="850" required />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe the apartment…" />
              </div>
              <div>
                <Label>Photos</Label>
                <Input type="file" multiple accept="image/*" onChange={handleImageUpload} />
                {form.images.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {form.images.map((img, i) => (
                      <img key={i} src={img} alt="" className="h-14 w-14 rounded-lg object-cover" />
                    ))}
                  </div>
                )}
              </div>
              <Button type="submit">{editingId !== null ? "Save changes" : "Post listing"}</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {homes.map((h) => {
          const author = h.User
            ? `${h.User.firstName || ""} ${h.User.lastName || ""}`.trim() || "Unknown"
            : "Unknown";
          return (
            <Card key={h.id} className="lborder-ho flex flex-col overflow-hidden pl-1">
              {h.images?.[0] && (
                <img src={h.images[0]} alt="" className="h-40 w-full object-cover" />
              )}
              <CardContent className="flex flex-1 flex-col gap-3 space-y-0 pt-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Badge variant="info">{h.city}</Badge>
                    <h3 className="mt-2 text-lg font-semibold">{h.title}</h3>
                    <p className="text-sm font-medium text-primary">€{h.price}/mo</p>
                  </div>
                  {user && String(h.userId) === String(user.id) && (
                    <div className="flex gap-2">
                      <Button variant="secondary" size="sm" onClick={() => handleEditHousing(h)}>Edit</Button>
                      <Button variant="danger" size="sm" onClick={() => handleDeleteHousing(h.id)}>Delete</Button>
                    </div>
                  )}
                </div>
                {h.description && <p className="text-sm text-muted line-clamp-3">{h.description}</p>}
                <p className="text-xs text-muted">Posted by {author}</p>
                <div className="mt-auto border-t border-border pt-4">
                  <CommentsSection targetType="listing" targetId={h.id} apiBase={API} user={user} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}


function Events() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    date: "",
    location: "",
  });

  const loadEvents = () => {
    setError("");
    fetch(`${API}/api/events`)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load events (${res.status})`);
        return res.json();
      })
      .then(setEvents)
      .catch((err) => {
        console.error(err);
        setError(err.message || "Could not load events. Is the backend running?");
      });
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    if (!user?.id) {
      setError("You must be logged in to post an event.");
      return;
    }
    fetch(`${API}/api/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title.trim(),
        description: form.description.trim(),
        date: form.date,
        location: form.location.trim(),
        createdBy: user.id,
      }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || `Create failed (${res.status})`);
        return data;
      })
      .then(() => {
        setForm({ title: "", description: "", date: "", location: "" });
        loadEvents();
      })
      .catch((err) => {
        console.error(err);
        setError(err.message);
      });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Calendar className="h-8 w-8 icon-ev shrink-0" aria-hidden />
        <div>
          <span className="badge-ev">Events</span>
          <h2 className="page-title mt-1">Community events</h2>
        </div>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <h3 className="text-lg font-semibold">Add an event</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            <Textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
            <div>
              <Label>Date &amp; time</Label>
              <Input type="datetime-local" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
            </div>
            <Input placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} required />
            <Button type="submit">Post event</Button>
          </form>
        </CardContent>
      </Card>

      {error && <Badge variant="danger">{error}</Badge>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {events.map((ev) => (
          <Card key={ev.id} className="lborder-ev pl-1">
            <CardContent className="space-y-3 pt-5">
              <span className="badge-ev w-fit">Event</span>
              <span className="badge-ev">{ev.location || "Location"}</span>
              <h3 className="text-lg font-semibold">{ev.title}</h3>
              <p className="text-sm text-muted">
                {ev.date ? new Date(ev.date).toLocaleString() : "—"}
              </p>
              {ev.description && <p className="text-sm text-muted line-clamp-3">{ev.description}</p>}
              <div className="border-t border-border pt-4">
                <CommentsSection targetType="event" targetId={ev.id} apiBase={API} user={user} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {events.length === 0 && !error && (
        <p className="text-muted">No events yet. Add one above.</p>
      )}
    </div>
  );
}

/* ---------- Main App ---------- */

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

function MainApp() {
  const { user } = useAuth();

  if (!user) {
    return (
      <Router>
        <AppShell
          guest
          guestSubtitle="Connecting expats through community, housing, and events"
        >
          <Routes>
            <Route path="/verify/:token" element={<VerifyEmail />} />
            <Route path="/forgot" element={<ForgotPassword />} />
            <Route path="/reset/:token" element={<ResetPassword />} />
            <Route path="*" element={<AuthForm />} />
          </Routes>
        </AppShell>
      </Router>
    );
  }
  return (
    <Router>
      <AppShell>
        <Routes>
          <Route path="/verify/:token" element={<VerifyEmail />} />
          <Route path="/forgot" element={<ForgotPassword />} />
          <Route path="/reset/:token" element={<ResetPassword />} />
          <Route path="/" element={<Home />} />
          <Route path="/users" element={<Users />} />
          <Route path="/housing" element={<Housing />} />
          <Route path="/events" element={<Events />} />
          <Route path="/essentials/:id" element={<ExpatEssentials />} />
          <Route path="/essentials" element={<ExpatEssentials />} />
          <Route path="/knowhow/:id" element={<LocalKnowHow />} />
          <Route path="/knowhow" element={<LocalKnowHow />} />
          <Route path="/referrals" element={<Referrals />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/search" element={<SearchProfiles />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </AppShell>
    </Router>
  );
}
