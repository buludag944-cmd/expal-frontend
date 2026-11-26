import { exploreLinks } from "./exploreLinks";

test("the website Explore page lists the new tools", () => {
  const paths = exploreLinks.map((item) => item.to);
  expect(paths).toEqual(expect.arrayContaining(["/scam-checker", "/job-tracker"]));
  expect(exploreLinks.find((item) => item.to === "/scam-checker").title).toBe("Rental scam checker");
  expect(exploreLinks.find((item) => item.to === "/job-tracker").title).toBe("Job tracker");
});
