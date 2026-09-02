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

mkdir -p "$scratch/wordpress-tests-lib/includes"
printf '%s\n' '<?php' \
  '$GLOBALS["plugtestkit_filters"] = [];' \
  'function tests_add_filter($hook, $callback): void { $GLOBALS["plugtestkit_filters"][$hook][] = $callback; }' \
  > "$scratch/wordpress-tests-lib/includes/functions.php"
printf '%s\n' '<?php' \
  'define("ABSPATH", __DIR__ . "/wordpress/");' \
  'class WP_UnitTestCase extends PHPUnit\Framework\TestCase {}' \
  'function do_action($hook): void { foreach ($GLOBALS["plugtestkit_filters"][$hook] ?? [] as $callback) { $callback(); } }' \
  'do_action("muplugins_loaded");' \
  > "$scratch/wordpress-tests-lib/includes/bootstrap.php"
WP_TESTS_DIR="$scratch/wordpress-tests-lib" composer test --working-dir "$scratch/harness"

echo "generated harness smoke passed"
