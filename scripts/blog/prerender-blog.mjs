// Postbuild: makes the blog fully visible to Google and link previews.
// The React app renders blog pages in the browser, so crawlers and
// LinkedIn/WhatsApp previews would otherwise see an empty page. This writes:
//   build/blog/index.html          the article list, as real HTML
//   build/blog/<slug>.html         each article, as real HTML with meta tags
//   build/sitemap.xml              every page and article, on the site's own domain
// React takes over the page as soon as it loads, so visitors see the normal app.
// Articles from the API (written in the in-app admin) are included when the API answers.
import { promises as fs } from "fs";
import path from "path";
import { API_URL, ROOT, SITE_URL, escapeHtml, markdownToHtml } from "./lib.mjs";

const BUILD = path.join(ROOT, "build");

async function fetchApiPosts() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);
  try {
    const res = await fetch(`${API_URL}/api/blog`, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return (Array.isArray(data) ? data : []).filter((p) => p && p.slug && p.title);
  } catch (err) {
    console.warn(`[blog] API posts not prerendered (${err.message}). They still work in the app.`);
    return [];
  } finally {
    clearTimeout(timer);
  }
}

function absolute(url) {
  if (!url) return `${SITE_URL}/expal-logo.png`;
  return /^https?:/i.test(url) ? url : `${SITE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

function fmtDate(iso) {
  try {
    return new Date(iso).toLocaleDateString("en-IE", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return "";
  }
}

function headTags({ title, description, url, image, type, jsonLd }) {
  return [
    `<title>${escapeHtml(title)}</title>`,
    `<meta name="description" content="${escapeHtml(description)}" />`,
    `<link rel="canonical" href="${escapeHtml(url)}" />`,
    `<meta property="og:site_name" content="EXPal" />`,
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
    `<meta property="og:type" content="${type}" />`,
    `<meta property="og:url" content="${escapeHtml(url)}" />`,
    `<meta property="og:image" content="${escapeHtml(image)}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(description)}" />`,
    `<meta name="twitter:image" content="${escapeHtml(image)}" />`,
    jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, "\\u003c")}</script>` : "",
  ].join("\n    ");
}

function fillTemplate(template, head, bodyHtml) {
  let html = template
    .replace(/<title>[\s\S]*?<\/title>/, "")
    .replace(/<meta\s+name="description"[\s\S]*?\/>/, "");
  const style = `<style>.prerender-blog{max-width:760px;margin:0 auto;padding:2rem 1.25rem;font-family:"DM Sans",system-ui,sans-serif;color:#1d1a22;line-height:1.7}.prerender-blog img{max-width:100%;height:auto;border-radius:16px}.prerender-blog a{color:#c93b55}</style>`;
  html = html.replace("</head>", `    ${head}\n    ${style}\n  </head>`);
  return html.replace('<div id="root"></div>', `<div id="root">${bodyHtml}</div>`);
}

function articleHtml(post) {
  const reviewed = post.lastReviewed ? ` · Last reviewed ${fmtDate(post.lastReviewed)}` : "";
  const mins = post.readingMinutes ? ` · ${post.readingMinutes} min read` : "";
  return `<main class="prerender-blog"><article>
<p><a href="/blog">← All articles</a></p>
<h1>${escapeHtml(post.title)}</h1>
<p>${escapeHtml(fmtDate(post.publishedAt))}${mins}${reviewed}</p>
${post.excerpt ? `<p><strong>${escapeHtml(post.excerpt)}</strong></p>` : ""}
${post.coverImageUrl ? `<img src="${escapeHtml(post.coverImageUrl)}" alt="${escapeHtml(post.coverAlt || "")}" width="1200" height="630" />` : ""}
${markdownToHtml(post.body || "")}
</article></main>`;
}

function listHtml(posts) {
  const items = posts
    .map(
      (p) => `<li><a href="/blog/${escapeHtml(p.slug)}">${escapeHtml(p.title)}</a> — ${escapeHtml(p.excerpt || "")}</li>`,
    )
    .join("\n");
  return `<main class="prerender-blog"><h1>Guides for your first months in Ireland</h1>
<p>Practical, source-checked guides for expats moving to Ireland, from the EXPal team.</p>
<ul>${items}</ul></main>`;
}

function sitemap(posts) {
  const today = new Date().toISOString().slice(0, 10);
  const urls = [
    { loc: `${SITE_URL}/`, lastmod: today, priority: "1.0" },
    { loc: `${SITE_URL}/blog`, lastmod: today, priority: "0.9" },
    ...posts.map((p) => ({
      loc: `${SITE_URL}/blog/${p.slug}`,
      lastmod: (p.lastReviewed || p.updatedAt || p.publishedAt || today).slice(0, 10),
      priority: "0.8",
    })),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${escapeHtml(u.loc)}</loc><lastmod>${u.lastmod}</lastmod><priority>${u.priority}</priority></url>`).join("\n")}
</urlset>
`;
}

export async function prerenderBlog() {
  const template = await fs.readFile(path.join(BUILD, "index.html"), "utf8");
  let staticPosts = [];
  try {
    staticPosts = JSON.parse(await fs.readFile(path.join(BUILD, "blog-data", "posts.json"), "utf8"));
  } catch {
    console.warn("[blog] build/blog-data/posts.json missing — did the prebuild step run?");
  }
  const seen = new Set(staticPosts.map((p) => p.slug));
  const apiPosts = (await fetchApiPosts()).filter((p) => !seen.has(p.slug));
  const all = [...staticPosts, ...apiPosts].sort((a, b) => String(b.publishedAt || "").localeCompare(String(a.publishedAt || "")));

  await fs.mkdir(path.join(BUILD, "blog"), { recursive: true });
  for (const post of all) {
    const url = `${SITE_URL}/blog/${post.slug}`;
    const image = absolute(post.coverImageUrl);
    const description = post.seoDescription || post.excerpt || "EXPal guide for expats in Ireland";
    const head = headTags({
      title: `${post.seoTitle || post.title} | EXPal`,
      description,
      url,
      image,
      type: "article",
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: post.title,
        description,
        image: [image],
        datePublished: post.publishedAt,
        dateModified: post.lastReviewed || post.updatedAt || post.publishedAt,
        author: { "@type": "Organization", name: "EXPal", url: SITE_URL },
        publisher: { "@type": "Organization", name: "EXPal", logo: { "@type": "ImageObject", url: `${SITE_URL}/logo512.png` } },
        mainEntityOfPage: url,
      },
    });
    await fs.writeFile(path.join(BUILD, "blog", `${post.slug}.html`), fillTemplate(template, head, articleHtml(post)));
  }

  const listHead = headTags({
    title: "EXPal Blog — Guides for your first months in Ireland",
    description: "Practical, source-checked guides for expats moving to Ireland: PPS number, IRP, housing, tax, healthcare and more.",
    url: `${SITE_URL}/blog`,
    image: absolute(all[0]?.coverImageUrl),
    type: "website",
    jsonLd: { "@context": "https://schema.org", "@type": "Blog", name: "EXPal Blog", url: `${SITE_URL}/blog` },
  });
  await fs.writeFile(path.join(BUILD, "blog", "index.html"), fillTemplate(template, listHead, listHtml(all)));
  await fs.writeFile(path.join(BUILD, "sitemap.xml"), sitemap(all));
  console.log(`[blog] Prerendered ${all.length} article(s) (${staticPosts.length} from files, ${apiPosts.length} from the API) + sitemap.xml`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  prerenderBlog().catch((err) => {
    // Never fail the deploy because of prerendering; the app still works without it.
    console.warn("[blog] prerender skipped:", err.message);
  });
}
