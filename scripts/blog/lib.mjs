// Shared helpers for EXPal's file-based blog (content/blog/*.md).
// Used by build-static-blog.mjs (prebuild), prerender-blog.mjs (postbuild)
// and check-sources.mjs (CI). No external dependencies.
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const CONTENT_DIR = path.join(ROOT, "content", "blog");
export const SITE_URL = (process.env.SITE_URL || "https://expalapp.netlify.app").replace(/\/$/, "");
export const API_URL = (process.env.REACT_APP_API_URL || "https://expalapp-1.onrender.com").replace(/\/$/, "");

// Every article must cite at least one of these official sources.
export const OFFICIAL_DOMAINS = [
  "gov.ie",
  "irishimmigration.ie",
  "citizensinformation.ie",
  "revenue.ie",
  "hse.ie",
  "ndls.ie",
  "rtb.ie",
  "mywelfare.ie",
  "enterprise.gov.ie",
  "oireachtas.ie",
  "irishstatutebook.ie",
  "cso.ie",
  "dublincity.ie",
  "corkcity.ie",
  "transportforireland.ie",
  "nsai.ie",
  "rsa.ie",
  "hea.ie",
  "europa.eu",
];

const REQUIRED = ["title", "slug", "excerpt", "seoTitle", "seoDescription", "publishDate", "lastReviewed"];

