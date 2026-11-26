#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { checkReleaseSafety } = require("../src/lib/releaseSafety");

const root = path.resolve(__dirname, "..");
const errors = checkReleaseSafety({
  config: fs.readFileSync(path.join(root, "capacitor.config.ts"), "utf8"),
  project: fs.readFileSync(path.join(root, "ios/App/App.xcodeproj/project.pbxproj"), "utf8"),
  gradle: fs.readFileSync(path.join(root, "android/app/build.gradle"), "utf8"),
  serverUrl: process.env.CAPACITOR_SERVER_URL || "",
});

if (errors.length) {
  errors.forEach((error) => console.error(error));
  process.exit(1);
}
console.log("Release checks passed. The web app is bundled and the app id is unchanged.");
