export const HOUSING_FILTERS = [
  "All",
  "Expat-friendly",
  "Pets OK",
  "Short-term",
  "Furnished",
  "Bills incl.",
];

/** Tags inferred from listing fields (shared by web + mobile housing). */
export function housingListingTags(h) {
  const tags = [];
  const desc = (h.description || "").toLowerCase();
  if (h.city) tags.push(h.city);
  if (desc.includes("furnish")) tags.push("Furnished");
  if (desc.includes("pet")) tags.push("Pets OK");
  if (desc.includes("short-term") || desc.includes("short term")) tags.push("Short-term");
  if (desc.includes("bill")) tags.push("Bills incl.");
  if (tags.length < 2) tags.push("Expat-friendly");
  return tags;
}

export function filterHousingListings(homes, { filter = "All", search = "" } = {}) {
  const q = search.toLowerCase().trim();
  const needle = filter.toLowerCase().replace(" incl.", "");

  return homes.filter((h) => {
    const tags = housingListingTags(h);
    const matchFilter =
      filter === "All" || tags.some((t) => t.toLowerCase().includes(needle));
    const matchSearch =
      !q ||
      (h.title || "").toLowerCase().includes(q) ||
      (h.city || "").toLowerCase().includes(q) ||
      (h.description || "").toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });
}
