import { mergePosts } from "./blogApi";

test("file-based posts win on duplicate slugs and everything is newest first", () => {
  const staticPosts = [{ slug: "pps", title: "File PPS", publishedAt: "2026-11-26T08:00:00Z" }];
  const apiPosts = [
    { slug: "pps", title: "API PPS", publishedAt: "2026-12-10T08:00:00Z" },
    { slug: "housing", title: "Housing", publishedAt: "2026-12-01T08:00:00Z" },
    { slug: "old", title: "Old", publishedAt: "2026-01-01T08:00:00Z" },
  ];
  const merged = mergePosts(staticPosts, apiPosts);
  expect(merged.map((p) => p.slug)).toEqual(["housing", "pps", "old"]);
  expect(merged.find((p) => p.slug === "pps").title).toBe("File PPS");
});
