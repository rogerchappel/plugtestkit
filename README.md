# plugtestkit

Local-first WordPress plugin test harness generator with PHPUnit, PHPCS, and CI templates for maintainers.

plugtestkit helps a maintainer or coding agent inspect a plugin fixture, validate a practical PHP/WordPress matrix, and generate a starter test harness without network calls or publishing side effects.

The personality is intentionally calm and slightly stubborn: inspect first, generate deterministic files, leave dependency installs and external systems to the human. It is scaffolding with receipts, not magic.

## Status

Early MVP. The generated files are intended as reviewable starting points, not a complete WordPress integration environment.

## Install

```sh
npm install -g https://github.com/rogerchappel/plugtestkit/releases/download/v0.1.0/plugtestkit-0.1.0.tgz
```

The package is distributed as a versioned npm-compatible tarball on the
[GitHub releases page](https://github.com/rogerchappel/plugtestkit/releases).
It is not currently published to the public npm registry.

For local development from this repository:

```sh
npm install
node bin/plugtestkit.js --help
node bin/plugtestkit.js --version
```

## Quickstart

Inspect a plugin fixture:

```sh
plugtestkit inspect fixtures/sample-plugin
```

Write JSON for an agent or CI step:

```sh
plugtestkit inspect fixtures/sample-plugin --json --output out/report.json
```

Focus only on the PHP/WordPress test matrix:

```sh
plugtestkit matrix fixtures/sample-plugin --json
```

Generate a harness into an explicit directory:

```sh
plugtestkit scaffold fixtures/sample-plugin --output out/harness
```

Dry-run the scaffold plan:

```sh
plugtestkit scaffold fixtures/sample-plugin --dry-run
```

Use the JavaScript API in a local automation script:

```js
import { inspectPlugin, planScaffold } from 'plugtestkit';

const inspection = await inspectPlugin('fixtures/sample-plugin');
const plan = await planScaffold('fixtures/sample-plugin');

console.log(inspection.ok, plan.files.map((file) => file.path));
```

## What it generates

- `composer.json` with PHPUnit and WordPress Coding Standards dev dependencies.
- `phpunit.xml.dist`.
- `phpcs.xml.dist`.
- `tests/bootstrap.php`.
- `tests/PluginSmokeTest.php`.
- `.github/workflows/plugin-tests.yml` with MySQL and a provisioned WordPress test suite for every PHP/WordPress matrix entry.

## Safety boundaries

plugtestkit is deliberately boring and local:

- Reads only the plugin directory you pass in.
- Writes only to explicit `--output` paths.
- Performs no network calls, telemetry, credential lookup, package publishing, or WordPress.org API calls.
- Leaves dependency installation to you.

See [docs/SAFETY.md](docs/SAFETY.md) for details.

## Documentation

- [CLI reference](docs/CLI.md)
- [JavaScript API](docs/API.md)
- [Generated templates](docs/TEMPLATES.md)
- [Examples](examples/scaffold.md)
- [Product requirements](docs/PRD.md)

## Verify

```sh
npm test
npm run check
npm run build
npm run smoke
bash scripts/validate.sh
```

## Attribution

This project was inspired by the existence of `wordpress-test-template` style tooling and the public repo signal documented in [docs/PRD.md](docs/PRD.md). It is a fresh implementation with a local-first scope and does not copy that project's name or implementation.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Small, fixture-backed changes are preferred.

## Security

See [SECURITY.md](SECURITY.md). Please do not post vulnerability details in public issues.

## License

MIT

## Release Readiness

Use the checked-in scripts before opening or publishing a release:

```sh
npm run check
npm test
npm run build
npm run smoke
npm run package:smoke
npm run release:check
```

The package smoke creates the npm tarball without publishing, verifies its
package identity and required files, installs it into a temporary directory,
and runs the installed CLI's `--help` and `--version` commands.

## Development

Run the same local checks that protect the package before opening a release or pull request:

- `npm run build`
- `npm test`
- `npm run check`
- `npm run smoke`
- `npm run package:smoke`
- `npm run release:check`
