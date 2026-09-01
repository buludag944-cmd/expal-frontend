import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import AppShell from "./components/AppShell";
import AuthEntry from "./pages/auth/AuthEntry";
import Home from "./pages/Home";
import Onboarding from "./pages/Onboarding";
import Journey from "./pages/Journey";
import Community from "./pages/Community";
import ForumThreadPage from "./pages/ForumThreadPage";
import Explore from "./pages/Explore";
import { AuthProvider, useAuth } from "./AuthContext";
import Messages from "./pages/Messages";
import ExpatEssentials from "./pages/ExpatEssentials";
import LocalKnowHow from "./pages/LocalKnowHow";
import Privacy from "./pages/Privacy";
import ChildSafetyStandards from "./pages/ChildSafetyStandards";
import EmploymentSupport from "./pages/EmploymentSupport";
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
import { fetchVisaTypes, updateVisaType, updateEmploymentStatus } from "./lib/journeyApi";
import { isNativeApp } from "./lib/platform";
import { HOUSING_FILTERS, filterHousingListings, housingListingTags } from "./lib/housingFilters";
import MobileHousing from "./pages/mobile/MobileHousing";
import MobileProfile from "./pages/mobile/MobileProfile";
import MobileMembers from "./pages/mobile/MobileMembers";
import MemberProfile from "./pages/MemberProfile";
import Notifications from "./pages/Notifications";
import HelpFaq from "./pages/HelpFaq";
import SearchPage from "./pages/SearchPage";

const API = getApiBaseUrl();

/* ---------- Pages ---------- */

