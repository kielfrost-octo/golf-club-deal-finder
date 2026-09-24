# Octopus Runbooks — reference notes

These aren't executable by Octopus directly (Octopus runbooks/deployment processes are
configured in the Octopus UI/API), but they document the exact commands each step should run,
so the Octopus process can be rebuilt or audited from source control.

## Deploy Worker (Production only)

Runs only when deploying to the `Production` environment — skipped for `PR-*` environments,
since all environments share the one Worker (`golf-club-finder.kiel-frost.workers.dev`).

```bash
cd worker
npm ci

# wrangler.toml's ALLOWED_ORIGINS is substituted by Octopus's variable
# replacement feature before this step runs, using #{Site.AllowedOrigins}.

npx wrangler deploy \
  --var ALLOWED_ORIGINS:"#{Site.AllowedOrigins}"

echo "#{eBay.ClientId}" | npx wrangler secret put EBAY_CLIENT_ID
echo "#{eBay.ClientSecret}" | npx wrangler secret put EBAY_CLIENT_SECRET
```

Requires `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` env vars, sourced from Octopus
variables `Cloudflare.ApiToken` / `Cloudflare.AccountId`.

## Deploy static site (every environment)

```bash
# config.js is templated by Octopus (#{Worker.Url}, #{UI.Variant}) before this step.
# Production publishes to the root of the gh-pages branch.
# PR environments publish under /pr-<PrNumber>/.

TARGET_DIR="."
if [ "#{Octopus.Environment.Name}" != "Production" ]; then
  TARGET_DIR="pr-#{PrNumber}"
fi

npx gh-pages -d . -e "$TARGET_DIR" -r "https://github.com/kielfrost-octo/golf-club-deal-finder.git"
```

## Teardown PR Environment (runbook, on PR close)

```bash
# Remove the PR's published subfolder from the gh-pages branch.
git clone --branch gh-pages --single-branch \
  https://github.com/kielfrost-octo/golf-club-deal-finder.git gh-pages-checkout
cd gh-pages-checkout
git rm -rf "pr-#{PrNumber}" || true
git commit -m "Remove preview for PR #{PrNumber}"
git push
```

Octopus then deletes the dynamic `PR-#{PrNumber}` environment via its dynamic-environments
API/CLI as the final step of the same runbook.

## OctoToggle step

Placeholder step: query OctoToggle for flag `golf-results-ui-variant` scoped to the current
Octopus environment, and set the output variable consumed by the `config.js` template as
`#{UI.Variant}`. Confirm the exact call (API step vs. variable-set sync) against the installed
OctoToggle integration before wiring this in Octopus.
