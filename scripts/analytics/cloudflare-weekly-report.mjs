// Weekly traffic report from Cloudflare Web Analytics (free, cookieless).
// Needs GitHub secrets CLOUDFLARE_API_TOKEN (Account Analytics: Read) and CLOUDFLARE_ACCOUNT_ID.
// Writes reports/traffic/<end-date>.md and reports/traffic/latest.md.
import fs from "node:fs";
import path from "node:path";

const TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const ACCOUNT = process.env.CLOUDFLARE_ACCOUNT_ID;
const HOST = process.env.SITE_HOST || "expalapp.netlify.app";
const DAYS = Number(process.env.REPORT_DAYS || 7);

if (!TOKEN || !ACCOUNT) {
  console.error("Missing CLOUDFLARE_API_TOKEN or CLOUDFLARE_ACCOUNT_ID secret. See the workflow file for setup.");
  process.exit(1);
}

const iso = (d) => d.toISOString().slice(0, 10);
const end = new Date(Date.now() - 864e5); // yesterday (full day)
const start = new Date(end.getTime() - (DAYS - 1) * 864e5);
const prevEnd = new Date(start.getTime() - 864e5);
const prevStart = new Date(prevEnd.getTime() - (DAYS - 1) * 864e5);

const group = (alias, dims, from, to, limit = 15) => `
      ${alias}: rumPageloadEventsAdaptiveGroups(
        limit: ${limit}
        filter: { date_geq: "${iso(from)}", date_leq: "${iso(to)}", requestHost: "${HOST}" }
        orderBy: [count_DESC]
      ) {
        count
        sum { visits }
        ${dims ? `dimensions { ${dims} }` : ""}
      }`;

// One request per section, so a single unsupported field can't break the whole report.
const sections = {
  total: ["", start, end, 1],
  previous: ["", prevStart, prevEnd, 1],
  byDay: ["date", start, end, 31],
  pages: ["requestPath", start, end, 15],
  referrers: ["refererHost", start, end, 15],
  countries: ["countryName", start, end, 10],
  devices: ["deviceType", start, end, 5],
};

async function run(alias, [dims, from, to, limit]) {
  const query = `query { viewer { accounts(filter: { accountTag: "${ACCOUNT}" }) { ${group(alias, dims, from, to, limit)} } } }`;
  try {
    const res = await fetch("https://api.cloudflare.com/client/v4/graphql", {
      method: "POST",
      headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.errors?.length) {
      return { error: `${res.status} ${(json.errors || []).map((e) => e.message).join("; ") || "request failed"}` };
    }
    const acc = json.data?.viewer?.accounts?.[0];
    if (!acc) return { error: "no account data (check CLOUDFLARE_ACCOUNT_ID and token permission)" };
    return { rows: acc[alias] || [] };
  } catch (e) {
    return { error: e.message };
  }
}

const acc = {};
const errors = {};
for (const [alias, spec] of Object.entries(sections)) {
  const r = await run(alias, spec);
  if (r.error) errors[alias] = r.error;
  else acc[alias] = r.rows;
}
if (errors.total) {
  console.error("Cloudflare API error:", errors.total);
  process.exit(1);
}

const views = (rows) => rows?.[0]?.count || 0;
const visits = (rows) => rows?.[0]?.sum?.visits || 0;
const pct = (now, before) => (before ? `${now >= before ? "+" : ""}${Math.round(((now - before) / before) * 100)}%` : "new");
const table = (rows, key, label, alias) => {
  if (errors[alias]) return `_Not available: ${errors[alias]}_\n`;
  if (!rows?.length) return "_No data yet._\n";
  const lines = [`| ${label} | Page views | Visits |`, "| --- | ---: | ---: |"];
  for (const r of rows) lines.push(`| ${r.dimensions?.[key] || "(direct / none)"} | ${r.count} | ${r.sum?.visits ?? 0} |`);
  return lines.join("\n") + "\n";
};

const md = `# EXPal website traffic: ${iso(start)} to ${iso(end)}

Source: Cloudflare Web Analytics for ${HOST} (cookieless; ad-blockers are not counted).

## Summary

- **Page views:** ${views(acc.total)} (${pct(views(acc.total), views(acc.previous))} vs previous ${DAYS} days)
- **Visits:** ${visits(acc.total)} (${pct(visits(acc.total), visits(acc.previous))} vs previous ${DAYS} days)

## By day

${table([...(acc.byDay || [])].sort((a, b) => a.dimensions.date.localeCompare(b.dimensions.date)), "date", "Date", "byDay")}
## Top pages

${table(acc.pages, "requestPath", "Page", "pages")}
## Where visitors came from

${table(acc.referrers, "refererHost", "Referrer", "referrers")}
## Countries

${table(acc.countries, "countryName", "Country", "countries")}
## Devices

${table(acc.devices, "deviceType", "Device", "devices")}`;

const dir = path.join("reports", "traffic");
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, `${iso(end)}.md`), md);
fs.writeFileSync(path.join(dir, "latest.md"), md);
console.log(md);
