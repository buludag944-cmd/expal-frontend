/**
 * Apply frontend/resources/icon.png to web + Capacitor asset sources.
 * Requires macOS `sips` (built in on your Mac).
 *
 * Usage: npm run logo:apply
 * Optional: npm run logo:apply -- --cap   (also runs cap:assets for Android/iOS)
 */
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SRC = path.join(ROOT, "resources", "icon.png");
const PUBLIC = path.join(ROOT, "public");
const runCap = process.argv.includes("--cap");

function die(msg) {
  console.error(msg);
  process.exit(1);
}

if (!fs.existsSync(SRC)) {
  die(
    "Missing resources/icon.png — add a square PNG (1024×1024 recommended).\n" +
      "See frontend/LOGO_SETUP.md"
  );
}

function sipsSize(file) {
  const out = execSync(`sips -g pixelWidth -g pixelHeight "${file}"`, {
    encoding: "utf8",
  });
  const w = Number((out.match(/pixelWidth: (\d+)/) || [])[1]);
  const h = Number((out.match(/pixelHeight: (\d+)/) || [])[1]);
  return { w, h };
}

function resizeTo(src, dest, size) {
  fs.copyFileSync(src, dest);
  execSync(`sips -z ${size} ${size} "${dest}"`, { stdio: "pipe" });
}

const { w, h } = sipsSize(SRC);
if (w !== h) {
  die(`icon.png must be square (got ${w}×${h}). Crop to 1:1 before applying.`);
}
if (w < 512) {
  console.warn(`[logo] Warning: icon is only ${w}px; 1024×1024 is best for store icons.`);
}

const sizes = [
  { name: "expal-logo.png", px: 192 },
  { name: "logo192.png", px: 192 },
  { name: "logo512.png", px: 512 },
];

for (const { name, px } of sizes) {
  const dest = path.join(PUBLIC, name);
  resizeTo(SRC, dest, px);
  console.log(`[logo] wrote public/${name} (${px}×${px})`);
}

// Splash source matches app icon
const splashDest = path.join(ROOT, "resources", "splash.png");
resizeTo(SRC, splashDest, Math.min(2732, w));
console.log("[logo] wrote resources/splash.png");

if (runCap) {
  console.log("[logo] running cap:assets (Android + iOS icons)…");
  execSync("npm run cap:assets", { cwd: ROOT, stdio: "inherit" });
} else {
  console.log("[logo] Done. For phone home-screen icons run: npm run logo:apply:cap");
}
