// Rental scam checker: scores a listing/conversation for the warning signs published by
// An Garda Síochána (GNECB accommodation fraud warnings) and the CCPC.
// It looks at the listing and the landlord's behaviour, never at a person's identity:
// a name search can't tell a scammer from an innocent namesake, and scammers often use real
// people's names. Runs entirely on the device; nothing typed here is sent anywhere.

export const QUESTIONS = [
  {
    id: "viewed",
    label: "Have you (or someone you trust) viewed the property in person?",
    options: [
      { value: "yes", label: "Yes" },
      { value: "scheduled", label: "Not yet, but a viewing is booked" },
      { value: "no", label: "No, they can't show it" },
    ],
  },
  {
    id: "payBeforeViewing",
    label: "Are they asking for a deposit or rent before you've viewed it or signed a lease?",
    options: [
      { value: "no", label: "No" },
      { value: "yes", label: "Yes" },
    ],
  },
  {
    id: "payment",
    label: "How do they want to be paid?",
    options: [
      { value: "bank", label: "Bank transfer to an Irish account, after signing" },
      { value: "cash", label: "Cash" },
      { value: "transfer", label: "Money transfer service, Revolut or crypto" },
      { value: "unknown", label: "Not discussed yet" },
    ],
  },
  {
    id: "price",
    label: "How does the rent compare with similar places in the area?",
    options: [
      { value: "normal", label: "About the same" },
      { value: "cheap", label: "Noticeably cheaper" },
      { value: "unsure", label: "I'm not sure" },
    ],
  },
  {
    id: "contact",
    label: "How are you talking to them?",
    options: [
      { value: "agent", label: "Through a letting agent or a known listings site" },
      { value: "social", label: "Only via social media, WhatsApp or Messenger" },
      { value: "phone", label: "Phone and email" },
    ],
  },
  {
    id: "urgency",
    label: "Are they rushing you (\"lots of people interested\", \"pay today to secure it\")?",
    options: [
      { value: "no", label: "No" },
      { value: "yes", label: "Yes" },
    ],
  },
  {
    id: "abroad",
    label: "Does the landlord say they're abroad and will post the keys?",
    options: [
      { value: "no", label: "No" },
      { value: "yes", label: "Yes" },
    ],
  },
  {
    id: "noQuestions",
    label: "Have they offered it to you without asking anything about you (references, ID at signing)?",
    options: [
      { value: "no", label: "No, they asked normal questions" },
      { value: "yes", label: "Yes, no questions at all" },
    ],
  },
  {
    id: "idEarly",
    label: "Are they asking for copies of your passport or bank details before any viewing?",
    options: [
      { value: "no", label: "No" },
      { value: "yes", label: "Yes" },
    ],
  },
];

// Weighted signals from answers. weight: 3 = strong, 2 = medium, 1 = mild.
const ANSWER_FLAGS = {
  viewed: {
    no: { group: "viewing", weight: 3, title: "No in-person viewing", detail: "The Gardaí list a landlord who can't meet you to show the property as a key warning sign. Never pay for a place you haven't seen." },
  },
  payBeforeViewing: {
    yes: { group: "upfront", weight: 3, title: "Payment before viewing or signing", detail: "Being asked to pay before seeing the property or signing a lease is one of the most common accommodation fraud patterns." },
  },
  payment: {
    cash: { group: "method", weight: 2, title: "Cash payment", detail: "The Gardaí advise against handing over cash. If you pay, use a traceable method and get a proper receipt." },
    transfer: { group: "method", weight: 3, title: "Hard-to-trace payment method", detail: "The Gardaí warn about payment by money transfer services, Revolut or cryptocurrency, because these payments are hard to reverse." },
  },
  price: {
    cheap: { weight: 2, title: "Rent looks too good to be true", detail: "In the Gardaí's words, if the rent seems too good to be true it probably is, especially in cities." },
    unsure: { weight: 0, title: "", detail: "" },
  },
  contact: {
    social: { group: "chat", weight: 2, title: "Only social media or chat apps", detail: "The Gardaí flag listings advertised only on social media, or landlords who only talk through WhatsApp or Messenger." },
  },
  urgency: {
    yes: { group: "urgency", weight: 2, title: "Pressure to pay quickly", detail: "A sense of urgency to secure the place with a deposit is a listed warning sign. A real landlord will let you view and decide." },
  },
  abroad: {
    yes: { group: "abroad", weight: 3, title: "Landlord abroad, keys by post", detail: "\"I'm overseas, pay first and I'll post the keys\" is a classic scam story. You can't check the property or the keys work." },
  },
  noQuestions: {
    yes: { weight: 2, title: "No questions asked about you", detail: "The CCPC notes that real landlords want references before renting. An offer with no questions at all is a warning sign." },
  },
  idEarly: {
    yes: { group: "docs", weight: 2, title: "Your documents requested early", detail: "Sending passport copies or bank details before viewing can expose you to identity fraud. Share documents only when signing, in person." },
  },
};

