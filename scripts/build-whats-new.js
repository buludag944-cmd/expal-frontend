#!/usr/bin/env node
/**
 * Build the "What's new" post from merged pull requests and publish it.
 * Scheduled runs publish on even ISO weeks. A manual run passes --force.
 *   node scripts/build-whats-new.js --dry-run --force
 */
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const {
  collectUpdates,
  hasUpdates,
  renderPost,
  shouldPublish,
  sinceFromNames,
} = require("../src/lib/whatsNew");

const root = path.resolve(__dirname, "..");
const blogDir = path.join(root, "content/blog");
const repos = ["buludag944-cmd/expal-frontend", "buludag944-cmd/expalapp"];

function tokenFor(repo) {
  if (repo.endsWith("/expalapp")) {
    return process.env.CROSS_REPO_READ_TOKEN || process.env.GITHUB_TOKEN || "";
  }
  return process.env.GITHUB_TOKEN || "";
}

async function github(url, token) {
  const headers = {
    accept: "application/vnd.github+json",
    "user-agent": "expal-whats-new",
    "x-github-api-version": "2022-11-28",
  };
  if (token) headers.authorization = `Bearer ${token}`;
  const response = await fetch(url, { headers });
  if (!response.ok) {
    const error = new Error(`GitHub returned ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return response.json();
}

async function pullsFor(repo) {
  const token = tokenFor(repo);
  const load = (auth) =>
    github(
      `https://api.github.com/repos/${repo}/pulls?state=closed&base=main&per_page=50&sort=updated&direction=desc`,
      auth
    );
  try {
    const pulls = await load(token);
    const detailed = [];
    for (const pull of pulls) {
      if (!pull.merged_at) continue;
      const files = await github(
        `https://api.github.com/repos/${repo}/pulls/${pull.number}/files?per_page=100`,
        token
      );
      detailed.push({
        title: pull.title,
        body: pull.body,
        labels: pull.labels,
        mergedAt: pull.merged_at,
        files: files.map((file) => file.filename),
      });
    }
    return detailed;
  } catch (err) {
    if (repo.endsWith("/expal-frontend")) throw err;
    console.log(
      `Could not read ${repo}. Add a fine-grained read token as CROSS_REPO_READ_TOKEN to include it.`
    );
    return [];
  }
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const force = process.argv.includes("--force") || process.env.WHATS_NEW_FORCE === "1";
  const now = new Date();
  if (!shouldPublish(now, force)) {
    console.log("Not this Monday. What's new runs every other Monday. Use Run workflow to publish now.");
    return;
  }

  const names = fs.existsSync(blogDir) ? fs.readdirSync(blogDir) : [];
  const since = sinceFromNames(names, now);
  const pulls = [];
  for (const repo of repos) {
    const found = await pullsFor(repo);
    for (const pull of found) {
      if (new Date(pull.mergedAt) >= since) pulls.push(pull);
    }
  }

  const groups = collectUpdates(pulls);
  if (!hasUpdates(groups)) {
    console.log("No user-facing changes since the last update. No post.");
    return;
  }

  const post = renderPost(groups, now);
  if (dryRun) {
    console.log(`dry-run ${post.slug} — ${post.title}`);
    console.log(post.markdown);
    return;
  }

  const file = path.join(blogDir, `${post.slug}.md`);
  fs.writeFileSync(file, post.markdown);
  execFileSync("node", ["scripts/wait-for-api.js"], { cwd: root, stdio: "inherit" });
  execFileSync("node", ["scripts/publish-blog.js", file], { cwd: root, stdio: "inherit" });
  console.log(`Published ${post.slug}`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