function ProfileEmploymentSection() {
  const { user, token, refreshUser } = useAuth();
  const [status, setStatus] = useState(user?.employmentStatus || "employed");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    setStatus(user?.employmentStatus || "employed");
  }, [user?.employmentStatus]);

  const options = [
    { value: "employed", label: "Employed" },
    { value: "job_seeking", label: "Looking for work" },
    { value: "unemployed", label: "Unemployed" },
    { value: "laid_off", label: "Redundant / laid off" },
  ];

  const save = async () => {
    if (!token) return;
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch(`${API}/api/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ employmentStatus: status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `Could not save (${res.status})`);
      }
      await refreshUser();
      try {
        await updateEmploymentStatus(token, status);
      } catch {
        /* journey sync optional if API not deployed yet */
      }
      setMsg("Employment status saved. Check Journey for updated guidance.");
    } catch (e) {
      setMsg(e.message || "Could not save");
    } finally {
      setBusy(false);
    }
  };

  if (!user?.onboardingComplete) return null;

  return (
    <Card className="mt-6">
      <CardContent className="pt-4 space-y-3">
        <h3 className="font-semibold">Employment status</h3>
        <p className="text-sm text-muted">
          Tell us if you&apos;re unemployed or were made redundant so we can show clearer permit and career guidance.
        </p>
        {user.employmentStatus && (
          <p className="text-sm">
            Saved: <strong>{options.find((o) => o.value === user.employmentStatus)?.label || user.employmentStatus}</strong>
          </p>
        )}
        <div className="space-y-2">
          {options.map(({ value, label }) => (
            <label key={value} className="flex items-center gap-2 text-sm cursor-pointer min-h-[44px]">
              <input
                type="radio"
                name="employmentStatus"
                checked={status === value}
                onChange={() => setStatus(value)}
              />
              {label}
            </label>
          ))}
        </div>
        <Button
          size="sm"
          onClick={save}
          loading={busy}
          disabled={busy || status === (user?.employmentStatus || "employed")}
        >
          Save employment status
        </Button>
        {msg && (
          <p className={`text-xs ${msg.includes("saved") || msg.includes("Saved") ? "text-green-700" : "text-red-600"}`}>
            {msg}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function ProfileVisaSection() {
  const { user, token, refreshUser } = useAuth();
  const [options, setOptions] = useState([]);
  const [selected, setSelected] = useState(user?.visaType || "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    setSelected(user?.visaType || "");
  }, [user?.visaType]);

  useEffect(() => {
    const country = user?.destinationCountry || "Ireland";
    fetchVisaTypes(country, token).then(setOptions).catch(() => setOptions([]));
  }, [user?.destinationCountry, token]);

  const save = async () => {
    if (!token || !selected) return;
    setBusy(true);
    setMsg("");
    try {
      await updateVisaType(token, selected);
      await refreshUser();
      setMsg("Visa type updated — check Journey → Visa guide for your new path.");
    } catch (e) {
      setMsg(e.message || "Could not update visa type");
    } finally {
      setBusy(false);
    }
  };

  if (!user?.onboardingComplete) return null;

  return (
    <Card className="mt-6">
      <CardContent className="pt-4 space-y-3">
        <h3 className="font-semibold">Visa &amp; relocation</h3>
        <p className="text-sm text-muted">
          Your personalised guide and timeline are based on this pathway. Change it if you switch permit type.
        </p>
        {user.visaType && (
          <p className="text-sm">
            Current: <strong>{user.visaType}</strong>
          </p>
        )}
        <div className="space-y-2">
          {options.map((v) => (
            <label key={v.value} className="flex items-start gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name="profileVisa"
                checked={selected === v.value}
                onChange={() => setSelected(v.value)}
                className="mt-1"
              />
              <span>
                <span className="font-medium">{v.label || v.value}</span>
                {v.tagline && <span className="block text-muted text-xs mt-0.5">{v.tagline}</span>}
              </span>
            </label>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={save} loading={busy} disabled={busy || !selected || selected === user?.visaType}>
            Update visa type
          </Button>
          <Link to="/journey">
            <Button size="sm" variant="secondary">Open visa guide</Button>
          </Link>
        </div>
        {msg && <p className="text-xs text-muted">{msg}</p>}
      </CardContent>
    </Card>
  );
}

function Profile() {
  const { user, token, refreshUser, logout } = useAuth();
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
      await refreshUser();
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
  if (isNativeApp()) {
    return <MobileProfile />;
  }

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
          <ProfileEmploymentSection />
          <ProfileVisaSection />

          <div className="border-t border-border pt-6 mt-8 space-y-4">
            <div className="flex flex-wrap gap-3 text-sm">
              <Link to="/help" className="text-primary font-medium hover:underline">
                Help &amp; FAQs
              </Link>
              <Link to="/privacy" className="text-primary font-medium hover:underline">
                Privacy
              </Link>
              <Link to="/employment-support" className="text-primary font-medium hover:underline">
                Employment rights
              </Link>
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                if (window.confirm("Sign out of EXPal?")) logout();
              }}
            >
              Sign out
            </Button>
          </div>
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
  return <SearchPage backTo={isNativeApp() ? "/" : "/community"} />;
}

function Users() {
  if (isNativeApp()) {
    return <MobileMembers backTo="/community" />;
  }
  return <UsersWeb />;
}

function UsersWeb() {
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API}/api/users`)
      .then((res) => res.json())
      .then(setUsers)
      .catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="page-title">Expat community nearby</h2>
      <p className="text-sm text-muted">Tap a member to view their profile and send a message.</p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {users.map((u) => (
          <button
            key={u.id}
            type="button"
            onClick={() => navigate(`/members/${u.id}`)}
            className="text-left min-h-[44px]"
          >
            <Card className="hover:border-primary/40 transition-colors">
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
          </button>
        ))}
      </div>
    </div>
  );
}

