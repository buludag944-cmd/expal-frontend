#!/usr/bin/env node
/**
 * After an iOS or Android upload finishes, open one issue when both are done.
 */
const fs = require("fs");
const path = require("path");
const { readAndroidVersions } = require("../src/lib/releaseNotes");

const repo = process.env.GITHUB_REPOSITORY;
const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
const sha = process.env.THIS_SHA;
const thisName = process.env.THIS_WORKFLOW;
const thisConclusion = process.env.THIS_CONCLUSION;

const workflows = {
  "iOS TestFlight": "ios-testflight.yml",
  "Android Play internal": "android-play.yml",
};

function promoteSteps() {
  return [
    "When it looks good, you do these taps yourself. This automation will not do them.",
    "",
    "1. Play Console → Test and release → Internal testing → Promote to production.",
    "2. App Store Connect → the app → add the build to a new version → Submit for Review.",
  ].join("\n");
}

async function github(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      accept: "application/vnd.github+json",
      authorization: `Bearer ${token}`,
      "user-agent": "expal-release-ready",
      "x-github-api-version": "2022-11-28",
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : {};
  if (!response.ok) {
    const error = new Error(`GitHub returned ${response.status}`);
    error.status = response.status;
    error.body = body;
    throw error;
  }
  return body;
}

async function runsFor(fileName) {
  const data = await github(
    `https://api.github.com/repos/${repo}/actions/workflows/${fileName}/runs?head_sha=${sha}&per_page=5`
  );
  return data.workflow_runs || [];
}

async function openIssue(title, body) {
  const listed = await github(`https://api.github.com/repos/${repo}/issues?state=open&per_page=30`);
  if ((listed || []).some((issue) => issue.title === title)) {
    console.log(`Issue already open: ${title}`);
    return;
  }
  const payload = { title, body, assignees: ["buludag944-cmd"] };
  try {
    const created = await github(`https://api.github.com/repos/${repo}/issues`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    console.log(created.html_url);
  } catch (err) {
    if (err.status !== 422) throw err;
    const created = await github(`https://api.github.com/repos/${repo}/issues`, {
      method: "POST",
      body: JSON.stringify({ title, body }),
    });
    console.log(created.html_url);
  }
}

async function main() {
  if (!repo || !token || !sha) {
    console.error("Missing repository, token, or commit.");
    process.exit(1);
  }
  const other = Object.keys(workflows).find((name) => name !== thisName);
  const otherRuns = await runsFor(workflows[other]);
  const otherDone = otherRuns.find((run) => run.status === "completed");
  if (!otherDone && thisConclusion === "success") {
    console.log("Waiting for the other store build.");
    return;
  }

  const gradle = fs.readFileSync(path.join(process.cwd(), "android/app/build.gradle"), "utf8");
  const { versionName } = readAndroidVersions(gradle);
  const failed = thisConclusion !== "success" || (otherDone && otherDone.conclusion !== "success");
  if (failed) {
    await openIssue(
      `Release ${versionName} needs a look`,
      [
        "One of the store builds did not finish.",
        "",
        `- ${thisName}: ${thisConclusion}`,
        otherDone ? `- ${other}: ${otherDone.conclusion}` : `- ${other}: not finished`,
        "",
        process.env.THIS_HTML_URL || "",
      ].join("\n")
    );
    return;
  }

  const notesPath = path.join(process.cwd(), "fastlane/metadata/ios/whats_to_test.txt");
  const checklistPath = path.join(process.cwd(), "fastlane/metadata/release-checklist.md");
  const notes = fs.existsSync(notesPath) ? fs.readFileSync(notesPath, "utf8").trim() : "";
  const checklist = fs.existsSync(checklistPath) ? fs.readFileSync(checklistPath, "utf8").trim() : "";
  await openIssue(
    `Release ${versionName} ready to test`,
    [`## Release notes`, "", notes || "No notes were saved.", "", checklist, "", promoteSteps()].join("\n")
  );
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
