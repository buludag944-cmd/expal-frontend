# Weekly blog publishing: how it works

```
Claude (Mondays)          Cursor / Bahar               GitHub                        Netlify
content pack doc   →  content/blog/<slug>.md  →  Blog check (links, sources)  →  merge to main
                       publishDate = next Monday                                     │
                                                  Blog weekly publish (Mon 07:30 UTC) ─┴→ rebuild → article live
```

1. **Every Monday,** Claude's scheduled task writes the "EXPal content pack" doc with 2 researched SEO articles, fact-checked against official Irish sources.
2. **Cursor (or Bahar)** adds each article as `content/blog/<slug>.md` using `_TEMPLATE.md`, with `publishDate` set to the next free Mondays. This keeps 2–4 weeks of articles queued.
3. **The Blog check** runs on the pull request. It rejects missing official sources, broken links, bad SEO fields and stale reviews. Merge when it is green.
4. **The Blog weekly publish** rebuilds the site every Monday morning, and that week's article goes live. If a link breaks, an article needs re-review, or the queue drops below 2, it opens a GitHub issue labelled `blog`.

## Instructions for Cursor (copy into a weekly prompt)

> Read `content/blog/README.md`. Take the two articles from this week's Claude content pack (pasted below).
> For each: create `content/blog/<slug>.md` from `_TEMPLATE.md`, convert the formatting to the supported subset,
> keep every source link, and set `publishDate` to the next Mondays that don't already have an article
> (check existing files). Run `npm run blog:check` and fix anything it reports, but never change a fact without
> checking the official source. Open one pull request titled "Blog: <titles>". Don't merge.

## One-time setup

- **Netlify build hook:** Netlify → expalapp → Site configuration → Build & deploy → Build hooks → Add (branch `main`). Save the URL as the GitHub secret `NETLIFY_BUILD_HOOK` (Settings → Secrets and variables → Actions).
- **Google Search Console (free):** add https://expalapp.netlify.app and submit `https://expalapp.netlify.app/sitemap.xml`, so Google finds every new article quickly.
