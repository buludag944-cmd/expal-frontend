const { parsePostText } = require("./blogFrontMatter");

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const BUCKETS = ["New", "Improved", "Fixed"];
const SKIP_LABELS = new Set(["internal", "no-changelog"]);
const CLOSING = "Have an idea? Tell us in the Community tab.";

function isoWeek(date) {
  const copy = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = copy.getUTCDay() || 7;
  copy.setUTCDate(copy.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(copy.getUTCFullYear(), 0, 1));
  return Math.ceil(((copy - yearStart) / 86400000 + 1) / 7);
}

function shouldPublish(date, force) {
  if (force) return true;
  return isoWeek(date) % 2 === 0;
}

function labelName(label) {
  return String(typeof label === "string" ? label : label && label.name || "").toLowerCase();
}

function hasSkipLabel(labels) {
  return (labels || []).some((label) => SKIP_LABELS.has(labelName(label)));
}

function isInternalPath(file) {
  const pathName = String(file || "").replace(/\\/g, "/");
  if (pathName.startsWith(".github/") || pathName.includes("/.github/")) return true;
  if (/\.(yml|yaml)$/.test(pathName)) return true;
  if (pathName.endsWith(".md") && !pathName.startsWith("content/blog/")) return true;
  if (pathName.includes(".test.") || pathName.includes(".spec.") || pathName.includes("__tests__/")) return true;
  if (pathName === "test" || pathName.startsWith("test/") || pathName.includes("/test/")) return true;
  return false;
}

function isUserFacing(files) {
  return (files || []).some((file) => !isInternalPath(file));
}

function sectionBullets(body) {
  const text = String(body || "").replace(/\r\n/g, "\n");
  const match = text.match(/^## What changed[^\n]*$/m);
  if (!match) return [];
  const rest = text.slice(match.index + match[0].length);
  const next = rest.search(/^## /m);
  const section = next === -1 ? rest : rest.slice(0, next);
  return section
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^[-*] /.test(line))
    .map((line) => line.replace(/^[-*] /, "").trim());
}

function cleanBullet(text) {
  const plain = String(text || "").replace(/`+/g, "").replace(/\s+/g, " ").trim();
  if (!plain) return "";
  if (/[/\\]/.test(plain)) return "";
  if (/\b[\w.-]+\.(jsx?|tsx?|mjs|cjs|json|ya?ml|md)\b/i.test(plain)) return "";
  if (/\b(password|secret|token|api key|private key)\b/i.test(plain)) return "";
  if (/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/.test(plain)) return "";
  if (/\b\d{7}[A-Za-z]{1,2}\b/.test(plain)) return "";
  return plain;
}

function bucketFor(title, labels) {
  const names = (labels || []).map(labelName);
  if (names.includes("bug") || /^(fix|fixes|fixed)\b/i.test(String(title || ""))) return "Fixed";
  if (/^(add|adds|added|new)\b/i.test(String(title || ""))) return "New";
  return "Improved";
}

function emptyGroups() {
  return { New: [], Improved: [], Fixed: [] };
}

function collectUpdates(pulls) {
  const groups = emptyGroups();
  const seen = new Set();
  for (const pull of pulls || []) {
    if (hasSkipLabel(pull.labels)) continue;
    if (!isUserFacing(pull.files)) continue;
    const bucket = bucketFor(pull.title, pull.labels);
    for (const bullet of sectionBullets(pull.body)) {
      const clean = cleanBullet(bullet);
      if (!clean) continue;
      const key = `${bucket}:${clean.toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      groups[bucket].push(clean);
    }
  }
  return groups;
}

function hasUpdates(groups) {
  return BUCKETS.some((name) => groups[name] && groups[name].length);
}

function sinceFromNames(fileNames, now) {
  const dates = (fileNames || [])
    .map((name) => {
      const match = String(name).match(/whats-new-(\d{4}-\d{2}-\d{2})\.md$/);
      return match ? match[1] : "";
    })
    .filter(Boolean)
    .sort();
  if (!dates.length) return new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const next = new Date(`${dates[dates.length - 1]}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  return next;
}

function prettyDate(date) {
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

function yamlQuote(value) {
  return `"${String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function renderPost(groups, date) {
  if (!hasUpdates(groups)) return null;
  const day = date.toISOString().slice(0, 10);
  const pretty = prettyDate(date);
  const title = `What's new in EXPal — ${pretty}`;
  const lines = ["Here is what changed in EXPal recently.", ""];
  for (const name of BUCKETS) {
    if (!groups[name].length) continue;
    lines.push(`## ${name}`, "");
    groups[name].forEach((item) => lines.push(`- ${item}`));
    lines.push("");
  }
  lines.push(CLOSING);
  const description = `What is new, improved, and fixed in EXPal as of ${pretty}.`;
  const markdown = `---
title: ${yamlQuote(title)}
slug: whats-new-${day}
seoTitle: "What's new in EXPal"
seoDescription: ${yamlQuote(description)}
excerpt: "A short look at what changed in EXPal."
tags: ["product-updates"]
author: "EXPal editorial"
published: true
lastReviewed: ${day}
---

${lines.join("\n").trim()}
`;
  const parsed = parsePostText(markdown, `whats-new-${day}`);
  if (parsed.errors.length) {
    throw new Error(parsed.errors.join(" "));
  }
  return { slug: `whats-new-${day}`, markdown, title };
}

module.exports = {
  CLOSING,
  bucketFor,
  cleanBullet,
  collectUpdates,
  hasUpdates,
  isInternalPath,
  isUserFacing,
  isoWeek,
  renderPost,
  sectionBullets,
  shouldPublish,
  sinceFromNames,
};
