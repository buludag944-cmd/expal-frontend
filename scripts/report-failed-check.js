#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { failedCheckIssue } = require("../src/lib/releaseSafety");
const { readAndroidVersions } = require("../src/lib/releaseNotes");

async function main() {
  const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPOSITORY;
  const gradle = fs.readFileSync(path.join(process.cwd(), "android/app/build.gradle"), "utf8");
  const { versionName } = readAndroidVersions(gradle);
  const issue = failedCheckIssue({
    workflow: process.env.RELEASE_WORKFLOW || "Release",
    versionName,
    runUrl: process.env.RELEASE_RUN_URL || "",
  });
  if (!token || !repo) {
    console.error(issue.title);
    console.error(issue.body);
    process.exit(1);
  }
  const response = await fetch(`https://api.github.com/repos/${repo}/issues`, {
    method: "POST",
    headers: {
      accept: "application/vnd.github+json",
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      "user-agent": "expal-release-check",
      "x-github-api-version": "2022-11-28",
    },
    body: JSON.stringify({ title: issue.title, body: issue.body, assignees: ["buludag944-cmd"] }),
  });
  if (response.status === 422) {
    const retry = await fetch(`https://api.github.com/repos/${repo}/issues`, {
      method: "POST",
      headers: {
        accept: "application/vnd.github+json",
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
        "user-agent": "expal-release-check",
        "x-github-api-version": "2022-11-28",
      },
      body: JSON.stringify({ title: issue.title, body: issue.body }),
    });
    if (!retry.ok) {
      console.error(`Could not open the issue (${retry.status}).`);
      process.exit(1);
    }
    return;
  }
  if (!response.ok) {
    console.error(`Could not open the issue (${response.status}).`);
    process.exit(1);
  }
  console.log("Opened an issue for the failed release check.");
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
