# Production deployment (EXPal SPA)

**Live site:** https://expalapp.netlify.app  
**API:** https://expalapp-1.onrender.com (set in `.env.production` as `REACT_APP_API_URL`)

Deploy the static build from this folder. All routing is client-side (React Router), including `/onboarding`, `/journey`, `/community`, and `/explore`.

## Workflow (in order)

1. **Set** `REACT_APP_API_URL` in `.env.production` (fully qualified HTTPS URL).
2. **Build:** `cd frontend && npm run build`
3. **Deploy** the contents of `frontend/build/` to your HTTPS host.
4. **Enable SPA fallback** so unknown paths serve `index.html` (see below).

## 1. Production env (before build)

Create React App **inlines env at build time**. Set these in **Netlify → Site configuration → Environment variables** (for Git deploys) or in `.env.production` (for local `npm run build` + drag-and-drop).

```env
REACT_APP_API_URL=https://expalapp-1.onrender.com

# Required for “Continue with Google” on the Login screen
REACT_APP_FIREBASE_API_KEY=...
REACT_APP_FIREBASE_AUTH_DOMAIN=expalapp-a6422.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=expalapp-a6422
REACT_APP_FIREBASE_APP_ID=...
```

Copy Firebase Web values from [Firebase Console](https://console.firebase.google.com) → **expalapp-a6422** → Project settings → Your apps → **Web** (`</>`). If there is no Web app yet, click **Add app** → Web.

**Import from a file:** use `frontend/.env.netlify` (local, gitignored) or copy `netlify.env.import.example` → `.env.netlify`, fill secrets, then in Netlify: **Site configuration → Environment variables → Import from a .env file** → choose that file → confirm → **Clear cache and deploy**.

After changing env on Netlify, trigger **Deploys → Trigger deploy → Clear cache and deploy site**.

**Login screen only:** the Google button appears on **Login**, not **Sign Up** (link at the bottom switches tabs).

**If the button is missing after deploy:** the live JS bundle may be an old build. Open DevTools → Network → `main.*.js` → search for `Continue with Google`. If it is not there, redeploy from the latest repo (see §3) — do not re-upload an old `build/` folder.

## 2. Build

```bash
cd frontend
npm run build
```

**Logo on Netlify:** The header/login logo is bundled from `src/assets/expal-logo.png` (content-hashed filename). After changing the logo, run `npm run logo:apply` on a Mac, then **commit and push**:

- `src/assets/expal-logo.png`
- `public/expal-logo.png`, `public/logo192.png`, `public/logo512.png`
- `resources/expal_logo.png` (master)

If you deploy by dragging `build/` to Netlify, run a **fresh** `npm run build` first — do not re-upload an old `build/` folder.

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

Sanity routes after deploy: `/`, `/onboarding`, `/journey`, `/verify/test`, `/reset/test` (must load the app, not a Netlify 404).

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

- Backend **`CLIENT_URL`** = same SPA origin (e.g. `https://expalapp.netlify.app`) for email verify/reset links.
- API reachable at the same host as `REACT_APP_API_URL`, over HTTPS.
- **`FIREBASE_SERVICE_ACCOUNT_JSON`** on Render (service account for **expalapp-a6422**, one line) — required for `POST /api/auth/google` after Google sign-in succeeds in the browser.

## 7. Google sign-in (Firebase)

1. **Authentication → Sign-in method** — enable **Google** (support email: `expalappsupport@gmail.com`).
2. **Authentication → Settings → Authorized domains** — add `expalapp.netlify.app` and `localhost`.
3. Set all four `REACT_APP_FIREBASE_*` vars on Netlify (§1), then redeploy.
4. On the live site, use the **Login** tab; you should see **or** and **Continue with Google**.

See `SOCIAL_AUTH.md` in the repo root for the full flow.

## Checklist

- [ ] `REACT_APP_API_URL` set on Netlify (or `.env.production`)
- [ ] All four `REACT_APP_FIREBASE_*` set on Netlify, then **clear-cache redeploy**
- [ ] `npm run build` succeeded (Git or local)
- [ ] `build/` deployed over HTTPS (not the whole monorepo — only `frontend/build/`)
- [ ] SPA fallback enabled
- [ ] `/verify/test` and `/reset/test` sanity test passed
- [ ] Firebase authorized domain includes your Netlify hostname
- [ ] Render `FIREBASE_SERVICE_ACCOUNT_JSON` + `CLIENT_URL` updated
