import { filterFaqs, getAllFaqs } from "./data/faqContent";

test("FAQ content is populated", () => {
  expect(getAllFaqs().length).toBeGreaterThan(20);
});

test("FAQ search finds housing topics", () => {
  const results = filterFaqs("housing");
  const total = results.reduce((n, c) => n + c.items.length, 0);
  expect(total).toBeGreaterThan(0);
});
