# FlashFrame — Modern Web Photobooth

FlashFrame turns your browser camera into a photobooth. Pick 3 or 4 shots, add a
filter and a frame, and download a photostrip PNG — no app install, no account,
no upload. Everything runs on your device.

> _Screenshot: add a landing-page capture here after the UI phase lands
> (e.g. `docs/screenshots/landing.png`)._

## How it works

1. **Start camera** — grant camera access when your browser asks.
2. **Pose** — a short countdown runs before each shot (3 or 5 seconds).
3. **Save your strip** — choose a filter and frame, then download the PNG.

Photobooth flow: `/` (landing) → `/booth` (capture) → `/result` (compose &
download). Privacy details live at `/privacy`.

## Privacy

- On the MVP flow, **photos never leave your device** — there is no backend, no
  database, and no upload.
- Photos are held in the browser tab's memory for the session only.
- Reloading or closing the page discards the session, so download your strip
  before you leave.
- The camera starts only after you choose to start the photobooth, and we never
  request the microphone.

## Tech stack

- **Build**: Vite
- **UI**: React + TypeScript
- **Styling**: Tailwind CSS v4 (CSS-first `@theme` tokens)
- **Routing**: TanStack Router (file-based)
- **Animation**: Motion for React (`motion`)
- **Icons**: `lucide-react`
- **Camera / images**: `navigator.mediaDevices.getUserMedia()` + Canvas 2D
- **Tests**: Vitest + React Testing Library; Playwright (E2E)
- **Lint**: ESLint (flat config) + TypeScript checks
- **Hosting**: Static SPA — Cloudflare Pages, or self-hosted (nginx + Cloudflare Tunnel)

## Requirements

- Node.js 20.19+ / 22.12+ (developed on Node 22)
- npm
- A modern browser with camera support for the booth flow

## Install & run

```bash
npm ci
npm run dev
```

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | Type-check (`tsc -b`) + production build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript project build check |
| `npm test` | Unit/component tests (Vitest) |
| `npm run test:e2e` | End-to-end tests (Playwright) |

## Camera & HTTPS

Camera access requires a **secure context**. `localhost` counts as secure, but
production must be served over **HTTPS** — verify the camera flow on the final
domain, not only in local dev. Browsers also require an explicit user grant;
FlashFrame never starts the camera automatically.

## Deploying to Cloudflare Pages

1. Push this repository to GitHub (production branch `main`).
2. Cloudflare Dashboard → **Workers & Pages** → create a Pages project from the
   repo (preset: React/Vite).
3. Build command: `npm run build`; build output directory: `dist`.
4. Deploy and confirm the `*.pages.dev` URL loads.
5. Verify direct routes `/`, `/booth`, `/result`, `/privacy` (open and refresh).
   Cloudflare Pages serves the SPA automatically for unmatched paths **as long as
   there is no top-level `404.html`** in the build output — this project
   intentionally ships none, and no `_redirects` catch-all.
6. Add a custom domain if needed, wait for TLS/HTTPS, then re-test the camera.
7. Optional security headers ship in `public/_headers`
   (`X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`) — verify
   them on the production preview.

No environment variables or secrets are required for the MVP.

## Live deployment (self-hosted)

Live: **https://angelora.agoyeeee.site**

The production build (`dist/`) is served as a static SPA behind **nginx** (a
name-based vhost on loopback with an SPA `try_files … /index.html` fallback) and
published through a **Cloudflare Tunnel**, so TLS terminates at Cloudflare's
edge. Security headers (`X-Content-Type-Options`, `Referrer-Policy`,
`Permissions-Policy`) are applied by the nginx vhost (the bundled `public/_headers`
file covers the Cloudflare Pages path instead).

To redeploy after a fresh build, publish the new `dist/` to the web root and
reload — no application server or environment variables are involved. Server
host details and credentials are intentionally **not** recorded in this repo.

Cloudflare Pages remains a supported alternative host (see above); its SPA
routing relies on the absence of a top-level `404.html`.

## CI

`.github/workflows/ci.yml` runs on pull requests and pushes to `main`:
`npm ci` → lint → typecheck → test → build. A PR that fails any step is not
release-ready.

## Tested browsers & known limitations

- Supported: current stable Chrome (desktop/Android) and Safari (iOS/macOS),
  with a clear fallback when the camera is unavailable.
- Manual camera QA on real devices and the HTTPS production preview is still
  required (see the PRD go-live checklist).
- MVP has no accounts, cloud gallery, upload, payments, AI filters, or admin.
- Exact tested browser versions and known issues are recorded here at release
  time.
