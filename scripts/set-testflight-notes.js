#!/usr/bin/env node
/**
 * Put the release notes into TestFlight "What to Test".
 * A missing file or a build Apple has not processed yet does not fail the upload.
 */
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { testflightLocalization } = require("../src/lib/releaseNotes");

const notesPath = path.resolve(__dirname, "../fastlane/metadata/ios/whats_to_test.txt");

function appStoreToken() {
  const header = Buffer.from(JSON.stringify({
    alg: "ES256",
    kid: process.env.APPSTORE_KEY_ID,
    typ: "JWT",
  })).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(JSON.stringify({
    iss: process.env.APPSTORE_ISSUER_ID,
    iat: now,
    exp: now + 600,
    aud: "appstoreconnect-v1",
  })).toString("base64url");
  const signer = crypto.createSign("SHA256");
  signer.update(`${header}.${payload}`);
  signer.end();
  const signature = signer.sign({
    key: process.env.APPSTORE_PRIVATE_KEY,
    dsaEncoding: "ieee-p1363",
  }).toString("base64url");
  return `${header}.${payload}.${signature}`;
}

async function api(url, token, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  return { status: response.status, body: text ? JSON.parse(text) : {} };
}

async function main() {
  if (!fs.existsSync(notesPath)) {
    console.log("No TestFlight notes file. Skipping.");
    return;
  }
  if (!process.env.APPSTORE_KEY_ID || !process.env.APPSTORE_ISSUER_ID || !process.env.APPSTORE_PRIVATE_KEY) {
    console.log("App Store Connect key is not available. The GitHub issue still has the notes.");
    return;
  }
  const notes = fs.readFileSync(notesPath, "utf8").trim();
  if (!notes) return;
  const token = appStoreToken();
  const apps = await api(
    "https://api.appstoreconnect.apple.com/v1/apps?filter[bundleId]=com.yourbrand.expal&limit=1",
    token
  );
  const appId = apps.body.data && apps.body.data[0] && apps.body.data[0].id;
  if (!appId) {
    console.log("Could not find the app in App Store Connect. The GitHub issue still has the notes.");
    return;
  }
  const builds = await api(
    `https://api.appstoreconnect.apple.com/v1/builds?filter[app]=${appId}&sort=-uploadedDate&limit=1`,
    token
  );
  const buildId = builds.body.data && builds.body.data[0] && builds.body.data[0].id;
  if (!buildId) {
    console.log("The new build is not visible yet. The GitHub issue still has the notes.");
    return;
  }
  const created = await api("https://api.appstoreconnect.apple.com/v1/betaBuildLocalizations", token, {
    method: "POST",
    body: JSON.stringify(testflightLocalization(buildId, notes)),
  });
  if (created.status >= 200 && created.status < 300) {
    console.log("Added TestFlight what to test.");
    return;
  }
  console.log(`TestFlight notes were not attached (${created.status}). The GitHub issue still has them.`);
}

main().catch((err) => {
  console.log(err.message || "Could not set TestFlight notes. The GitHub issue still has them.");
});
