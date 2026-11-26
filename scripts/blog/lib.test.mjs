import test from "node:test";
import assert from "node:assert/strict";
import { parseFrontMatter, isPublished, validatePost, markdownToHtml, hostMatches, sourcesSection } from "./lib.mjs";

const filler = Array.from({ length: 420 }, () => "word").join(" ");
const good = (over = {}) => ({
  title: "How to get a PPS number",
  slug: "how-to-get-a-pps-number",
  file: "how-to-get-a-pps-number.md",
  excerpt: "Short summary.",
  seoTitle: "How to Get a PPS Number in Ireland",
  seoDescription: "Who needs a PPS number, which documents to upload, and how the MyWelfare application works.",
  publishDate: "2026-12-07",
  lastReviewed: "2026-11-26",
  body: `${filler}\n\nJoin [EXPal](https://expalapp.netlify.app).\n\n## Sources\n- [gov.ie](https://www.gov.ie/en/x)\n`,
  ...over,
});

test("parses front matter, tags and body", () => {
  const { data, body } = parseFrontMatter("---\ntitle: A: B\ntags: [a, b]\n---\n\nHello\n");
  assert.equal(data.title, "A: B");
  assert.deepEqual(data.tags, ["a", "b"]);
  assert.equal(body.trim(), "Hello");
});

test("publish date gating", () => {
  assert.equal(isPublished({ publishDate: "2026-12-07" }, new Date("2026-12-06T23:00:00Z")), false);
  assert.equal(isPublished({ publishDate: "2026-12-07" }, new Date("2026-12-07T06:00:00Z")), true);
  assert.equal(isPublished({ publishDate: "2026-12-07", draft: true }, new Date("2027-01-01")), false);
});

test("a complete post passes validation", () => {
  assert.deepEqual(validatePost(good()), []);
});

test("rejects posts without an official source, too-long SEO title, or bad slug", () => {
  const p = validatePost(
    good({ seoTitle: "x".repeat(70), slug: "Bad Slug", body: `${filler}\nhttps://expalapp.netlify.app\n## Sources\n- [blog](https://example.com)\n` }),
  );
  assert.ok(p.some((m) => m.includes("official source")));
  assert.ok(p.some((m) => m.includes("seoTitle")));
  assert.ok(p.some((m) => m.includes("slug")));
});

test("official domains match subdomains only", () => {
  assert.equal(hostMatches("https://www.citizensinformation.ie/en/"), true);
  assert.equal(hostMatches("https://portal.irishimmigration.ie/"), true);
  assert.equal(hostMatches("https://notgov.ie.example.com/"), false);
});

test("sources section and html conversion", () => {
  const body = "Intro\n\n## Sources\n- [a](https://gov.ie)\n\n## Later\ntext";
  assert.match(sourcesSection(body), /gov\.ie/);
  assert.doesNotMatch(sourcesSection(body), /Later/);
  const html = markdownToHtml("## T\n1. one\n- two\n<script>x</script> **b** [l](javascript:alert(1))");
  assert.match(html, /<h2>T<\/h2>/);
  assert.match(html, /<ol><li>one<\/li><\/ol>\s*<ul><li>two<\/li><\/ul>/);
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /href="#"/);
});
