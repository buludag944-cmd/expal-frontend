const { execFileSync } = require("child_process");
const path = require("path");
const { parsePostText, toApiBody, MAX_TITLE } = require("./blogFrontMatter");

function post(overrides = {}) {
  return `---
title: "How to get a PPS number in Ireland"
slug: how-to-get-a-pps-number
seoTitle: "How to Get a PPS Number in Ireland"
seoDescription: "Who needs a PPS number and what to bring."
excerpt: "A short guide for newcomers."
tags: [pps, "first-90-days", ireland]
author: "EXPal editorial"
published: true
lastReviewed: 2026-11-26
---

Bring your passport and proof of address.
`;
}

test("reads front matter and leaves lastReviewed out of the API body", () => {
  const { errors, post: parsed } = parsePostText(post(), "how-to-get-a-pps-number");
  expect(errors).toEqual([]);
  expect(parsed.tags).toEqual(["pps", "first-90-days", "ireland"]);
  expect(parsed.content).toBe("Bring your passport and proof of address.");
  expect(toApiBody(parsed).lastReviewed).toBeUndefined();
  expect(toApiBody(parsed).content).toMatch(/passport/);
});

test("keeps a live headline that is one character over 70", () => {
  const title = "Laid Off in Ireland on a Work Permit? Your Rights and Where to Get Help";
  expect([...title].length).toBe(71);
  expect([...title].length).toBeLessThanOrEqual(MAX_TITLE);
  const text = post().replace(
    'title: "How to get a PPS number in Ireland"',
    `title: "${title}"`
  );
  const { errors } = parsePostText(text, "how-to-get-a-pps-number");
  expect(errors).toEqual([]);
});

test("rejects a title over 80 characters, a long description, a bad slug, and empty text", () => {
  const text = `---
title: "${"A".repeat(81)}"
slug: Not a slug
seoTitle: "${"B".repeat(71)}"
seoDescription: "${"C".repeat(161)}"
excerpt: "Fine"
tags: housing
author: ""
published: yes
---
`;
  const { errors } = parsePostText(text, "not-a-slug");
  expect(errors.join("\n")).toMatch(/80 or fewer/);
  expect(errors.join("\n")).toMatch(/seoTitle/);
  expect(errors.join("\n")).toMatch(/160/);
  expect(errors.join("\n")).toMatch(/Slug/);
  expect(errors.join("\n")).toMatch(/Tags/);
  expect(errors.join("\n")).toMatch(/author/);
  expect(errors.join("\n")).toMatch(/published/);
  expect(errors.join("\n")).toMatch(/empty/);
});

test("dry-run checks the saved posts and does not need a token", () => {
  const out = execFileSync("node", ["scripts/publish-blog.js", "--dry-run", "--all"], {
    cwd: path.resolve(__dirname, "../.."),
    encoding: "utf8",
    env: { PATH: process.env.PATH },
  });
  expect(out).toMatch(/dry-run find-housing-in-ireland/);
  expect(out).not.toMatch(/BLOG_PUBLISH_TOKEN/);
});

test("keeps hash marks inside tags", () => {
  const text = post().replace(
    "tags: [pps, \"first-90-days\", ireland]",
    'tags: ["#Irish CV", "jobs in Ireland"]'
  );
  const { errors, post: parsed } = parsePostText(text, "how-to-get-a-pps-number");
  expect(errors).toEqual([]);
  expect(parsed.tags).toEqual(["#Irish CV", "jobs in Ireland"]);
});
