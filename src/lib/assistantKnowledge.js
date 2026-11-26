// Free, on-device "brain" for the EXPal assistant. It adds to the server's answer:
// links to the app's own source-checked guides and buttons that open the right EXPal screen.
// It also answers on its own when the server can't be reached. No paid AI service is used.

import { NOT_GOVERNMENT_DISCLAIMER, OFFICIAL_SOURCES } from "./officialSources";

export const FEATURES = [
  {
    id: "scam",
    label: "Check a rental for scams",
    to: "/scam-checker",
    keywords: ["scam", "scammer", "fraud", "fake", "landlord", "deposit", "legit", "genuine", "dolandır", "sahte"],
    blurb: "The rental scam checker looks at a listing or the landlord's messages for the warning signs the Gardaí publish.",
  },
  {
    id: "housing",
    label: "Browse housing",
    to: "/housing",
    keywords: ["housing", "house", "flat", "apartment", "room", "rent", "rental", "accommodation", "ev", "kira"],
    blurb: "The Housing section has expat-friendly listings you can filter.",
  },
  {
    id: "jobs",
    label: "Open the job tracker",
    to: "/job-tracker",
    keywords: ["job", "jobs", "application", "applications", "interview", "cv", "career", "tracker", "iş", "başvuru"],
    blurb: "The job tracker keeps your applications, stages and next actions in one place.",
  },
  {
    id: "referrals",
    label: "See job referrals",
    to: "/referrals",
    keywords: ["referral", "referrals", "refer", "introduction", "network", "networking"],
    blurb: "Referrals lets members ask for and offer introductions at companies in Ireland.",
  },
  {
    id: "residency",
    label: "Open my residency clock",
    to: "/journey",
    keywords: ["residency", "citizenship", "naturalisation", "naturalization", "reckonable", "days", "stamp 4", "clock", "vatandaşlık"],
    blurb: "Your Journey tab tracks your residency days towards citizenship eligibility.",
  },
  {
    id: "events",
    label: "Find events",
    to: "/community?tab=Events",
    keywords: ["event", "events", "meetup", "meet", "friends", "lonely", "people", "social", "etkinlik"],
    blurb: "Community events are a quick way to meet other newcomers.",
  },
  {
    id: "community",
    label: "Ask the community",
    to: "/community",
    keywords: ["community", "forum", "question", "advice", "recommend", "recommendation"],
    blurb: "The Community forum is the place to ask people who've been through it.",
  },
  {
    id: "messages",
    label: "Open messages",
    to: "/messages",
    keywords: ["message", "messages", "dm", "chat with", "mesaj"],
    blurb: "You can message other members directly from Messages.",
  },
];

export const SUGGESTIONS = [
  "What should I do first after arriving in Ireland?",
  "How do I get a PPS number?",
  "How do I register my IRP?",
  "Is this rental a scam?",
  "Help me track my job applications",
];

const STOP = new Set(
  "a an and are as at be by can do does for from get got have how i if in is it me my of on or should the to was what when where which who why will with you your ireland irish".split(" ")
);

export function tokenize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9çğıöşü\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP.has(w));
}

export function matchFeatures(query, limit = 2) {
  const q = ` ${String(query || "").toLowerCase()} `;
  const words = new Set(tokenize(query));
  return FEATURES.map((f) => ({
    f,
    score: f.keywords.reduce((s, k) => s + (k.includes(" ") ? (q.includes(` ${k} `) || q.includes(k) ? 2 : 0) : words.has(k) ? 2 : q.includes(k) && k.length > 4 ? 1 : 0), 0),
  }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.f);
}

/** Rank blog guides by how many query words appear in their title, tags, excerpt and headings. */
export function searchGuides(query, posts, limit = 2) {
  const words = tokenize(query);
  if (!words.length || !Array.isArray(posts)) return [];
  return posts
    .map((p) => {
      const title = tokenize(`${p.title} ${p.seoTitle || ""}`);
      const tags = tokenize((p.tags || []).join(" "));
      const meta = tokenize(`${p.excerpt || ""} ${p.category || ""}`);
      const heads = tokenize((String(p.body || "").match(/^#{2,3}\s+.*$/gm) || []).join(" "));
      let score = 0;
      for (const w of words) {
        if (title.includes(w)) score += 3;
        if (tags.includes(w)) score += 2;
        if (heads.includes(w)) score += 1;
        if (meta.includes(w)) score += 1;
      }
      return { p, score };
    })
    .filter((x) => x.score >= 3)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => ({ title: x.p.title, slug: x.p.slug, excerpt: x.p.excerpt }));
}

const FIRST_STEPS = /(first|start|arriv|new to|just moved|landed|where do i begin|what (do|should) i do)/i;

export function firstStepsAnswer() {
  return [
    "Here's a sensible order for your first weeks in Ireland:",
    "- **Register your immigration permission (IRP)** if you're from outside the EU, UK or Switzerland. You must register within 90 days of arriving, so book early.",
    "- **Get a PPS number** once you have a reason, such as a job offer.",
    "- **Open a bank account and set up tax** with Revenue so you're not put on emergency tax.",
    "- **Register with a GP** and sort out somewhere longer-term to live.",
    "Our guides below walk through each step. EXPal is not the government.",
    NOT_GOVERNMENT_DISCLAIMER,
    ...OFFICIAL_SOURCES.map((source) => `- ${source.label}: ${source.href}`),
  ].join("\n");
}

/** Answer built only from on-device knowledge (used when the server is unavailable). */
export function localAnswer(query, posts) {
  const features = matchFeatures(query);
  const guides = searchGuides(query, posts);
  let text;
  if (FIRST_STEPS.test(query)) text = firstStepsAnswer();
  else if (features.length) text = features.map((f) => f.blurb).join(" ");
  else if (guides.length) text = "These EXPal guides cover that, with links to the official sources:";
  else
    text =
      "I couldn't find an answer to that in EXPal's guides yet. Try asking about PPS numbers, IRP registration, housing, jobs or rental scams, or post your question in the Community forum.";
  return { text, actions: features.map(({ label, to }) => ({ label, to })), guides: guides.length ? guides : FIRST_STEPS.test(query) ? searchGuides("pps irp register immigration number", posts) : [] };
}

/** Extras shown under the server's reply: matching guides and feature buttons (deduplicated). */
export function enrichReply(query, reply, posts) {
  const features = matchFeatures(`${query}`);
  const replyText = String(reply || "").toLowerCase();
  const guides = searchGuides(query, posts).filter((g) => !replyText.includes(`/blog/${g.slug}`));
  return { actions: features.map(({ label, to }) => ({ label, to })), guides };
}
