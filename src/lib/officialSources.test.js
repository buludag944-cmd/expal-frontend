import { NOT_GOVERNMENT_DISCLAIMER, OFFICIAL_SOURCES } from "./officialSources";

test("official topics link to the publisher's own site", () => {
  expect(NOT_GOVERNMENT_DISCLAIMER).toMatch(/not a government/i);
  const hrefs = OFFICIAL_SOURCES.map((s) => s.href);
  expect(hrefs).toEqual([
    "https://www.gov.ie/en/department-of-social-protection/services/get-a-personal-public-service-pps-number/",
    "https://www.irishimmigration.ie/registering-your-immigration-permission/",
    "https://www.revenue.ie/en/jobs-and-pensions/index.aspx",
    "https://www.citizensinformation.ie/en/moving-country/moving-to-ireland/coming-to-live-in-ireland/",
  ]);
  for (const href of hrefs) {
    expect(href.startsWith("https://")).toBe(true);
  }
});
