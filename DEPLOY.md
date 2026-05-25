# Production deployment (EXPal SPA)

Deploy the static build from this folder. All routing is client-side (React Router).

## Workflow (in order)

1. **Set** `REACT_APP_API_URL` in `.env.production` (fully qualified HTTPS URL).
2. **Build:** `cd frontend && npm run build`
3. **Deploy** the contents of `frontend/build/` to your HTTPS host.
4. **Enable SPA fallback** so unknown paths serve `index.html` (see below).

## 1. Production API base (before build)

Edit `.env.production` **before** running `npm run build`:

```env
REACT_APP_API_URL=https://api.yourdomain.com
```

Use a fully qualified URL with **`https://`** (or `http://` only for LAN testing). Create React App inlines this at build time — change the env, then rebuild and redeploy.

## 2. Build

```bash
cd frontend
npm run build
```

Artifact: **`frontend/build/`** (`index.html`, `static/`, assets from `public/`, including **`build/.well-known/`** for iOS/Android deep links).

```bash
ls build/index.html build/static
```

Verify the API URL is embedded (optional):

```bash
grep -r "api.yourdomain.com" build/static/js/*.js | head -1
```

## 3. Deploy `build/` to HTTPS

Upload everything under `frontend/build/` to your host (e.g. `https://app.yourdomain.com`):

### Netlify (manual upload)

The deployable site is **`frontend/build/`** after `npm run build` — not a single hand-written HTML file. Create React App outputs `index.html` plus bundled JS/CSS under `static/`.

**Before building:** set your API in `.env.production`:

```env
REACT_APP_API_URL=https://your-real-api.example.com
```

**Build:**

```bash
cd frontend
npm run build
```

**Upload to Netlify:**

1. Open [app.netlify.com/drop](https://app.netlify.com/drop) (or Site settings → Deploys → drag folder).
2. Drag the **`frontend/build`** folder (or select all files inside it: `index.html`, `static/`, `manifest.json`, `.well-known/`, `_redirects`).
3. Netlify serves the site over HTTPS. `public/_redirects` is copied into `build/` so routes like `/verify/:token` work.

**Git-connected deploy (optional):** connect the repo; set **Base directory** to `frontend`, **Build command** `npm run build`, **Publish directory** `build`. `netlify.toml` in `frontend/` applies the same SPA rules.

Sanity routes after deploy: `/verify/test`, `/reset/test` (must load the app, not a Netlify 404).

- **Vercel** — optional; see `vercel.json` if you switch hosts later.
- **Netlify** — [SPA rewrites](https://docs.netlify.com/routing/redirects/rewrites-for-proxies/#history-push-api-and-single-page-apps); default CRA setups usually need no extra config.
- **Cloudflare Pages** — [SPA rendering](https://developers.cloudflare.com/pages/configuration/serving-pages/#single-page-application-spa-rendering) serves `index.html` for unknown routes by default.
- **NGINX / S3+CloudFront** — configure fallback yourself (see §4).

Ensure the backend allows your SPA origin in CORS if you restrict origins in production.

## 4. SPA fallback (required)

**Unknown routes must return `index.html`**, not a host 404. Required for `/verify/:token`, `/reset/:token`, and every other client route.

### NGINX

```nginx
server {
    listen 443 ssl;
    server_name app.yourdomain.com;
    root /var/www/app/build;

    location / {
        try_files $uri /index.html;
    }
}
```

### Managed hosts

Vercel, Netlify, and Cloudflare Pages support SPA fallback by default (links above).

## 5. Sanity test (after deploy)

Open these URLs on your live host (replace domain):

- `https://app.yourdomain.com/verify/test`
- `https://app.yourdomain.com/reset/test`

**Pass:** the server returns `index.html` (not a 404 page from nginx/S3), and React Router shows your verify/reset UI (token may be invalid — that is fine).

**Fail:** blank page or server 404 → fix SPA fallback before shipping email links.

## 6. Backend alignment

- Backend **`CLIENT_URL`** = same SPA origin (e.g. `https://app.yourdomain.com`) for email verify/reset links.
- API reachable at the same host as `REACT_APP_API_URL`, over HTTPS.

## Checklist

- [ ] `REACT_APP_API_URL=https://api.yourdomain.com` in `.env.production`
- [ ] `npm run build` succeeded
- [ ] `build/` deployed over HTTPS
- [ ] SPA fallback enabled
- [ ] `/verify/test` and `/reset/test` sanity test passed