function Housing() {
  const { token, user } = useAuth();
  const native = isNativeApp();
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
  const [housingFilter, setHousingFilter] = useState("All");
  const [housingSearch, setHousingSearch] = useState("");

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
      headers: {
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
    if (!window.confirm("Delete this housing listing permanently?")) return;
    fetch(`${API}/api/housing/${id}`, {
      method: "DELETE",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to delete housing ${id}`);
      })
      .then(() => setHomes((prev) => prev.filter((item) => item.id !== id)))
      .catch(console.error);
    if (editingId === id) {
      resetHousingForm();
    }
  };

  const resetHousingForm = () => {
    setForm({ title: "", city: "", price: "", description: "", images: [] });
    setEditingId(null);
    setShowForm(false);
  };

  const cityLabel = user?.destinationCity || "Dublin";
  const filteredHomes = filterHousingListings(homes, {
    filter: housingFilter,
    search: housingSearch,
  });

  if (native) {
    return (
      <MobileHousing
        homes={homes}
        cityLabel={cityLabel}
        user={user}
        token={token}
        showForm={showForm}
        setShowForm={setShowForm}
        form={form}
        setForm={setForm}
        handleSubmit={handleSubmit}
        handleImageUpload={handleImageUpload}
        handleEditHousing={handleEditHousing}
        handleDeleteHousing={handleDeleteHousing}
        editingId={editingId}
        resetForm={resetHousingForm}
      />
    );
  }

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

      <div className="space-y-3">
        <Input
          value={housingSearch}
          onChange={(e) => setHousingSearch(e.target.value)}
          placeholder="Search area, type, price…"
          aria-label="Search housing listings"
        />
        <div className="flex flex-wrap gap-2">
          {HOUSING_FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setHousingFilter(f)}
              style={{
                padding: "6px 12px",
                borderRadius: 999,
                border: "1px solid var(--border)",
                background: housingFilter === f ? "var(--primary)" : "var(--card)",
                color: housingFilter === f ? "#fff" : "inherit",
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              {f}
            </button>
          ))}
        </div>
        <p className="text-sm text-muted">{filteredHomes.length} listings found</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredHomes.map((h) => {
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
                    <div className="flex flex-wrap gap-1.5">
                      {housingListingTags(h).slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="info">{tag}</Badge>
                      ))}
                    </div>
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
                  <CommentsSection targetType="listing" targetId={h.id} apiBase={API} user={user} token={token} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredHomes.length === 0 && (
        <p className="text-sm text-muted">No listings match your search — try another filter or post a new listing.</p>
      )}
    </div>
  );
}


function Events() {
  if (isNativeApp()) {
    return <Navigate to="/community?tab=Events" replace />;
  }
  return <EventsWebPage />;
}

function EventsWebPage() {
  const { user, token } = useAuth();
  const [events, setEvents] = useState([]);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    date: "",
    location: "",
  });

  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

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

  const resetForm = () => {
    setForm({ title: "", description: "", date: "", location: "" });
    setEditingId(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    if (!user?.id || !token) {
      setError("You must be logged in to post an event.");
      return;
    }
    const isEditing = editingId !== null;
    fetch(isEditing ? `${API}/api/events/${editingId}` : `${API}/api/events`, {
      method: isEditing ? "PUT" : "POST",
      headers: authHeaders,
      body: JSON.stringify({
        title: form.title.trim(),
        description: form.description.trim(),
        date: form.date,
        location: form.location.trim(),
      }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || `Save failed (${res.status})`);
        return data;
      })
      .then(() => {
        resetForm();
        loadEvents();
      })
      .catch((err) => {
        console.error(err);
        setError(err.message);
      });
  };

  const startEditEvent = (ev) => {
    setEditingId(ev.id);
    const d = ev.date ? new Date(ev.date) : new Date();
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setForm({
      title: ev.title || "",
      description: ev.description || "",
      date: local,
      location: ev.location || "",
    });
  };

  const handleDeleteEvent = (id) => {
    if (!window.confirm("Delete this event?")) return;
    fetch(`${API}/api/events/${id}`, { method: "DELETE", headers: authHeaders })
      .then((res) => {
        if (!res.ok && res.status !== 204) {
          return res.json().then((d) => {
            throw new Error(d.error || "Delete failed");
          });
        }
      })
      .then(() => {
        setEvents((prev) => prev.filter((ev) => ev.id !== id));
        if (editingId === id) resetForm();
      })
      .catch((err) => setError(err.message));
  };

  const canModifyEvent = (ev) =>
    user && (Number(ev.createdBy) === Number(user.id) || user.isAdmin);

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
          <h3 className="text-lg font-semibold">{editingId ? "Edit event" : "Add an event"}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            <Textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
            <div>
              <Label>Date &amp; time</Label>
              <Input type="datetime-local" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
            </div>
            <Input placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} required />
            <div className="flex flex-wrap gap-2">
              <Button type="submit">{editingId ? "Save changes" : "Post event"}</Button>
              {editingId !== null && (
                <Button type="button" variant="secondary" onClick={resetForm}>
                  Cancel
                </Button>
              )}
            </div>
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
              {canModifyEvent(ev) && (
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => startEditEvent(ev)}>
                    Edit
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => handleDeleteEvent(ev.id)}>
                    Delete
                  </Button>
                </div>
              )}
              <div className="border-t border-border pt-4">
                <CommentsSection targetType="event" targetId={ev.id} apiBase={API} user={user} token={token} />
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

function OnboardingGate({ children }) {
  const { user, authReady } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!authReady || !user?.onboardingComplete) return;
    if (location.pathname === "/onboarding") {
      navigate("/", { replace: true });
    }
  }, [user, authReady, location.pathname, navigate]);

  return (
    <>
      {user && !user.onboardingComplete && location.pathname !== "/onboarding" && (
        <div className="onboard-banner">
          <p>Complete your profile to unlock personalised visa guides and timeline.</p>
          <button type="button" onClick={() => navigate("/onboarding")}>
            Resume setup →
          </button>
        </div>
      )}
      {children}
    </>
  );
}

function MainApp() {
  const { user, authReady, authBlocking, clearSession } = useAuth();

  if (!authReady && authBlocking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-muted text-sm">Loading your account…</p>
        <p className="text-xs text-muted max-w-sm">
          The server may be waking up (first load can take a few seconds).
        </p>
        <button
          type="button"
          className="text-sm font-medium text-primary underline min-h-[44px] px-4"
          onClick={() => clearSession("")}
        >
          Continue to sign in
        </button>
      </div>
    );
  }

  if (!user) {
    return (
      <Router>
        <Routes>
          <Route path="/verify/:token" element={<Navigate to="/" replace />} />
          <Route path="/forgot" element={<Navigate to="/" replace />} />
          <Route path="/reset/:token" element={<Navigate to="/" replace />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/child-safety" element={<ChildSafetyStandards />} />
          <Route path="/employment-support" element={<EmploymentSupport />} />
          <Route path="*" element={<AuthEntry />} />
        </Routes>
      </Router>
    );
  }
  return (
    <Router>
      <AppShell>
        <OnboardingGate>
          <Routes>
            <Route path="/verify/:token" element={<Navigate to="/" replace />} />
            <Route path="/forgot" element={<Navigate to="/" replace />} />
            <Route path="/reset/:token" element={<Navigate to="/" replace />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/child-safety" element={<ChildSafetyStandards />} />
            <Route path="/employment-support" element={<EmploymentSupport />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/" element={<Home />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/community" element={<Community />} />
            <Route path="/community/thread/:threadId" element={<ForumThreadPage />} />
            <Route path="/journey" element={<Journey />} />
            <Route path="/users" element={<Users />} />
            <Route path="/members/:userId" element={<MemberProfile />} />
            <Route path="/housing" element={<Housing />} />
            <Route path="/events" element={<Events />} />
            <Route path="/essentials/:id" element={<ExpatEssentials />} />
            <Route path="/essentials" element={<ExpatEssentials />} />
            <Route path="/knowhow/:id" element={<LocalKnowHow />} />
            <Route path="/knowhow" element={<LocalKnowHow />} />
            <Route path="/referrals" element={<Referrals />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/help" element={<HelpFaq />} />
            <Route path="/search" element={<SearchProfiles />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </OnboardingGate>
      </AppShell>
    </Router>
  );
}
