/**
 * Netlify/Linux-safe: ensure logo assets exist before CRA build.
 * Committed src/assets/expal-logo.svg is used in the app; PNGs for PWA/favicon.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const PUBLIC = path.join(ROOT, "public");
const ASSETS = path.join(ROOT, "src", "assets");
const SVG = path.join(ASSETS, "expal-logo.svg");
const PNG = path.join(ASSETS, "expal-logo.png");

function copyIfExists(src, dest, label) {
  if (!fs.existsSync(src)) {
    console.warn(`[logo] skip ${label}: missing ${path.relative(ROOT, src)}`);
    return false;
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  console.log(`[logo] ${label} → ${path.relative(ROOT, dest)}`);
  return true;
}

if (!fs.existsSync(SVG)) {
  console.error(
    "[logo] ERROR: Missing src/assets/expal-logo.svg\n" +
      "  Run on Mac: npm run logo:apply (from expal_logo_relocation_v6.svg or v5)"
  );
  process.exit(1);
}

copyIfExists(SVG, path.join(PUBLIC, "expal-logo.svg"), "SVG → public");

if (fs.existsSync(PNG)) {
  copyIfExists(PNG, path.join(PUBLIC, "expal-logo.png"), "PNG → public");
}

const icon = path.join(ROOT, "resources", "icon.png");
if (fs.existsSync(icon)) {
  for (const [name, px] of [
    ["logo192.png", 192],
    ["logo512.png", 512],
  ]) {
    const dest = path.join(PUBLIC, name);
    if (!fs.existsSync(dest)) {
      fs.copyFileSync(icon, dest);
      try {
        const { execSync } = require("child_process");
        execSync(`sips -z ${px} ${px} "${dest}"`, { stdio: "pipe" });
      } catch {
        /* sips only on macOS */
      }
    }
  }
}

if (!fs.existsSync(path.join(PUBLIC, "logo512.png"))) {
  console.warn("[logo] warn: missing public/logo512.png — run npm run logo:apply on a Mac");
}