/** Parse simple YAML-style front matter (key: value, lists as [a, b] or "a, b" for tags). */
export function parseFrontMatter(raw) {
  const text = raw.replace(/\r\n/g, "\n");
  if (!text.startsWith("---\n")) return { data: {}, body: text };
  const end = text.indexOf("\n---", 4);
  if (end === -1) return { data: {}, body: text };
  const head = text.slice(4, end);
  const body = text.slice(text.indexOf("\n", end + 1) + 1);
  const data = {};
  for (const line of head.split("\n")) {
    const m = line.match(/^([A-Za-z][\w-]*):\s*(.*)$/);
    if (!m) continue;
    let value = m[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    data[m[1]] = value;
  }
  if (typeof data.tags === "string") {
    data.tags = data.tags
      .replace(/^\[|\]$/g, "")
      .split(",")
      .map((t) => t.trim().replace(/^["']|["']$/g, ""))
      .filter(Boolean);
  }
  return { data, body: body.trim() + "\n" };
}

export function isValidDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value || "") && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

/** A post is live once its publishDate (Irish time, start of day) has passed. */
export function isPublished(post, now = new Date()) {
  if (post.draft) return false;
  return Date.parse(`${post.publishDate}T00:00:00Z`) <= now.getTime();
}

export function readingMinutes(body) {
  const words = body.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

export function extractLinks(body) {
  const links = [];
  const re = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g;
  let m;
  while ((m = re.exec(body))) links.push({ text: m[1], url: m[2] });
  return links;
}

export function sourcesSection(body) {
  const lines = body.split("\n");
  const start = lines.findIndex((l) => /^##\s+Sources\s*$/.test(l.trim()));
  if (start === -1) return "";
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((l) => /^##\s/.test(l.trim()));
  return (end === -1 ? rest : rest.slice(0, end)).join("\n");
}

export function hostMatches(url, domains = OFFICIAL_DOMAINS) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return domains.some((d) => host === d || host.endsWith(`.${d}`));
  } catch {
    return false;
  }
}

/** Validate one post. Returns a list of human-readable problems (empty = OK). */
export function validatePost(post) {
  const problems = [];
  for (const key of REQUIRED) {
    if (!post[key]) problems.push(`missing "${key}" in front matter`);
  }
  if (post.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(post.slug)) {
    problems.push(`slug "${post.slug}" must be lowercase words joined by hyphens`);
  }
  if (post.file && post.slug && path.basename(post.file, ".md") !== post.slug) {
    problems.push(`file name must match the slug (${post.slug}.md)`);
  }
  if (post.title && post.title.length > 110) problems.push("title is longer than 110 characters");
  if (post.seoTitle && post.seoTitle.length > 60) problems.push(`seoTitle is ${post.seoTitle.length} characters (max 60)`);
  if (post.seoDescription && (post.seoDescription.length < 70 || post.seoDescription.length > 160)) {
    problems.push(`seoDescription is ${post.seoDescription.length} characters (aim for 70–160)`);
  }
  if (post.excerpt && post.excerpt.length > 240) problems.push("excerpt is longer than 240 characters");
  for (const key of ["publishDate", "lastReviewed"]) {
    if (post[key] && !isValidDate(post[key])) problems.push(`${key} must look like 2026-12-07`);
  }
  if (post.lastReviewed && post.publishDate && isValidDate(post.lastReviewed) && isValidDate(post.publishDate)) {
    const ageDays = (Date.parse(post.publishDate) - Date.parse(post.lastReviewed)) / 86400000;
    if (ageDays > 60) problems.push("lastReviewed is more than 60 days before publishDate — re-check the facts");
  }
  const words = post.body.split(/\s+/).filter(Boolean).length;
  if (words < 400) problems.push(`article is only ${words} words (min 400)`);
  if (/^#\s/m.test(post.body)) problems.push("don't use a single # heading in the body — the title is the H1");
  const sources = extractLinks(sourcesSection(post.body));
  if (!sources.length) problems.push('needs a "## Sources" section with at least one link');
  else if (!sources.some((s) => hostMatches(s.url))) {
    problems.push(`no official source in "## Sources" (expected one of: ${OFFICIAL_DOMAINS.slice(0, 8).join(", ")}…)`);
  }
  if (!/expalapp\.netlify\.app/.test(post.body)) problems.push("missing the EXPal call to action link");
  return problems;
}

export async function loadPosts() {
  let files = [];
  try {
    files = (await fs.readdir(CONTENT_DIR)).filter((f) => f.endsWith(".md") && !f.startsWith("_") && f !== "README.md");
  } catch {
    return [];
  }
  const posts = [];
  for (const file of files.sort()) {
    const raw = await fs.readFile(path.join(CONTENT_DIR, file), "utf8");
    const { data, body } = parseFrontMatter(raw);
    posts.push({
      ...data,
      tags: Array.isArray(data.tags) ? data.tags : [],
      draft: data.draft === "true",
      body,
      file,
      readingMinutes: readingMinutes(body),
    });
  }
  return posts;
}

export function sortNewestFirst(posts) {
  return [...posts].sort((a, b) => (b.publishDate || "").localeCompare(a.publishDate || ""));
}

export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function inline(text) {
  let out = escapeHtml(text);
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, href) => {
    const url = href.replace(/&amp;/g, "&");
    const safe = /^(https?:|mailto:|\/|#)/i.test(url) ? escapeHtml(url) : "#";
    const external = /^https?:/i.test(url) && !url.startsWith(SITE_URL);
    return `<a href="${safe}"${external ? ' rel="noopener noreferrer" target="_blank"' : ""}>${label}</a>`;
  });
  return out;
}

/** Markdown subset → HTML, matching what src/components/BlogBody.jsx renders. */
export function markdownToHtml(body) {
  const lines = body.replace(/\r\n/g, "\n").split("\n");
  const html = [];
  let list = null;
  const flush = () => {
    if (list) {
      html.push(`<${list.tag}>${list.items.map((i) => `<li>${inline(i)}</li>`).join("")}</${list.tag}>`);
      list = null;
    }
  };
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flush();
      continue;
    }
    let m;
    if ((m = line.match(/^(#{2,3})\s+(.*)$/))) {
      flush();
      const level = m[1].length;
      html.push(`<h${level}>${inline(m[2])}</h${level}>`);
    } else if ((m = line.match(/^[-*]\s+(.*)$/))) {
      if (!list || list.tag !== "ul") {
        flush();
        list = { tag: "ul", items: [] };
      }
      list.items.push(m[1]);
    } else if ((m = line.match(/^\d+[.)]\s+(.*)$/))) {
      if (!list || list.tag !== "ol") {
        flush();
        list = { tag: "ol", items: [] };
      }
      list.items.push(m[1]);
    } else {
      flush();
      html.push(`<p>${inline(line)}</p>`);
    }
  }
  flush();
  return html.join("\n");
}

export function coverPath(post) {
  return post.coverImage || `/images/blog/auto/${post.slug}.png`;
}
