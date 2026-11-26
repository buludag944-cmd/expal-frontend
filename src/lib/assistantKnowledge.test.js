import { enrichReply, localAnswer, matchFeatures, searchGuides } from "./assistantKnowledge";

const posts = [
  { slug: "how-to-get-a-pps-number-in-ireland", title: "How to get a PPS number in Ireland", tags: ["pps", "first-90-days"], excerpt: "MyWelfare", body: "## What is a PPS number?\n## Step 1" },
  { slug: "how-to-register-your-irp-for-the-first-time", title: "How to register your IRP for the first time", tags: ["irp", "immigration"], excerpt: "Burgh Quay", body: "## The fee" },
];

test("finds the right guide", () => {
  expect(searchGuides("how do I get my PPS number?", posts)[0].slug).toBe("how-to-get-a-pps-number-in-ireland");
  expect(searchGuides("register IRP appointment", posts)[0].slug).toBe("how-to-register-your-irp-for-the-first-time");
  expect(searchGuides("best pizza", posts)).toHaveLength(0);
});

test("maps questions to app features", () => {
  expect(matchFeatures("is this landlord a scam?")[0].to).toBe("/scam-checker");
  expect(matchFeatures("track my job applications")[0].to).toBe("/job-tracker");
  expect(matchFeatures("how many days until citizenship")[0].to).toBe("/journey");
});

test("answers on its own when the server is down", () => {
  const a = localAnswer("What should I do first after arriving?", posts);
  expect(a.text).toMatch(/IRP/);
  expect(a.text).toMatch(/not a government organisation/i);
  expect(a.text).toMatch(/https:\/\/www\.gov\.ie\//);
  expect(a.guides.length).toBeGreaterThan(0);
  const none = localAnswer("qwerty zxcv", posts);
  expect(none.text).toMatch(/Community/);
});

test("doesn't repeat a guide the server already linked", () => {
  const r = enrichReply("PPS number", "See /blog/how-to-get-a-pps-number-in-ireland", posts);
  expect(r.guides).toHaveLength(0);
});
