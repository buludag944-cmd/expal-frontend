#!/usr/bin/env node
/**
 * Decide whether this Monday needs a store build, then bump versions and
 * write the release notes. The workflow commits, tags, and starts the builds.
 */
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const {
  checklistMarkdown,
  collectRelease,
  hasReleaseNotes,
  planVersions,
  readAndroidVersions,
  readIosVersions,
  releaseNotes,
  shouldRelease,
  sinceFromTags,
  writeAndroidVersions,
  writeIosVersions,
} = require("../src/lib/releaseNotes");

const root = path.resolve(__dirname, "..");
const repos = ["buludag944-cmd/expal-frontend", "buludag944-cmd/expalapp"];

function output(name, value) {
  const file = process.env.GITHUB_OUTPUT;
  if (!file) return;
  fs.appendFileSync(file, `${name}=${value}\n`);
}

function git(args) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
}

function tokenFor(repo) {
  if (repo.endsWith("/expalapp")) return process.env.CROSS_REPO_READ_TOKEN || process.env.GITHUB_TOKEN || "";
  return process.env.GITHUB_TOKEN || "";
}

async function github(url, token) {
  const headers = {
    accept: "application/vnd.github+json",
    "user-agent": "expal-release-train",
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

async function pullsFor(repo, since) {
  const token = tokenFor(repo);
  try {
    const pulls = await github(
      `https://api.github.com/repos/${repo}/pulls?state=closed&base=main&per_page=50&sort=updated&direction=desc`,
      token
    );
    const detailed = [];
    for (const pull of pulls) {
      if (!pull.merged_at || new Date(pull.merged_at) <= since) continue;
      const files = await github(
        `https://api.github.com/repos/${repo}/pulls/${pull.number}/files?per_page=100`,
        token
      );
      detailed.push({
        title: pull.title,
        body: pull.body,
        labels: pull.labels,
        files: files.map((file) => file.filename),
      });
    }
    return detailed;
  } catch (err) {
    if (repo.endsWith("/expal-frontend")) throw err;
    console.log("Could not read expalapp. Add CROSS_REPO_READ_TOKEN to include its changes.");
    return [];
  }
}

function releaseTags() {
  const names = git(["tag", "--list", "ios-*", "android-*"]).split("\n").filter(Boolean);
  return names.map((name) => ({
    name,
    date: git(["log", "-1", "--format=%cI", name]),
  }));
}

async function main() {
  const force = process.argv.includes("--force") || process.env.RELEASE_FORCE === "1";
  const now = new Date();
  if (!shouldRelease(now, force)) {
    console.log("Not this Monday. The release train runs every other Monday.");
    output("release", "no");
    return;
  }

  const since = sinceFromTags(releaseTags(), now);
  console.log(`Looking for changes merged after ${since.toISOString()}.`);
  const pulls = [];
  for (const repo of repos) pulls.push(...(await pullsFor(repo, since)));
  const collected = collectRelease(pulls);
  if (!hasReleaseNotes(collected.groups)) {
    console.log("No user-facing changes. No release.");
    output("release", "no");
    return;
  }

  const androidPath = path.join(root, "android/app/build.gradle");
  const iosPath = path.join(root, "ios/App/App.xcodeproj/project.pbxproj");
  const android = readAndroidVersions(fs.readFileSync(androidPath, "utf8"));
  const ios = readIosVersions(fs.readFileSync(iosPath, "utf8"));
  const plan = planVersions(android, ios, collected.groups.New.length > 0);
  const notes = releaseNotes(collected.groups);

  fs.writeFileSync(androidPath, writeAndroidVersions(fs.readFileSync(androidPath, "utf8"), {
    versionCode: plan.versionCode,
    versionName: plan.versionName,
  }));
  fs.writeFileSync(iosPath, writeIosVersions(fs.readFileSync(iosPath, "utf8"), {
    build: plan.iosBuild,
    marketing: plan.versionName,
  }));

  const changelogDir = path.join(root, "fastlane/metadata/android/en-US/changelogs");
  fs.mkdirSync(changelogDir, { recursive: true });
  fs.writeFileSync(path.join(changelogDir, `${plan.versionCode}.txt`), `${notes}\n`);
  fs.mkdirSync(path.join(root, "fastlane/metadata/android"), { recursive: true });
  fs.writeFileSync(path.join(root, "fastlane/metadata/android/whatsnew-en-US"), `${notes}\n`);
  fs.mkdirSync(path.join(root, "fastlane/metadata/ios"), { recursive: true });
  fs.writeFileSync(path.join(root, "fastlane/metadata/ios/whats_to_test.txt"), `${notes}\n`);
  fs.writeFileSync(
    path.join(root, "fastlane/metadata/release-checklist.md"),
    checklistMarkdown(plan.versionName, collected.tests)
  );

  output("release", "yes");
  output("version", plan.versionName);
  output("version_code", String(plan.versionCode));
  console.log(`Prepared ${plan.versionName} (${plan.versionCode}).`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
