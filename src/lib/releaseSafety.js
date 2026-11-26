const APP_ID = "com.yourbrand.expal";
const TEAM_ID = "R7H563878X";

function checkReleaseSafety({ config, project, gradle, serverUrl }) {
  const errors = [];
  const source = String(config || "");
  const ios = String(project || "");
  const android = String(gradle || "");

  if (!source.includes(`appId: "${APP_ID}"`)) {
    errors.push(`The app id must stay ${APP_ID}.`);
  }
  if (serverUrl) {
    errors.push("CAPACITOR_SERVER_URL is set. A release build must include the web app, not load a live site.");
  }
  if (/^\s*server:\s*\{/m.test(source) && !source.includes("if (serverUrl)")) {
    errors.push("capacitor.config.ts sets a live server URL for every build.");
  }
  if (!ios.includes(`DEVELOPMENT_TEAM = ${TEAM_ID};`)) {
    errors.push(`The iOS team must stay ${TEAM_ID}.`);
  }
  if (!ios.includes(`PRODUCT_BUNDLE_IDENTIFIER = ${APP_ID};`)) {
    errors.push(`The iOS bundle id must stay ${APP_ID}.`);
  }
  if (!android.includes(`applicationId "${APP_ID}"`)) {
    errors.push(`The Android application id must stay ${APP_ID}.`);
  }
  return errors;
}

function failedCheckIssue({ workflow, versionName, runUrl }) {
  return {
    title: `Release ${versionName} did not start`,
    body: [
      `${workflow} stopped before uploading.`,
      "",
      "The tests or the web build failed, or the app id, Apple team, or bundled-web check failed.",
      "",
      runUrl || "",
      "",
      "No build was sent to TestFlight or the Play store.",
    ].join("\n"),
  };
}

module.exports = {
  APP_ID,
  TEAM_ID,
  checkReleaseSafety,
  failedCheckIssue,
};