// Phrases found in the pasted listing or messages.
const TEXT_PATTERNS = [
  { group: "method", re: /western\s*union|moneygram|ria\s+money|world\s*remit/i, weight: 3, title: "Mentions a money transfer service", detail: "Payment through money transfer services is hard to trace or reverse." },
  { group: "method", re: /\b(bitcoin|btc|crypto|usdt|ethereum)\b/i, weight: 3, title: "Mentions cryptocurrency", detail: "The Gardaí warn about rental payments in cryptocurrency." },
  { re: /gift\s*card|itunes|steam\s*card/i, weight: 3, title: "Mentions gift cards", detail: "No genuine landlord asks for rent in gift cards." },
  { group: "abroad", re: /(abroad|overseas|out of the country|working away|missionary|on an oil rig)/i, weight: 2, title: "Landlord says they're away", detail: "Being away and unable to show the property is a common scam story." },
  { re: /(post|send|courier|mail)\s+(you\s+)?the\s+keys|keys\s+(by|via)\s+(post|courier|mail)/i, weight: 3, title: "Keys sent by post", detail: "You can't check the property, or that the keys work, before paying." },
  { group: "viewing", re: /(no|can'?t|cannot|unable to)\s+(do\s+)?(a\s+)?view(ing)?s?|viewing\s+(is\s+)?not\s+possible/i, weight: 3, title: "No viewing possible", detail: "Never pay for a property you can't view in person." },
  { group: "urgency", re: /(lots of|many|several|other)\s+(people|interest|applicants|enquiries)|first come|today only|secure it (now|today)|urgent(ly)?/i, weight: 2, title: "Pressure language", detail: "Urgency is used to stop you checking details." },
  { group: "upfront", re: /(deposit|first month'?s? rent|holding fee|reservation fee).{0,60}(before|to secure|to hold|in advance)/i, weight: 2, title: "Deposit requested up front", detail: "Pay nothing until you've viewed the property and signed a written lease." },
  { re: /airbnb|booking\.com/i, weight: 1, title: "Mentions a booking platform", detail: "Scammers sometimes send fake booking-site payment links. Only pay inside the real site, never via a link in a message." },
  { group: "chat", re: /whatsapp|telegram|messenger|signal/i, weight: 1, title: "Moves the chat to a messaging app", detail: "Insist on details you can check: a full address, Eircode and a landlord or agent you can verify." },
  { group: "docs", re: /(passport|bank statement|payslip|pps).{0,40}(before|first|now|send)/i, weight: 2, title: "Asks for your documents early", detail: "Share personal documents only at signing, in person." },
];

export function analyzeListing({ text = "", answers = {} } = {}) {
  const flags = [];
  for (const [id, value] of Object.entries(answers)) {
    const flag = ANSWER_FLAGS[id]?.[value];
    if (flag && flag.weight > 0) flags.push({ ...flag, source: "answer", id: `${id}:${value}` });
  }
  // One warning per topic: if an answer already covers it, the matching text pattern isn't repeated.
  const seen = new Set(flags.map((f) => f.group || f.title));
  for (const p of TEXT_PATTERNS) {
    const key = p.group || p.title;
    if (p.re.test(text) && !seen.has(key)) {
      flags.push({ weight: p.weight, title: p.title, detail: p.detail, group: p.group, source: "text", id: p.title });
      seen.add(key);
    }
  }
  flags.sort((a, b) => b.weight - a.weight);

  const score = flags.reduce((sum, f) => sum + f.weight, 0);
  const strong = flags.filter((f) => f.weight >= 3).length;
  let level = "low";
  if (strong >= 1 || score >= 5) level = "high";
  else if (score >= 2) level = "medium";

  const answered = Object.keys(answers).length;
  return { level, score, flags, answered, complete: answered >= QUESTIONS.length || text.trim().length > 40 };
}

export const LEVEL_COPY = {
  high: {
    label: "High risk",
    summary: "This shows strong signs of a rental scam. Don't send any money or documents until every warning below is resolved.",
  },
  medium: {
    label: "Be careful",
    summary: "There are some warning signs. Verify the property and the landlord before you pay anything.",
  },
  low: {
    label: "No major warning signs found",
    summary: "That's a good sign, but no checker can prove a listing is genuine. Still follow the safety steps below.",
  },
};

export const SAFETY_STEPS = [
  { title: "View it in person", detail: "Or send someone you trust. Check that the keys work and the person showing it really controls the property." },
  { title: "Pay only after signing a lease", detail: "Use a traceable bank transfer, never cash, crypto or money transfer services, and always get a receipt." },
  {
    title: "Check the address exists",
    detail: "Look up the Eircode and check the street on a map. Run a reverse image search on the photos to see if they appear in other adverts.",
  },
  {
    title: "Search the RTB register",
    detail:
      "Landlords must register tenancies with the Residential Tenancies Board. The public register only lists current tenancies, so a place between tenants may not appear. Treat it as one clue, not proof.",
    href: "https://www.rtb.ie/check/index.html",
    linkLabel: "Open the RTB register",
  },
  {
    title: "Report it",
    detail: "If you think it's a scam or you've paid, keep all messages and receipts, contact your bank straight away and report it at any Garda station.",
    href: "https://www.garda.ie/en/contact-us/station-directory/",
    linkLabel: "Find a Garda station",
  },
];

export const SOURCES = [
  {
    label: "An Garda Síochána — accommodation fraud warning",
    href: "https://www.garda.ie/en/about-us/our-departments/office-of-corporate-communications/press-releases/2025/august/an-garda-siochana-student-accommodation-fraud-warning-august-2025.html",
  },
  { label: "CCPC — rental accommodation scams", href: "https://www.ccpc.ie/consumers/housing/rental-accommodation-scams/" },
  { label: "RTB — tenancy registration check", href: "https://www.rtb.ie/check/index.html" },
];


// One-tap online checks. They look for traces of the scam (copied adverts, reports about a
// phone number, reused photos), not for information about a person.
export function advertSearchUrl(text) {
  const words = String(text || "")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[^\p{L}\p{N}'’ ]+/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
  if (words.length < 6) return null;
  // A distinctive run of words from the middle of the advert, searched as an exact phrase.
  const start = Math.min(Math.max(0, Math.floor(words.length / 3)), Math.max(0, words.length - 10));
  const phrase = words.slice(start, start + 10).join(" ");
  return `https://www.google.com/search?q=${encodeURIComponent(`"${phrase}"`)}`;
}

export function normalisePhone(raw) {
  const digits = String(raw || "").replace(/[^\d+]/g, "");
  return digits.replace(/(?!^)\+/g, "");
}

export function phoneReportSearchUrl(raw) {
  const phone = normalisePhone(raw);
  const digitCount = phone.replace(/\D/g, "").length;
  if (digitCount < 7 || digitCount > 15) return null;
  const variants = new Set([phone]);
  if (phone.startsWith("+353")) variants.add(`0${phone.slice(4)}`);
  else if (phone.startsWith("0")) variants.add(`+353${phone.slice(1)}`);
  const numbers = [...variants].map((v) => `"${v}"`).join(" OR ");
  return `https://www.google.com/search?q=${encodeURIComponent(`(${numbers}) (scam OR fraud OR fake OR scammer)`)}`;
}

export const PHOTO_CHECK_URL = "https://lens.google.com/";
