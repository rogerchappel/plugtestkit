#!/usr/bin/env bash
set -euo pipefail

if ! command -v composer >/dev/null 2>&1; then
  echo "generated harness smoke requires Composer 2 on PATH" >&2
  exit 1
fi

scratch="$(mktemp -d "${TMPDIR:-/tmp}/plugtestkit-generated-harness.XXXXXX")"
trap 'rm -rf "$scratch"' EXIT

npm pack --silent --pack-destination "$scratch" >/dev/null
npm install --ignore-scripts --no-audit --no-fund --prefix "$scratch/install" "$scratch"/plugtestkit-*.tgz >/dev/null

"$scratch/install/node_modules/.bin/plugtestkit" scaffold fixtures/sample-plugin --output "$scratch/harness"
composer validate --strict --no-check-publish --working-dir "$scratch/harness"
composer install --no-interaction --no-progress --working-dir "$scratch/harness"
composer lint --working-dir "$scratch/harness" -- --version
composer test --working-dir "$scratch/harness" -- --version

echo "generated harness smoke passed"
