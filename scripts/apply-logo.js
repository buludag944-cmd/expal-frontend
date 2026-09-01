/**
 * Apply logo from resources/ to web + Capacitor asset sources.
 * Master: expal_logo_relocation_v6.svg (preferred) or v5, icon crop, or expal_logo.png
 * Requires macOS `sips` for PNG conversion.
 *
 * Usage: npm run logo:apply
 * Optional: npm run logo:apply -- --cap   (also runs cap:assets for Android/iOS)
 */
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

const ROOT = path.join(__dirname, "..");
const RESOURCES = path.join(ROOT, "resources");
const ICON_SVG = path.join(RESOURCES, "expal-logo-icon.svg");
const MASTER_PNG = path.join(RESOURCES, "expal_logo.png");
const SRC = path.join(RESOURCES, "icon.png");
const PUBLIC = path.join(ROOT, "public");
const ASSETS = path.join(ROOT, "src", "assets");
const runCap = process.argv.includes("--cap");

const MASTER_CANDIDATES = [
  path.join(RESOURCES, "expal_logo_relocation_v6.svg"),
  path.join(os.homedir(), "Downloads", "expal_logo_relocation_v6.svg"),
  path.join(RESOURCES, "expal_logo_relocation_v5.svg"),
  path.join(os.homedir(), "Downloads", "expal_logo_relocation_v5.svg"),
];

function die(msg) {
  console.error(msg);
  process.exit(1);
}

function resolveMasterSvg() {
  for (const p of MASTER_CANDIDATES) {
    if (fs.existsSync(p)) return p;
  }
  return null;
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

function svgToPng(svgPath, dest, size) {
  execSync(`sips -s format png -z ${size} ${size} "${svgPath}" --out "${dest}"`, {
    stdio: "pipe",
  });
}

/** v6+ unified app icon (512×512) vs v5 brand sheet with separate palette section. */
function isUnifiedAppIcon(svg) {
  return (
    /viewBox="0 0 522 522"/.test(svg) ||
    /<!-- ── EXPal wordmark ──/.test(svg) ||
    (/<rect x="0" y="0" width="512" height="512"/.test(svg) &&
      !/Brand palette/.test(svg))
  );
}

/** Detect icon square from brand sheet rects (shadow + main icon). */
function detectIconViewBox(svg) {
  if (isUnifiedAppIcon(svg)) {
    return { x: 0, y: 0, w: 512, h: 512 };
  }
  const rects = [...svg.matchAll(/<rect[^>]*\bx="(\d+)"[^>]*\by="(\d+)"[^>]*\bwidth="(\d+)"[^>]*\bheight="(\d+)"/g)];
  if (rects.length >= 2) {
    const [, x, y, w, h] = rects[1].map(Number);
    return { x, y, w, h };
  }
  if (rects.length === 1) {
    const [, x, y, w, h] = rects[0].map(Number);
    return { x, y, w, h };
  }
  return { x: 230, y: 30, w: 220, h: 220 };
}

function wordmarkIndex(svg) {
  const markers = [
    "<!-- ── EXPal wordmark ──",
    "<!-- ── Wordmark ──",
  ];
  let idx = -1;
  for (const m of markers) {
    const i = svg.indexOf(m);
    if (i >= 0 && (idx < 0 || i < idx)) idx = i;
  }
  return idx;
}

function cleanInnerSvg(inner) {
  let out = inner.replace(/<title[\s\S]*?<\/title>\s*/g, "");
  out = out.replace(/<desc[\s\S]*?<\/desc>\s*/g, "");
  // Ground-line mask was for text overlap; not needed on icon-only crop.
  out = out.replace(/\s*mask="url\([^"]+\)"/g, "");
  return out.trim();
}

/** Full v6 asset (wordmark + tagline) for store icons and login. */
function buildFullIconSvg(masterContent) {
  const closeIdx = masterContent.lastIndexOf("</svg>");
  const openTag = masterContent.match(/<svg[\s\S]*?>/);
  if (!openTag || closeIdx < 0) return null;

  const innerStart = openTag.index + openTag[0].length;
  const inner = cleanInnerSvg(masterContent.slice(innerStart, closeIdx));
  const { w, h } = detectIconViewBox(masterContent);

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img">\n` +
    `${inner}\n` +
    `</svg>\n`
  );
}

