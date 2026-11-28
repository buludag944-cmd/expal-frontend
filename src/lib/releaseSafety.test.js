const fs = require("fs");
const path = require("path");
const { checkReleaseSafety, failedCheckIssue } = require("./releaseSafety");

const root = path.resolve(__dirname, "../..");

function currentFiles() {
  return {
    config: fs.readFileSync(path.join(root, "capacitor.config.ts"), "utf8"),
    project: fs.readFileSync(path.join(root, "ios/App/App.xcodeproj/project.pbxproj"), "utf8"),
    gradle: fs.readFileSync(path.join(root, "android/app/build.gradle"), "utf8"),
    serverUrl: "",
  };
}

test("the current app config is safe to release", () => {
  expect(checkReleaseSafety(currentFiles())).toEqual([]);
});

test("a live server URL, a changed team, or a set server variable stops the release", () => {
  const files = currentFiles();
  expect(checkReleaseSafety({ ...files, serverUrl: "https://expalapp.netlify.app" }).join("\n")).toMatch(
    /live site/
  );
  expect(checkReleaseSafety({
    ...files,
    config: 'export default { appId: "com.example.other", server: { url: "https://example.com" } };',
  }).join("\n")).toMatch(/app id/);
  expect(checkReleaseSafety({
    ...files,
    project: files.project.replaceAll("DEVELOPMENT_TEAM = R7H563878X;", "DEVELOPMENT_TEAM = TEAMID;"),
  }).join("\n")).toMatch(/team/);
});

test("store workflows test and build before upload, and iOS stays off ordinary pushes", () => {
  const ios = fs.readFileSync(path.join(root, ".github/workflows/ios-testflight.yml"), "utf8");
  const android = fs.readFileSync(path.join(root, ".github/workflows/android-play.yml"), "utf8");
  for (const yml of [ios, android]) {
    expect(yml).toMatch(/npm test -- --watchAll=false/);
    expect(yml).toMatch(/npm run build/);
    expect(yml).toMatch(/check-release-safety\.js/);
    expect(yml).toMatch(/report-failed-check\.js/);
    expect(yml.indexOf("npm test -- --watchAll=false")).toBeLessThan(yml.indexOf("npm run build"));
    expect(yml.indexOf("report-failed-check.js")).toBeLessThan(yml.indexOf("npx cap sync"));
  }
  expect(ios).toMatch(/timeout-minutes:\s*60/);
  expect(ios).not.toMatch(/branches:/);
  expect(ios).toMatch(/tags:\s*\n\s*- "ios-\*"/);
  expect(failedCheckIssue({
    workflow: "iOS TestFlight",
    versionName: "1.3.26",
    runUrl: "https://github.com/example/actions/runs/1",
  }).title).toBe("Release 1.3.26 did not start");
});
