#!/usr/bin/env node
/** Fail iOS release sync if GoogleService-Info.plist is missing Google Sign-In keys. */
const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "../ios/App/App/GoogleService-Info.plist");
if (!fs.existsSync(file)) {
  console.error("[ios-firebase] Missing ios/App/App/GoogleService-Info.plist");
  process.exit(1);
}

const xml = fs.readFileSync(file, "utf8");
const clientId = xml.match(/<key>CLIENT_ID<\/key>\s*<string>([^<]+)<\/string>/);
const reversed = xml.match(/<key>REVERSED_CLIENT_ID<\/key>\s*<string>([^<]+)<\/string>/);
const bundle = xml.match(/<key>BUNDLE_ID<\/key>\s*<string>([^<]+)<\/string>/);
const googleAppId = xml.match(/<key>GOOGLE_APP_ID<\/key>\s*<string>([^<]+)<\/string>/);

const errors = [];
if (!clientId?.[1]) errors.push("CLIENT_ID missing");
if (!reversed?.[1]) errors.push("REVERSED_CLIENT_ID missing");
if (bundle?.[1] !== "com.yourbrand.expal") {
  errors.push(`BUNDLE_ID must be com.yourbrand.expal (got ${bundle?.[1] || "?"})`);
}
if (!googleAppId?.[1]) errors.push("GOOGLE_APP_ID missing");

const infoPlist = path.join(__dirname, "../ios/App/App/Info.plist");
const infoXml = fs.readFileSync(infoPlist, "utf8");
if (reversed?.[1] && !infoXml.includes(reversed[1])) {
  errors.push("Info.plist missing CFBundleURLSchemes for REVERSED_CLIENT_ID");
}

if (errors.length) {
  console.error("");
  console.error("❌ iOS Google Sign-In is not fully configured:");
  errors.forEach((e) => console.error(`  - ${e}`));
  console.error("");
  console.error("Fix: Firebase Console → expalapp-a6422 → iOS app com.yourbrand.expal");
  console.error("  → Download GoogleService-Info.plist → ios/App/App/");
  console.error("  → Add REVERSED_CLIENT_ID to Info.plist → URL Types");
  console.error("");
  process.exit(1);
}

console.log("[ios-firebase] OK — CLIENT_ID, REVERSED_CLIENT_ID, URL scheme configured");
