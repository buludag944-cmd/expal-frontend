const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../..");

test("robots.txt points Google at this site's sitemap", () => {
  const robots = fs.readFileSync(path.join(root, "public/robots.txt"), "utf8");
  expect(robots).toMatch(/^Sitemap: https:\/\/expalapp\.netlify\.app\/sitemap\.xml\s*$/m);
  expect(robots).not.toMatch(/onrender\.com/);
});

test("sitemap proxy sits above the SPA fallback", () => {
  const redirects = fs.readFileSync(path.join(root, "public/_redirects"), "utf8");
  const toml = fs.readFileSync(path.join(root, "netlify.toml"), "utf8");
  const proxy = "/sitemap.xml  https://expalapp-1.onrender.com/api/blog/sitemap.xml  200";
  expect(redirects.indexOf(proxy)).toBeGreaterThanOrEqual(0);
  expect(redirects.indexOf(proxy)).toBeLessThan(redirects.indexOf("/*"));
  expect(toml.indexOf('from = "/sitemap.xml"')).toBeGreaterThanOrEqual(0);
  expect(toml.indexOf('from = "/sitemap.xml"')).toBeLessThan(toml.indexOf('from = "/*"'));
  expect(toml).toMatch(/apple-app-site-association/);
  expect(toml).toMatch(/assetlinks\.json/);
});
