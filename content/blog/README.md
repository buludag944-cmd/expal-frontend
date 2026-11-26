# EXPal blog articles

Every file in this folder (except `README.md` and files starting with `_`) is one blog article.
An article goes live automatically on its `publishDate`: every Monday the **Blog weekly publish**
GitHub Action rebuilds the site, and articles whose date has arrived appear on
https://expalapp.netlify.app/blog with a generated cover image, a crawlable page and a sitemap entry.

## Add an article

1. Copy `_TEMPLATE.md` to `<slug>.md` (the file name must match `slug`).
2. Fill in every field at the top. Set `publishDate` to the next free Monday, so one article goes live each week.
3. Write the article with the supported formatting: `##` and `###` headings, `- ` bullets, `1. ` numbered steps, `**bold**`, `[links](https://...)`.
4. Include a `## Sources` section that links at least one **official** page (gov.ie, irishimmigration.ie, citizensinformation.ie, revenue.ie, hse.ie, …).
5. Open a pull request. The **Blog check** runs automatically and opens every link. Download the `blog-covers` artifact from the check to preview the cover image.
6. Merge. The article goes live on its `publishDate` (or on the next deploy if the date has passed).

**From a phone:** GitHub → this folder → Add file → Create new file → paste → "Commit to a new branch" → Create pull request.

## Rules

- **Facts:** every fee, deadline, office address and rule must come from the official source linked in `## Sources`. Never from memory.
- **`lastReviewed`:** the date someone last checked the facts against the sources. It must be within 60 days of `publishDate`. The weekly check flags articles older than 180 days for re-review.
- **No invented features:** only mention what EXPal really does today (residency clock, housing, community/events, referrals, job tracker).
- **No personal data:** never include real people's names, documents or photos.
- **Custom image:** add `coverImage: /images/blog/<file>.png` and put the file in `public/images/blog/`. Otherwise a branded cover is generated automatically.
- **Hold an article back:** add `draft: true`.

## Useful commands

```bash
npm run blog:check:offline   # validate articles without opening links
npm run blog:check           # validate and open every link
npm run blog:build           # generate covers + /blog-data/posts.json
npm run test:blog            # unit tests for the blog scripts
```
