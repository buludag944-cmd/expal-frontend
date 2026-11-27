// Quality gate for blog articles. Runs in GitHub Actions on every pull request
// and every Monday before publishing. It checks that each article:
//   - has complete, well-sized SEO fields and a valid publish date
//   - cites at least one official Irish source in "## Sources"
//   - has no broken links (every link is opened and must answer)
//   - was fact-reviewed recently (lastReviewed)
// It cannot judge whether a sentence is true; that is what the cited official
// sources and the weekly Claude "rules watch" are for.
//
// Usage: node scripts/blog/check-sources.mjs [--offline] [--report report.md]
import { promises as fs } from "fs";
import { isPublished, loadPosts, extractLinks, validatePost, sortNewestFirst } from "./lib.mjs";

const args = process.argv.slice(2);
const OFFLINE = args.includes("--offline");
const reportIdx = args.indexOf("--report");
const REPORT = reportIdx !== -1 ? args[reportIdx + 1] : null;
const STALE_DAYS = 180;
const UA = "Mozilla/5.0 (compatible; EXPalLinkCheck/1.0; +https://expalapp.netlify.app)";

async function checkUrl(url) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    try {
      const res = await fetch(url, { redirect: "follow", signal: controller.signal, headers: { "User-Agent": UA, Accept: "text/html,*/*" } });
      if (res.status < 400) return { ok: true, status: res.status };
      // Some government sites block automated checks; treat as a warning, not a failure.
      if ([401, 403, 429].includes(res.status)) return { ok: true, warn: true, status: res.status };
      if (res.status >= 500 && attempt < 3) continue;
      return { ok: false, status: res.status };
    } catch (err) {
      if (attempt === 3) return { ok: false, status: err.name === "AbortError" ? "timeout" : err.message };
    } finally {
      clearTimeout(timer);
    }
    await new Promise((r) => setTimeout(r, 1500 * attempt));
  }
  return { ok: false, status: "unknown" };
}

async function main() {
  const posts = sortNewestFirst(await loadPosts());
  const now = new Date();
  const errors = [];
  const warnings = [];
  const urlCache = new Map();

  for (const post of posts) {
    for (const p of validatePost(post)) errors.push(`**${post.file}**: ${p}`);

    if (isPublished(post, now) && post.lastReviewed) {
      const age = (now - Date.parse(post.lastReviewed)) / 86400000;
      if (age > STALE_DAYS) warnings.push(`**${post.file}**: facts last reviewed ${Math.round(age)} days ago — re-check against the official sources and update lastReviewed`);
    }

    if (!OFFLINE) {
      for (const { url } of extractLinks(post.body)) {
        if (/expalapp\.netlify\.app/.test(url)) continue;
        if (!urlCache.has(url)) urlCache.set(url, await checkUrl(url));
        const r = urlCache.get(url);
        if (!r.ok) errors.push(`**${post.file}**: broken link (${r.status}) ${url}`);
        else if (r.warn) warnings.push(`**${post.file}**: couldn't verify (${r.status}, site blocks bots) ${url} — open it by hand once`);
      }
    }
  }

  const upcoming = posts.filter((p) => !isPublished(p, now) && !p.draft);
  if (upcoming.length < 2) {
    warnings.push(`Only ${upcoming.length} article(s) scheduled. Add articles from Claude's Monday content pack so a new one goes live every week.`);
  }

  const lines = [
    `# Blog check — ${now.toISOString().slice(0, 10)}`,
    "",
    `${posts.length} article file(s), ${upcoming.length} scheduled. ${OFFLINE ? "Links not checked (offline)." : `${urlCache.size} unique link(s) checked.`}`,
    "",
    errors.length ? "## Must fix" : "## No blocking problems",
    ...errors.map((e) => `- ${e}`),
    "",
    warnings.length ? "## Worth a look" : "",
    ...warnings.map((w) => `- ${w}`),
    "",
    "## Schedule",
    ...sortNewestFirst(posts)
      .reverse()
      .map((p) => `- ${p.publishDate} ${isPublished(p, now) ? "live" : "scheduled"} — ${p.slug}`),
  ];
  const report = lines.join("\n");
  console.log(report);
  if (REPORT) await fs.writeFile(REPORT, report);
  if (errors.length) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
