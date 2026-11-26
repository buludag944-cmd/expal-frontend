# Add a blog post from your phone

1. Open the `content/blog` folder on GitHub.
2. Tap **Add file**, then **Create new file**.
3. Name the file with the web address you want, for example `how-to-get-a-pps-number.md`. Use lowercase words and hyphens. No spaces.
4. Copy the top of an existing post (the lines between the two `---`) and change it. Then paste the article underneath.
5. Tap **Commit changes**. Choose **Create a new branch for this commit and start a pull request**.
6. Merge the pull request. A few minutes later the post is on `https://expalapp.netlify.app/blog/` plus the file name (without `.md`).

The check that runs on the pull request will stop the merge if:

- the title is longer than 80 characters
- the Google description (`seoDescription`) is longer than 160 characters
- the file name does not match the `slug` line
- the article text is empty

## One-time setup

In this GitHub repo, open **Settings → Secrets and variables → Actions** and add:

- `BLOG_PUBLISH_TOKEN` — the same long random string you saved on Render
- `API_URL` — `https://expalapp-1.onrender.com`

Leave the token out of the post and out of git. Render also needs `BLOG_PUBLISH_TOKEN` before publishing can succeed. That API change is a separate pull request.
