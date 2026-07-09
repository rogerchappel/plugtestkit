#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

scratch="$(mktemp -d)"
trap 'rm -rf "$scratch"' EXIT

node bin/plugtestkit.js --help > "$scratch/help.txt"
grep -q "plugtestkit" "$scratch/help.txt"

node bin/plugtestkit.js inspect fixtures/sample-plugin --json --output "$scratch/report.json"
node -e "const fs=require('node:fs'); const report=JSON.parse(fs.readFileSync(process.argv[1], 'utf8')); if (!report.ok || report.metadata.name !== 'Sample Fixture Plugin') process.exit(1)" "$scratch/report.json"

node bin/plugtestkit.js matrix fixtures/sample-plugin --json > "$scratch/matrix.json"
node -e "const fs=require('node:fs'); const matrix=JSON.parse(fs.readFileSync(process.argv[1], 'utf8')); if (!matrix.ok || matrix.wordpress.length === 0 || matrix.php.length === 0) process.exit(1)" "$scratch/matrix.json"

node bin/plugtestkit.js scaffold fixtures/sample-plugin --output "$scratch/scaffold"
test -f "$scratch/scaffold/composer.json"
test -f "$scratch/scaffold/phpunit.xml.dist"
test -f "$scratch/scaffold/.github/workflows/plugin-tests.yml"

echo "smoke passed"
