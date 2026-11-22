#!/bin/bash
set -euo pipefail

# Publish the same committed source as GitHub Pages, even when local edits are pending.
cd "$(git rev-parse --show-toplevel)"
# Use the same public checkout setting as the GitHub Pages workflow.
# Stop if the setting cannot be read, so a deployment cannot reopen preview downloads.
if [[ -z "${AISLAND_CREEM_LIVE_CHECKOUT:-}" ]]; then
  AISLAND_CREEM_LIVE_CHECKOUT="$(gh variable get AISLAND_CREEM_LIVE_CHECKOUT)"
fi
: "${AISLAND_CREEM_LIVE_CHECKOUT:?Missing production checkout}"
export AISLAND_CREEM_LIVE_CHECKOUT
git fetch origin main
source_commit="$(git rev-parse origin/main)"
stage="$(mktemp -d)"
trap 'rm -rf "$stage"' EXIT
git archive "$source_commit" | tar -x -C "$stage"
cd "$stage"
npm ci --no-audit --no-fund
npm run build
npm run check
node --input-type=module <<'NODE'
import { readFileSync, writeFileSync } from 'node:fs';
for (const file of ['dist/index.html', 'dist/docs/index.html', 'dist/robots.txt', 'dist/sitemap.xml']) {
  const text = readFileSync(file, 'utf8');
  writeFileSync(file, text.replaceAll('https://calibg.github.io/agent-island/', 'https://aisland.caliyang.cn/'));
}
NODE

CLOUDFLARE_ACCOUNT_ID=45ad8957fbf9355fa9bb4693f34207c7 npx --yes wrangler@4.151.3 pages deploy dist \
  --project-name aisland-caliyang --branch main --commit-hash "$source_commit"
