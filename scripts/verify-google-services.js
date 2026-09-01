#!/usr/bin/env node
/** Fail the Android release build if google-services.json has no OAuth clients (Google Sign-In won't work). */
const fs = require("fs");
const path = require("path");

const PACKAGE = "com.yourbrand.expal";
/** Upload-key SHA-1 (lowercase, no colons) — local release / sideload builds */
const UPLOAD_SHA1 = "74e4c5fd4856604f565a1df0d7d236616099d6bd";
/** Debug keystore SHA-1 */
const DEBUG_SHA1 = "589f1b3435215d20f65e43ae6643a16ad060be1e";
/** Play App Signing key SHA-1 (from Play Console → App signing key certificate) */
const PLAY_SHA1 = "691d522e67163cae85506da5fdb99f2a654005dd";

const file = path.join(__dirname, "../android/app/google-services.json");
if (!fs.existsSync(file)) {
  console.error("[google-services] Missing android/app/google-services.json");
  process.exit(1);
}

const json = JSON.parse(fs.readFileSync(file, "utf8"));
const clients = json.client || [];
const android = clients.find((c) => c.client_info?.android_client_info?.package_name === PACKAGE);
const oauth = android?.oauth_client || [];

if (!oauth.length) {
  console.error("");
  console.error("❌ google-services.json has oauth_client: [] — native Google Sign-In CANNOT work.");
  console.error("");
  console.error("Fix in Firebase Console (project expalapp-a6422):");
  console.error(`  1. Project settings → Your apps → Android ${PACKAGE}`);
  console.error("  2. Add SHA-1 fingerprints (release + Play App Signing from Play Console)");
  console.error("  3. Authentication → Sign-in method → Google → Enabled");
  console.error("  4. Download NEW google-services.json → android/app/google-services.json");
  console.error("  5. Re-run: npm run android:bundle");
  console.error("");
  console.error("Release upload-key SHA-1 (add in Firebase):");
  console.error("  74:E4:C5:FD:48:56:60:4F:56:5A:1D:F0:D7:D2:36:61:60:99:D6:BD");
  console.error("");
  process.exit(1);
}

const androidOauth = oauth.filter((c) => c.client_type === 1 && c.android_info?.certificate_hash);
const hashes = androidOauth.map((c) => c.android_info.certificate_hash.toLowerCase());
const hasPlaySigning = hashes.includes(PLAY_SHA1);
const knownOnly =
  hashes.length > 0 &&
  !hasPlaySigning &&
  hashes.every((h) => h === UPLOAD_SHA1 || h === DEBUG_SHA1);

if (knownOnly) {
  console.error("");
  console.error("❌ google-services.json is missing Play App Signing SHA-1.");
  console.error("");
  console.error("Apps installed from Google Play are signed with Google's app signing key,");
  console.error("NOT your upload key. Google Sign-In fails on Play builds until you add it.");
  console.error("");
  console.error("Fix:");
  console.error("  1. Play Console → Your app → Test and release → App integrity");
  console.error("  2. Under App signing key certificate, copy SHA-1 (and SHA-256)");
  console.error("  3. Firebase → expalapp-a6422 → Project settings → Android com.yourbrand.expal");
  console.error("  4. Add fingerprint → paste Play App Signing SHA-1");
  console.error("  5. Download NEW google-services.json → android/app/google-services.json");
  console.error("  6. Re-run: npm run android:bundle and upload the new AAB to Play");
  console.error("");
  console.error("Play App Signing SHA-1 (add this in Firebase):");
  console.error("  69:1D:52:2E:67:16:3C:AE:85:50:6D:A5:FD:B9:9F:2A:65:40:05:DD");
  console.error("");
  console.error("Upload-key SHA-1 (already present — not enough for Play installs):");
  console.error("  74:E4:C5:FD:48:56:60:4F:56:5A:1D:F0:D7:D2:36:61:60:99:D6:BD");
  console.error("");
  process.exit(1);
}

console.log(
  "[google-services] OK —",
  oauth.length,
  "oauth_client(s),",
  androidOauth.length,
  "Android certificate(s) including Play or release signing"
);
