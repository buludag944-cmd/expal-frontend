const fs = require("fs");
const path = require("path");
const {
  NOTE_LIMIT,
  checklistMarkdown,
  collectRelease,
  planVersions,
  readAndroidVersions,
  readIosVersions,
  releaseNotes,
  shouldRelease,
  sinceFromTags,
  testflightLocalization,
  writeAndroidVersions,
  writeIosVersions,
} = require("./releaseNotes");

const android = 'versionCode 111\nversionName "1.3.20"\n';
const ios = "CURRENT_PROJECT_VERSION = 125;\nMARKETING_VERSION = 1.3.25;\nCURRENT_PROJECT_VERSION = 125;\nMARKETING_VERSION = 1.3.25;\n";

test("releases on even ISO weeks unless you press Run workflow", () => {
  const monday = new Date("2026-11-23T08:00:00Z");
  const next = new Date("2026-11-30T08:00:00Z");
  expect(shouldRelease(next, false)).toBe(!shouldRelease(monday, false));
  expect(shouldRelease(monday, true)).toBe(true);
});

test("bumps the higher store version and never goes backwards", () => {
  const patch = planVersions(readAndroidVersions(android), readIosVersions(ios), false);
  expect(patch).toEqual({ versionName: "1.3.26", versionCode: 112, iosBuild: 126 });
  const feature = planVersions(readAndroidVersions(android), readIosVersions(ios), true);
  expect(feature.versionName).toBe("1.4.0");

  const nextAndroid = writeAndroidVersions(android, { versionCode: 112, versionName: "1.3.26" });
  expect(nextAndroid).toMatch(/versionCode 112/);
  expect(nextAndroid).toMatch(/versionName "1.3.26"/);
  expect(() => writeAndroidVersions(nextAndroid, { versionCode: 112, versionName: "1.3.26" })).toThrow(/go up/);
  expect(() => writeAndroidVersions(android, { versionCode: 112, versionName: "1.3.19" })).toThrow(/backwards/);

  const nextIos = writeIosVersions(ios, { build: 126, marketing: "1.3.26" });
  expect(nextIos.match(/CURRENT_PROJECT_VERSION = 126;/g)).toHaveLength(2);
  expect(nextIos.match(/MARKETING_VERSION = 1.3.26;/g)).toHaveLength(2);
  expect(() => writeIosVersions(nextIos, { build: 126, marketing: "1.3.27" })).toThrow(/go up/);
});

test("writes short notes and a phone checklist without code or secrets", () => {
  const { groups, tests } = collectRelease([
    {
      title: "Add the home checklist",
      labels: [],
      files: ["src/Home.js"],
      body: "## What changed\n- Adds a checklist on the home screen.\n- See `src/Home.js`.\n\n## How to test it on a phone\n1. Open the home screen.\n2. Tick one item.\n",
    },
    {
      title: "Fix the clock",
      labels: ["bug"],
      files: ["src/Journey.jsx"],
      body: "## What changed\n- The residency clock keeps counting.\n- The token is secret.\n",
    },
    {
      title: "Update CI",
      labels: ["no-changelog"],
      files: ["src/App.js"],
      body: "## What changed\n- Hidden.\n",
    },
  ]);
  const notes = releaseNotes(groups);
  expect(notes).toMatch(/New: Adds a checklist on the home screen\./);
  expect(notes).toMatch(/Fixed: The residency clock keeps counting\./);
  expect(notes).not.toMatch(/Home\.js|secret|Hidden/);
  expect([...notes].length).toBeLessThanOrEqual(NOTE_LIMIT);
  expect(checklistMarkdown("1.3.26", tests)).toMatch(/Tick one item/);
  expect(checklistMarkdown("1.3.26", tests)).toMatch(/TestFlight/);
});

test("the train tags both stores and does not publish to production", () => {
  const yml = fs.readFileSync(path.join(__dirname, "../../.github/workflows/release-train.yml"), "utf8");
  expect(yml).toMatch(/\[skip ci\]/);
  expect(yml).toMatch(/ios-\$\{VERSION\}/);
  expect(yml).toMatch(/android-\$\{VERSION\}/);
  expect(yml).toMatch(/iOS TestFlight/);
  expect(yml).toMatch(/Android Play internal/);
  expect(yml).not.toMatch(/production/);
  expect(testflightLocalization("build-1", "New: A checklist.").data.attributes.whatsNew).toBe(
    "New: A checklist."
  );
});

test("looks back 14 days until a release tag exists", () => {
  const now = new Date("2026-11-30T08:00:00Z");
  expect(sinceFromTags([], now).toISOString()).toBe("2026-11-16T08:00:00.000Z");
  const since = sinceFromTags(
    [
      { name: "ios-1.3.20", date: "2026-11-01T00:00:00Z" },
      { name: "android-1.3.25", date: "2026-11-16T00:00:00Z" },
    ],
    now
  );
  expect(since.toISOString()).toBe("2026-11-16T00:00:00.000Z");
});