/** Icon-only crop for header (no duplicate wordmark next to “Expal” text). */
function buildHeaderIconSvg(masterContent) {
  const wmIdx = wordmarkIndex(masterContent);
  const closeIdx = masterContent.lastIndexOf("</svg>");
  const openTag = masterContent.match(/<svg[\s\S]*?>/);
  if (!openTag || closeIdx < 0) return null;

  const innerStart = openTag.index + openTag[0].length;
  const innerEnd = wmIdx > innerStart ? wmIdx : closeIdx;
  const inner = cleanInnerSvg(masterContent.slice(innerStart, innerEnd));

  const { x, y, w, h } = detectIconViewBox(masterContent);
  const pad = isUnifiedAppIcon(masterContent) ? 0 : 4;
  const vx = x - pad;
  const vy = y - pad;
  const vw = w + pad * 2;
  const vh = h + pad * 2;

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${vx} ${vy} ${vw} ${vh}" role="img">\n` +
    `${inner}\n` +
    `</svg>\n`
  );
}

function ensureIconSvg() {
  const masterPath = resolveMasterSvg();
  if (!masterPath) return null;

  const master = fs.readFileSync(masterPath, "utf8");
  const headerIcon = buildHeaderIconSvg(master);
  const fullIcon = buildFullIconSvg(master);
  if (!headerIcon || !fullIcon) return null;

  const masterName = path.basename(masterPath);
  const destMaster = path.join(RESOURCES, masterName);
  if (masterPath !== destMaster) {
    fs.copyFileSync(masterPath, destMaster);
    console.log(`[logo] copied master → resources/${masterName}`);
  }

  fs.writeFileSync(ICON_SVG, headerIcon);
  fs.writeFileSync(path.join(ASSETS, "expal-logo.svg"), headerIcon);
  fs.writeFileSync(path.join(PUBLIC, "expal-logo.svg"), headerIcon);
  fs.writeFileSync(path.join(ASSETS, "expal-logo-full.svg"), fullIcon);
  fs.writeFileSync(path.join(PUBLIC, "expal-logo-full.svg"), fullIcon);
  console.log(`[logo] header icon + full brand from ${masterName}`);
  return { headerIcon, fullIcon };
}

fs.mkdirSync(ASSETS, { recursive: true });

const iconSvgs = ensureIconSvg();

if (iconSvgs) {
  const storeSvgPath = path.join(RESOURCES, "expal-logo-store.svg");
  fs.writeFileSync(storeSvgPath, iconSvgs.fullIcon);
  svgToPng(storeSvgPath, SRC, 1024);
  console.log("[logo] wrote resources/icon.png (1024×1024, full v6 brand)");
} else if (fs.existsSync(MASTER_PNG)) {
  fs.copyFileSync(MASTER_PNG, SRC);
  const { w, h } = sipsSize(SRC);
  if (w !== h) {
    execSync(`sips -p ${Math.max(w, h)} ${Math.max(w, h)} --padColor FDF8F7 "${SRC}"`, {
      stdio: "pipe",
    });
  }
  if (Math.max(w, h) < 1024) {
    execSync(`sips -z 1024 1024 "${SRC}"`, { stdio: "pipe" });
  }
  console.log("[logo] wrote resources/icon.png from expal_logo.png");
} else if (!fs.existsSync(SRC)) {
  die(
    "Missing logo source — add resources/expal_logo_relocation_v6.svg (or v5) or resources/icon.png.\n" +
      "See frontend/LOGO_SETUP.md"
  );
}

const { w, h } = sipsSize(SRC);
if (w !== h) {
  die(`icon.png must be square (got ${w}×${h}).`);
}

const uiPng = path.join(PUBLIC, "expal-logo.png");
const uiSvgPath = path.join(RESOURCES, "expal-logo-ui.svg");
if (iconSvgs) fs.writeFileSync(uiSvgPath, iconSvgs.headerIcon);
svgToPng(iconSvgs ? uiSvgPath : SRC, uiPng, 192);
fs.copyFileSync(uiPng, path.join(ASSETS, "expal-logo.png"));
console.log("[logo] wrote public/expal-logo.png (192px, favicon fallback)");

for (const { name, px } of [
  { name: "logo192.png", px: 192 },
  { name: "logo512.png", px: 512 },
]) {
  const dest = path.join(PUBLIC, name);
  resizeTo(SRC, dest, px);
  console.log(`[logo] wrote public/${name} (${px}×${px})`);
}

const splashDest = path.join(RESOURCES, "splash.png");
resizeTo(SRC, splashDest, Math.min(2732, w));
console.log("[logo] wrote resources/splash.png");

if (runCap) {
  console.log("[logo] running cap:assets (Android + iOS icons)…");
  execSync("npm run cap:assets", { cwd: ROOT, stdio: "inherit" });
} else {
  console.log("[logo] Done. For phone home-screen icons run: npm run logo:apply:cap");
}
