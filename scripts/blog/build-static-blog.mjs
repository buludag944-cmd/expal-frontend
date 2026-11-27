// Prebuild: turns content/blog/*.md into
//   public/blog-data/posts.json            (posts whose publishDate has passed)
//   public/images/blog/auto/<slug>.png     (1200×630 branded cover images)
// A post with problems is skipped with a warning instead of breaking the deploy;
// CI (check-sources.mjs) blocks broken posts before they are merged.
import { promises as fs } from "fs";
import path from "path";
import { Resvg } from "@resvg/resvg-js";
import {
  ROOT,
  coverPath,
  escapeHtml,
  isPublished,
  loadPosts,
  sortNewestFirst,
  validatePost,
} from "./lib.mjs";

const FONT_DIR = path.join(ROOT, "scripts", "blog", "fonts");
const OUT_DATA = path.join(ROOT, "public", "blog-data");
const OUT_IMG = path.join(ROOT, "public", "images", "blog", "auto");
const LOGO = path.join(ROOT, "public", "expal-logo.png");

function wrap(text, maxChars) {
  const words = text.split(/\s+/);
  const lines = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (next.length > maxChars && cur) {
      lines.push(cur);
      cur = w;
    } else cur = next;
  }
  if (cur) lines.push(cur);
  return lines;
}

const ICONS = {
  card: `
    <rect x="0" y="0" width="300" height="190" rx="22" fill="#fff" fill-opacity="0.94"/>
    <rect x="24" y="30" width="86" height="100" rx="12" fill="#c93b55"/>
    <circle cx="67" cy="65" r="20" fill="#fff"/>
    <path d="M37 120 a30 30 0 0 1 60 0 z" fill="#fff"/>
    <rect x="130" y="40" width="150" height="16" rx="8" fill="#7b4f8e" fill-opacity="0.35"/>
    <rect x="130" y="72" width="120" height="16" rx="8" fill="#7b4f8e" fill-opacity="0.35"/>
    <rect x="130" y="104" width="140" height="16" rx="8" fill="#7b4f8e" fill-opacity="0.35"/>
    <rect x="24" y="148" width="160" height="18" rx="9" fill="#3b4fa0" fill-opacity="0.8"/>`,
  passport: `
    <rect x="40" y="-10" width="210" height="260" rx="18" fill="#2d3f8f"/>
    <circle cx="145" cy="95" r="45" fill="none" stroke="#ffd78c" stroke-width="6"/>
    <ellipse cx="145" cy="95" rx="20" ry="45" fill="none" stroke="#ffd78c" stroke-width="4"/>
    <line x1="100" y1="95" x2="190" y2="95" stroke="#ffd78c" stroke-width="4"/>
    <rect x="95" y="165" width="100" height="12" rx="6" fill="#ffd78c"/>
    <rect x="200" y="205" width="130" height="85" rx="14" fill="#e8473a" stroke="#fff" stroke-width="5"/>
    <text x="222" y="252" font-family="DM Sans" font-weight="800" font-size="40" fill="#fff">90</text>
    <text x="222" y="278" font-family="DM Sans" font-weight="700" font-size="18" fill="#fff">DAYS</text>`,
  home: `
    <path d="M150 0 L300 120 L270 120 L270 260 L30 260 L30 120 L0 120 Z" fill="#fff" fill-opacity="0.94"/>
    <rect x="120" y="170" width="60" height="90" rx="8" fill="#c93b55"/>
    <rect x="60" y="140" width="45" height="45" rx="6" fill="#3b4fa0" fill-opacity="0.8"/>
    <rect x="195" y="140" width="45" height="45" rx="6" fill="#3b4fa0" fill-opacity="0.8"/>`,
  health: `
    <rect x="0" y="0" width="260" height="260" rx="40" fill="#fff" fill-opacity="0.94"/>
    <rect x="100" y="45" width="60" height="170" rx="12" fill="#e8473a"/>
    <rect x="45" y="100" width="170" height="60" rx="12" fill="#e8473a"/>`,
  calendar: `
    <rect x="0" y="20" width="280" height="240" rx="24" fill="#fff" fill-opacity="0.94"/>
    <rect x="0" y="20" width="280" height="60" rx="24" fill="#c93b55"/>
    <rect x="0" y="56" width="280" height="24" fill="#c93b55"/>
    <rect x="60" y="0" width="18" height="50" rx="9" fill="#3b4fa0"/>
    <rect x="202" y="0" width="18" height="50" rx="9" fill="#3b4fa0"/>
    <g fill="#7b4f8e" fill-opacity="0.45">
      <rect x="30" y="105" width="50" height="40" rx="8"/><rect x="115" y="105" width="50" height="40" rx="8"/><rect x="200" y="105" width="50" height="40" rx="8"/>
      <rect x="30" y="170" width="50" height="40" rx="8"/><rect x="200" y="170" width="50" height="40" rx="8"/>
    </g>
    <rect x="115" y="170" width="50" height="40" rx="8" fill="#e8473a"/>`,
  pin: `
    <path d="M130 0 C60 0 10 50 10 120 C10 200 130 280 130 280 C130 280 250 200 250 120 C250 50 200 0 130 0 Z" fill="#fff" fill-opacity="0.94"/>
    <circle cx="130" cy="118" r="48" fill="#c93b55"/>`,
};

