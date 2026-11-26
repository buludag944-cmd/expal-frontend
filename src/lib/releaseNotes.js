const MONTHS_IN_TWO_WEEKS = 14 * 24 * 60 * 60 * 1000;
const NOTE_LIMIT = 500;
const BUCKETS = ["New", "Improved", "Fixed"];
const SKIP_LABELS = new Set(["internal", "no-changelog"]);

function isoWeek(date) {
  const copy = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = copy.getUTCDay() || 7;
  copy.setUTCDate(copy.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(copy.getUTCFullYear(), 0, 1));
  return Math.ceil(((copy - yearStart) / 86400000 + 1) / 7);
}

function shouldRelease(date, force) {
  if (force) return true;
  return isoWeek(date) % 2 === 0;
}

function parseSemver(value) {
  const match = String(value || "").trim().match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!match) throw new Error(`Version must look like 1.3.25. Got "${value}".`);
  return { major: Number(match[1]), minor: Number(match[2]), patch: Number(match[3]) };
}

function formatSemver(parsed) {
  return `${parsed.major}.${parsed.minor}.${parsed.patch}`;
}

function compareSemver(left, right) {
  const a = parseSemver(left);
  const b = parseSemver(right);
  if (a.major !== b.major) return a.major - b.major;
  if (a.minor !== b.minor) return a.minor - b.minor;
  return a.patch - b.patch;
}

function bumpSemver(version, kind) {
  const parsed = parseSemver(version);
  if (kind === "minor") return formatSemver({ major: parsed.major, minor: parsed.minor + 1, patch: 0 });
  if (kind === "patch") return formatSemver({ ...parsed, patch: parsed.patch + 1 });
  throw new Error("Release kind must be minor or patch.");
}

function higherVersion(left, right) {
  return compareSemver(left, right) >= 0 ? left : right;
}

function readAndroidVersions(gradle) {
  const code = String(gradle).match(/versionCode\s+(\d+)/);
  const name = String(gradle).match(/versionName\s+"([^"]+)"/);
  if (!code || !name) throw new Error("Could not read the Android version.");
  return { versionCode: Number(code[1]), versionName: name[1] };
}

function writeAndroidVersions(gradle, next) {
  const current = readAndroidVersions(gradle);
  if (next.versionCode <= current.versionCode) {
    throw new Error("Android versionCode must go up.");
  }
  if (compareSemver(next.versionName, current.versionName) < 0) {
    throw new Error("Android versionName must not go backwards.");
  }
  return String(gradle)
    .replace(/versionCode\s+\d+/, `versionCode ${next.versionCode}`)
    .replace(/versionName\s+"[^"]+"/, `versionName "${next.versionName}"`);
}

function readIosVersions(project) {
  const builds = [...String(project).matchAll(/CURRENT_PROJECT_VERSION = (\d+);/g)].map((match) => Number(match[1]));
  const names = [...String(project).matchAll(/MARKETING_VERSION = ([^;]+);/g)].map((match) => match[1].trim());
  if (!builds.length || !names.length) throw new Error("Could not read the iOS version.");
  if (new Set(builds).size !== 1 || new Set(names).size !== 1) {
    throw new Error("iOS Debug and Release versions do not match.");
  }
  return { build: builds[0], marketing: names[0] };
}

function writeIosVersions(project, next) {
  const current = readIosVersions(project);
  if (next.build <= current.build) throw new Error("iOS build number must go up.");
  if (compareSemver(next.marketing, current.marketing) < 0) {
    throw new Error("iOS version must not go backwards.");
  }
  return String(project)
    .replace(/CURRENT_PROJECT_VERSION = \d+;/g, `CURRENT_PROJECT_VERSION = ${next.build};`)
    .replace(/MARKETING_VERSION = [^;]+;/g, `MARKETING_VERSION = ${next.marketing};`);
}

function planVersions(android, ios, hasNewFeature) {
  const versionName = bumpSemver(
    higherVersion(android.versionName, ios.marketing),
    hasNewFeature ? "minor" : "patch"
  );
  return {
    versionName,
    versionCode: android.versionCode + 1,
    iosBuild: ios.build + 1,
  };
}

function labelName(label) {
  return String(typeof label === "string" ? label : (label && label.name) || "").toLowerCase();
}

function isInternalPath(file) {
  const pathName = String(file || "").replace(/\\/g, "/");
  if (pathName.startsWith(".github/") || pathName.includes("/.github/")) return true;
  if (/\.(yml|yaml)$/.test(pathName)) return true;
  if (pathName.endsWith(".md") && !pathName.startsWith("content/blog/")) return true;
  if (pathName.includes(".test.") || pathName.includes(".spec.") || pathName.includes("__tests__/")) return true;
  if (pathName === "test" || pathName.startsWith("test/") || pathName.includes("/test/")) return true;
  return false;
}

function isUserFacing(files) {
  return (files || []).some((file) => !isInternalPath(file));
}

