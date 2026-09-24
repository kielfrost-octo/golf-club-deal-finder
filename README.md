# Golf Club Deal Finder

Static HTML/CSS/JS site (no frameworks, no build step) that searches eBay for golf club deals via
a Cloudflare Worker proxy. Built primarily to dogfood Octopus Deploy: GitHub Actions-triggered
releases (GHWA), ephemeral per-PR environments, the OctoToggle feature flag, and Octopus
variables.

## Layout

- `index.html`, `styles.css`, `app.js`, `api.js`, `render.js`, `config.js` — the static site.
  `config.js` is templated per environment by Octopus (Worker URL, UI variant).
- `worker/` — Cloudflare Worker (`src/index.js`) that handles eBay OAuth (Client Credentials) and
  proxies the Browse API. Deployed once, shared across all environments
  (`golf-club-finder.kiel-frost.workers.dev`).
- `.github/workflows/` — GHWA workflows: `deploy.yml` (push to `main` → Production release) and
  `pr-environment.yml` (PR open/close → ephemeral environment create/teardown).
- `octopus/runbooks/README.md` — reference notes for the commands each Octopus runbook step runs.

## Local development

```bash
cd worker
npm install
npx wrangler dev
```

Point `config.js`'s `WORKER_URL` at `http://localhost:8787`, then open `index.html` (e.g. via
`npx serve .`) and search for a club type.

## Prerequisites

- eBay Client ID/Secret for Client Credentials OAuth (pending approval as of project start —
  required before the Worker can return real results).
- Cloudflare API token + account ID (for Octopus to run `wrangler deploy`).
- Octopus project with variable set (`eBay.ClientId`, `eBay.ClientSecret`, `Cloudflare.ApiToken`,
  `Cloudflare.AccountId`, `Site.AllowedOrigins`, `UI.Variant`) and the OctoToggle integration
  configured for the `golf-results-ui-variant` flag.
