const {
  CLOSING,
  bucketFor,
  cleanBullet,
  collectUpdates,
  renderPost,
  shouldPublish,
  sinceFromNames,
} = require("./whatsNew");

test("runs on even ISO weeks unless forced", () => {
  const monday = new Date("2026-11-23T07:00:00Z");
  const nextMonday = new Date("2026-11-30T07:00:00Z");
  expect(shouldPublish(nextMonday, false)).toBe(!shouldPublish(monday, false));
  expect(shouldPublish(monday, true)).toBe(true);
  expect(shouldPublish(nextMonday, true)).toBe(true);
});

test("sorts pull requests into New, Improved, and Fixed", () => {
  expect(bucketFor("Fix the dark home screen", [])).toBe("Fixed");
  expect(bucketFor("Home screen contrast", [{ name: "bug" }])).toBe("Fixed");
  expect(bucketFor("Add a checklist", [])).toBe("New");
  expect(bucketFor("Make the home screen clearer", [])).toBe("Improved");
});

test("uses only the What changed bullets and drops code, secrets, and docs-only work", () => {
  const groups = collectUpdates([
    {
      title: "Add the first checklist",
      labels: [],
      files: ["src/Home.js", "src/Home.test.js"],
      body: "## What changed\n- Adds a checklist on the home screen.\n- See `src/Home.js`.\n\n## Risk\n- none\n",
    },
    {
      title: "Fix the clock",
      labels: ["bug"],
      files: ["src/Journey.jsx"],
      body: "## What changed\n- The residency clock keeps counting after a refresh.\n- Token is `secret-value`.\n",
    },
    {
      title: "Note the process",
      labels: ["internal"],
      files: ["src/App.js"],
      body: "## What changed\n- Hidden note.\n",
    },
    {
      title: "Update the readme",
      labels: [],
      files: ["README.md", ".github/workflows/publish-blog.yml"],
      body: "## What changed\n- Docs only.\n",
    },
  ]);

  expect(groups.New).toEqual(["Adds a checklist on the home screen."]);
  expect(groups.Fixed).toEqual(["The residency clock keeps counting after a refresh."]);
  expect(groups.Improved).toEqual([]);
  expect(JSON.stringify(groups)).not.toMatch(/Home\.js|secret|Hidden note|Docs only/);
});

test("writes a post that ends with the community line", () => {
  const date = new Date("2026-11-30T07:00:00Z");
  const post = renderPost(
    { New: ["You can save a checklist item."], Improved: [], Fixed: ["The clock stays correct."] },
    date
  );
  expect(post.slug).toBe("whats-new-2026-11-30");
  expect(post.markdown.trim().endsWith(CLOSING)).toBe(true);
  expect(post.markdown).toMatch(/tags: \["product-updates"\]/);
  expect(post.title.length).toBeLessThanOrEqual(80);
});

test("skips the post when nothing user-facing was merged", () => {
  const groups = collectUpdates([
    {
      title: "Adjust CI",
      labels: ["no-changelog"],
      files: ["src/App.js"],
      body: "## What changed\n- Speed up tests.\n",
    },
  ]);
  expect(renderPost(groups, new Date("2026-11-30T07:00:00Z"))).toBeNull();
});

test("looks back 14 days until a what's new file exists", () => {
  const now = new Date("2026-11-30T07:00:00Z");
  expect(sinceFromNames([], now).toISOString()).toBe("2026-11-16T07:00:00.000Z");
  expect(sinceFromNames(["whats-new-2026-11-16.md", "README.md"], now).toISOString()).toBe(
    "2026-11-17T00:00:00.000Z"
  );
});

test("drops a bullet that is only a file path", () => {
  expect(cleanBullet("`src/pages/Journey.jsx`")).toBe("");
  expect(cleanBullet("Opens the blog from the home screen.")).toBe("Opens the blog from the home screen.");
});