function sectionBody(text, heading) {
  const source = String(text || "").replace(/\r\n/g, "\n");
  const match = source.match(new RegExp(`^## ${heading}[^\\n]*$`, "im"));
  if (!match) return "";
  const rest = source.slice(match.index + match[0].length);
  const next = rest.search(/^## /m);
  return next === -1 ? rest : rest.slice(0, next);
}

function listItems(section) {
  return section
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^([-*]|\d+\.)\s+/.test(line))
    .map((line) => line.replace(/^([-*]|\d+\.)\s+/, "").trim());
}

function cleanSentence(text) {
  const plain = String(text || "").replace(/`+/g, "").replace(/\s+/g, " ").trim();
  if (!plain) return "";
  if (/[/\\]/.test(plain)) return "";
  if (/\b[\w.-]+\.(jsx?|tsx?|mjs|cjs|json|ya?ml|md)\b/i.test(plain)) return "";
  if (/\b(password|secret|token|api key|private key)\b/i.test(plain)) return "";
  if (/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/.test(plain)) return "";
  if (/\b\d{7}[A-Za-z]{1,2}\b/.test(plain)) return "";
  return plain;
}

function bucketFor(title, labels) {
  const names = (labels || []).map(labelName);
  if (names.includes("bug") || /^(fix|fixes|fixed)\b/i.test(String(title || ""))) return "Fixed";
  if (/^(add|adds|added|new)\b/i.test(String(title || ""))) return "New";
  return "Improved";
}

function collectRelease(pulls) {
  const groups = { New: [], Improved: [], Fixed: [] };
  const tests = [];
  const seen = new Set();
  for (const pull of pulls || []) {
    if ((pull.labels || []).some((label) => SKIP_LABELS.has(labelName(label)))) continue;
    if (!isUserFacing(pull.files)) continue;
    const bucket = bucketFor(pull.title, pull.labels);
    for (const item of listItems(sectionBody(pull.body, "What changed"))) {
      const clean = cleanSentence(item);
      const key = `${bucket}:${clean.toLowerCase()}`;
      if (!clean || seen.has(key)) continue;
      seen.add(key);
      groups[bucket].push(clean);
    }
    const steps = listItems(sectionBody(pull.body, "How to test it on a phone"))
      .map(cleanSentence)
      .filter(Boolean);
    if (steps.length) tests.push({ title: cleanSentence(pull.title) || "A recent change", steps });
  }
  return { groups, tests };
}

function hasReleaseNotes(groups) {
  return BUCKETS.some((name) => groups[name].length);
}

function releaseNotes(groups) {
  const lines = [];
  for (const name of BUCKETS) {
    for (const item of groups[name] || []) lines.push(`${name}: ${item}`);
  }
  let text = lines.join("\n");
  if ([...text].length <= NOTE_LIMIT) return text;
  return `${[...text].slice(0, NOTE_LIMIT - 1).join("").trimEnd()}…`;
}

function checklistMarkdown(versionName, tests) {
  const lines = [
    `# Test release ${versionName}`,
    "",
    "## On an iPhone",
    "1. Install the new TestFlight build.",
    "2. Open EXPal and try the changes below.",
    "",
    "## On an Android phone",
    "1. Install the new internal-testing build.",
    "2. Open EXPal and try the changes below.",
    "",
  ];
  if (tests.length) {
    lines.push("## From the changes", "");
    for (const item of tests) {
      lines.push(`- ${item.title}`);
      item.steps.forEach((step) => lines.push(`  - ${step}`));
    }
  }
  return `${lines.join("\n").trim()}\n`;
}

function testflightLocalization(buildId, notes) {
  return {
    data: {
      type: "betaBuildLocalizations",
      attributes: {
        locale: "en-US",
        whatsNew: String(notes || "").trim().slice(0, 4000),
      },
      relationships: {
        build: { data: { type: "builds", id: String(buildId) } },
      },
    },
  };
}

function sinceFromTags(tags, now) {
  const parsed = (tags || [])
    .map((tag) => {
      const match = String(tag.name || "").match(/^(?:ios|android)-(\d+\.\d+\.\d+)$/);
      if (!match || !tag.date) return null;
      return { version: match[1], date: new Date(tag.date) };
    })
    .filter(Boolean)
    .sort((a, b) => compareSemver(a.version, b.version));
  if (!parsed.length) return new Date(now.getTime() - MONTHS_IN_TWO_WEEKS);
  return parsed[parsed.length - 1].date;
}

module.exports = {
  NOTE_LIMIT,
  bumpSemver,
  checklistMarkdown,
  collectRelease,
  compareSemver,
  hasReleaseNotes,
  planVersions,
  readAndroidVersions,
  readIosVersions,
  releaseNotes,
  shouldRelease,
  sinceFromTags,
  testflightLocalization,
  writeAndroidVersions,
  writeIosVersions,
};
