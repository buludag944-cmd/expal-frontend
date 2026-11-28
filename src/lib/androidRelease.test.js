const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../..");

test("the Play workflow uploads only to internal testing and deletes secrets", () => {
  const yml = fs.readFileSync(path.join(root, ".github/workflows/android-play.yml"), "utf8");
  expect(yml).toMatch(/tags:\s*\n\s*- "android-\*"/);
  expect(yml).toMatch(/tracks: internal/);
  expect(yml).toMatch(/changesNotSentForReview: true/);
  expect(yml).toMatch(/steps\.play\.outputs\.configured == 'true'/);
  expect(yml).toMatch(/name: expal-android-internal/);
  expect(yml).toMatch(/steps\.play\.outputs\.configured != 'true'/);
  expect(yml).not.toMatch(/production/);
  expect(yml).toMatch(/if: always\(\)/);
  expect(yml).toMatch(/rm -f android\/app\/google-services\.json/);
  expect(yml).toMatch(/rm -f "\$ANDROID_KEYSTORE_PATH"/);
  expect(yml).not.toMatch(/echo "\$GOOGLE_SERVICES_JSON"/);
  expect(yml).not.toMatch(/echo "\$ANDROID_KEYSTORE_BASE64"/);
});

test("release signing passwords come from the environment", () => {
  const gradle = fs.readFileSync(path.join(root, "android/app/build.gradle"), "utf8");
  expect(gradle).toMatch(/System\.getenv\("ANDROID_KEYSTORE_PASSWORD"\)/);
  expect(gradle).toMatch(/System\.getenv\("ANDROID_KEY_PASSWORD"\)/);
  expect(gradle).toMatch(/System\.getenv\("ANDROID_KEY_ALIAS"\)/);
  expect(gradle).toMatch(/System\.getenv\("ANDROID_KEYSTORE_PATH"\)/);
  expect(gradle).not.toMatch(/storePassword\s+"/);
  expect(gradle).not.toMatch(/keyPassword\s+"/);
});
