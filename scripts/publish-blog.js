#!/usr/bin/env node
/**
 * Validate content/blog/*.md and publish changed posts.
 *   node scripts/publish-blog.js --dry-run --all
 *   API_URL=... BLOG_PUBLISH_TOKEN=... node scripts/publish-blog.js
 */
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const { parsePostText, toApiBody } = require("../src/lib/blogFrontMatter");

const root = path.resolve(__dirname, "..");
const blogDir = path.join(root, "content/blog");

function listPosts() {
  if (!fs.existsSync(blogDir)) return [];
  return fs
    .readdirSync(blogDir)
    .filter((name) => name.endsWith(".md") && name.toLowerCase() !== "readme.md")
    .map((name) => path.join(blogDir, name))
    .sort();
}

function changedPosts() {
  const args = process.argv.slice(2);
  if (args.includes("--all")) return listPosts();
  const explicit = args.filter((arg) => !arg.startsWith("--")).map((file) => path.resolve(file));
  if (explicit.length) return explicit;

  const before = process.env.GITHUB_EVENT_BEFORE || "";
  if (!before || /^0+$/.test(before)) return listPosts();

  try {
    const out = execFileSync(
      "git",
      ["diff", "--name-only", before, "HEAD", "--", "content/blog"],
      { cwd: root, encoding: "utf8" }
    );
    return out
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.endsWith(".md") && !line.toLowerCase().endsWith("readme.md"))
      .map((line) => path.join(root, line));
  } catch (err) {
    console.log("Could not see which posts changed. Checking every post.");
    return listPosts();
  }
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const files = changedPosts().filter((file) => fs.existsSync(file));
  if (!files.length) {
    console.log("No blog posts to publish.");
    return;
  }

  const ready = [];
  let failed = false;
  for (const file of files) {
    const relative = path.relative(root, file);
    const fileSlug = path.basename(file, ".md");
    const { errors, post } = parsePostText(fs.readFileSync(file, "utf8"), fileSlug);
    if (errors.length) {
      failed = true;
      console.error(relative);
      errors.forEach((error) => console.error(`  - ${error}`));
      continue;
    }
    ready.push(post);
  }
  if (failed) process.exit(1);

  const api = String(process.env.API_URL || "").replace(/\/$/, "");
  const token = process.env.BLOG_PUBLISH_TOKEN || "";
  if (!dryRun && (!api || !token)) {
    console.error("Set API_URL and BLOG_PUBLISH_TOKEN. Use --dry-run to check posts without publishing.");
    process.exit(1);
  }

  for (const post of ready) {
    if (dryRun) {
      console.log(`dry-run ${post.slug} (${post.content.length} characters) — ${post.title}`);
      continue;
    }
    const response = await fetch(`${api}/api/blog/by-slug/${encodeURIComponent(post.slug)}`, {
      method: "PUT",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(toApiBody(post)),
    });
    const text = await response.text();
    if (!response.ok) {
      console.error(`Failed ${post.slug}: ${response.status} ${text.slice(0, 300)}`);
      process.exitCode = 1;
      continue;
    }
    console.log(`${response.status} ${post.slug}`);
  }

  if (process.exitCode) process.exit(process.exitCode);
  console.log(`${dryRun ? "Checked" : "Published"} ${ready.length} post(s).`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