function pickIcon(post) {
  if (post.icon && ICONS[post.icon]) return post.icon;
  const text = `${post.category || ""} ${post.tags.join(" ")} ${post.slug}`.toLowerCase();
  if (/irp|immigration|visa|stamp|citizenship|passport|permit/.test(text)) return "passport";
  if (/pps|tax|revenue|bank|money|card|licen/.test(text)) return "card";
  if (/hous|rent|home|tenan/.test(text)) return "home";
  if (/health|gp|hse|doctor|insurance/.test(text)) return "health";
  if (/event|week|calendar|what's new|whats-new|update/.test(text)) return "calendar";
  return "pin";
}

function coverSvg(post, logoDataUri) {
  const chip = escapeHtml(post.category || "Life in Ireland");
  let size = 60;
  let lines = wrap(post.coverTitle || post.title, 22);
  if (lines.length > 3) {
    size = 50;
    lines = wrap(post.coverTitle || post.title, 27);
  }
  if (lines.length > 4) lines = [...lines.slice(0, 3), `${lines[3]}…`];
  const lineGap = Math.round(size * 1.16);
  const titleY = 300;
  const chipWidth = Math.round(chip.length * 11.6 + 46);
  const titleSvg = lines
    .map((l, i) => `<text x="64" y="${titleY + i * lineGap}" font-family="DM Sans" font-weight="800" font-size="${size}" fill="#fff">${escapeHtml(l)}</text>`)
    .join("");
  const logo = logoDataUri
    ? `<rect x="64" y="52" width="88" height="88" rx="20" fill="#fff" fill-opacity="0.94"/><image x="76" y="64" width="64" height="64" href="${logoDataUri}"/>`
    : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="0.55">
      <stop offset="0" stop-color="#e8473a"/><stop offset="0.35" stop-color="#c93b55"/>
      <stop offset="0.7" stop-color="#7b4f8e"/><stop offset="1" stop-color="#3b4fa0"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#g)"/>
  <circle cx="1070" cy="90" r="250" fill="#fff" fill-opacity="0.11"/>
  <circle cx="60" cy="630" r="200" fill="#fff" fill-opacity="0.09"/>
  <circle cx="840" cy="520" r="140" fill="#fff" fill-opacity="0.07"/>
  ${logo}
  <text x="${logoDataUri ? 170 : 64}" y="110" font-family="DM Sans" font-weight="800" font-size="40" fill="#fff">EXPal</text>
  <rect x="64" y="190" width="${chipWidth}" height="46" rx="23" fill="#fff"/>
  <text x="86" y="221" font-family="DM Sans" font-weight="700" font-size="22" fill="#c93b55">${chip}</text>
  ${titleSvg}
  <g transform="translate(840 190)">${ICONS[pickIcon(post)]}</g>
  <text x="64" y="572" font-family="DM Sans" font-weight="500" font-size="24" fill="#fff" fill-opacity="0.9">expalapp.netlify.app  ·  Your friend away from home</text>
</svg>`;
}

async function renderCover(post, logoDataUri) {
  const svg = coverSvg(post, logoDataUri);
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: 1200 },
    font: {
      loadSystemFonts: false,
      defaultFontFamily: "DM Sans",
      fontFiles: ["DMSans_500Medium.ttf", "DMSans_700Bold.ttf", "DMSans_800ExtraBold.ttf"].map((f) => path.join(FONT_DIR, f)),
    },
  });
  return resvg.render().asPng();
}

function toClientPost(post) {
  return {
    id: `static-${post.slug}`,
    source: "static",
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    body: post.body,
    tags: post.tags,
    category: post.category || "",
    seoTitle: post.seoTitle,
    seoDescription: post.seoDescription,
    coverImageUrl: coverPath(post),
    coverAlt: post.coverAlt || `${post.title} — EXPal guide`,
    publishedAt: `${post.publishDate}T08:00:00.000Z`,
    lastReviewed: post.lastReviewed,
    readingMinutes: post.readingMinutes,
    author: post.author || "EXPal editorial",
  };
}

export async function buildStaticBlog({ now = new Date(), log = console } = {}) {
  const posts = await loadPosts();
  await fs.mkdir(OUT_DATA, { recursive: true });
  await fs.mkdir(OUT_IMG, { recursive: true });

  let logoDataUri = "";
  try {
    logoDataUri = `data:image/png;base64,${(await fs.readFile(LOGO)).toString("base64")}`;
  } catch {
    log.warn("[blog] public/expal-logo.png not found — covers will be drawn without the logo");
  }

  const live = [];
  const upcoming = [];
  for (const post of posts) {
    const problems = validatePost(post);
    if (problems.length) {
      log.warn(`[blog] SKIPPED ${post.file}:\n  - ${problems.join("\n  - ")}`);
      continue;
    }
    if (!post.coverImage) {
      const png = await renderCover(post, logoDataUri);
      await fs.writeFile(path.join(OUT_IMG, `${post.slug}.png`), png);
    }
    (isPublished(post, now) ? live : upcoming).push(post);
  }

  const data = sortNewestFirst(live).map(toClientPost);
  await fs.writeFile(path.join(OUT_DATA, "posts.json"), `${JSON.stringify(data, null, 2)}\n`);
  log.log(`[blog] ${data.length} live post(s), ${upcoming.length} scheduled.`);
  for (const p of sortNewestFirst(upcoming).reverse()) log.log(`[blog]   scheduled ${p.publishDate}  ${p.slug}`);
  return { live: data, upcoming };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  buildStaticBlog().catch((err) => {
    console.error("[blog] build failed:", err);
    process.exit(1);
  });
}
