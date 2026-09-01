import React, { useState } from "react";
import CommentsSection from "../../components/CommentsSection";
import { getApiBaseUrl } from "../../apiConfig";
import { HOUSING_FILTERS, filterHousingListings, housingListingTags } from "../../lib/housingFilters";
import { MobileScreen, MobileSectionTitle, MobileBadge, MobilePostSheet } from "../../components/mobile/MobileShared";

const API = getApiBaseUrl();
const FILTERS = HOUSING_FILTERS;
const HERO_COLORS = ["#7F77DD", "#1D9E75", "#D85A30", "#185FA5"];
const EMOJIS = ["🏠", "🏢", "🏡", "🏗️"];

function listingTags(h) {
  return housingListingTags(h);
}

export default function MobileHousing({
  homes,
  cityLabel,
  user,
  token,
  showForm,
  setShowForm,
  form,
  setForm,
  handleSubmit,
  handleImageUpload,
  handleEditHousing,
  handleDeleteHousing,
  editingId,
  resetForm,
}) {
  const [activeFilter, setActiveFilter] = useState("All");
  const [search, setSearch] = useState("");

  const filtered = filterHousingListings(homes, { filter: activeFilter, search });

  const canEdit = (h) => user && String(h.userId) === String(user.id);

  const toggleForm = () => {
    if (showForm) {
      resetForm();
    } else {
      setShowForm(true);
    }
  };

  return (
    <MobileScreen
      title={`Housing in ${cityLabel}`}
      action={
        <button
          type="button"
          className="mob-back-btn"
          style={{ background: "none", fontSize: 18 }}
          onClick={() => (showForm ? toggleForm() : setShowForm(true))}
          aria-label="Add listing"
        >
          {showForm ? "✕" : "＋"}
        </button>
      }
      chromeExtra={
        <>
          <div className="mob-search-wrap">
            <input
              className="mob-search-input"
              placeholder="Search area, type, price..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="mob-chip-scroll">
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                className={`mob-chip${activeFilter === f ? " mob-chip--on" : ""}`}
                onClick={() => setActiveFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
        </>
      }
    >
      <MobilePostSheet
        open={showForm}
        onClose={toggleForm}
        title={editingId != null ? "Edit listing" : "Post new housing"}
      >
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input className="mob-search-input" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <input className="mob-search-input" placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
          <input className="mob-search-input" type="number" placeholder="Price €/mo" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
          <textarea className="mob-search-input" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <label className="mob-search-input" style={{ display: "block", cursor: "pointer", height: "auto", padding: "10px 12px" }}>
            📷 Add photos
            <input type="file" accept="image/*" multiple onChange={handleImageUpload} style={{ display: "block", marginTop: 8, fontSize: 12 }} />
          </label>
          {form.images?.length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {form.images.map((img, i) => (
                <img key={i} src={img} alt="" style={{ width: 56, height: 56, borderRadius: 8, objectFit: "cover" }} />
              ))}
            </div>
          )}
          <button type="submit" className="mob-btn-primary" style={{ height: 44 }}>
            {editingId != null ? "Save listing" : "Post listing"}
          </button>
        </form>
      </MobilePostSheet>

      <div className="mob-body" style={{ paddingTop: 16 }}>
        <MobileSectionTitle>{filtered.length} listings found</MobileSectionTitle>
        {filtered.map((h, i) => (
          <article key={h.id} className="mob-prop-card">
            {h.images?.[0] ? (
              <img src={h.images[0]} alt="" style={{ width: "100%", height: 110, objectFit: "cover" }} />
            ) : (
              <div className="mob-prop-img" style={{ background: HERO_COLORS[i % HERO_COLORS.length] }}>
                {EMOJIS[i % EMOJIS.length]}
                <div className="mob-prop-badge-wrap">
                  <MobileBadge label="Expat-friendly" color="teal" />
                </div>
              </div>
            )}
            <div className="mob-prop-info">
              <h3 className="mob-prop-title">{h.title}</h3>
              <p className="mob-prop-loc">📍 {h.city || cityLabel}</p>
              <div className="mob-prop-row">
                <span className="mob-prop-price">€{h.price}/mo</span>
                <div className="mob-prop-tags">
                  {listingTags(h).slice(0, 2).map((t) => (
                    <span key={t} className="mob-prop-tag">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              {canEdit(h) && (
                <div className="mob-ref-actions" style={{ marginTop: 10 }}>
                  <button type="button" className="mob-btn-secondary" onClick={() => handleEditHousing(h)}>
                    Edit
                  </button>
                  <button type="button" className="mob-btn-primary" style={{ background: "#fcebeb", borderColor: "#f09595", color: "#a32d2d" }} onClick={() => handleDeleteHousing(h.id)}>
                    Delete
                  </button>
                </div>
              )}
              <CommentsSection
                targetType="listing"
                targetId={h.id}
                apiBase={API}
                user={user}
                token={token}
                mobile
              />
            </div>
          </article>
        ))}
      </div>
    </MobileScreen>
  );
}
