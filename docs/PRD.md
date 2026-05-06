# plugtestkit PRD

Status: MVP implemented
Decision: ship as local-first OSS MVP

## One-sentence pitch

plugtestkit is a deterministic WordPress plugin test scaffold generator that inspects a local plugin and emits PHPUnit, PHPCS, Composer, and GitHub Actions starter files with no hidden network behavior.

## Problem

Small WordPress plugin maintainers often know they should add PHPUnit, PHPCS, and CI coverage, but the first scaffold is fiddly: plugin headers need parsing, version constraints need translating into a sane matrix, and agents need safe local fixtures instead of broad shell recipes.

## Users

- WordPress plugin maintainers adding a first test harness.
- Agency developers standardizing plugin QA across small client plugins.
- Coding agents that need a local, reviewable scaffold step before touching CI or package managers.

## MVP scope

- `plugtestkit inspect <plugin-dir>` parses plugin headers and readme metadata from local files.
- `plugtestkit inspect --json --output <file>` emits machine-readable reports for agents and CI steps.
- `plugtestkit scaffold <plugin-dir> --output <dir>` writes a deterministic starter harness.
- `plugtestkit scaffold --dry-run` prints the planned files without writing.
- Matrix validation maps plugin minimum PHP and WordPress versions onto a practical support matrix.
- Fixtures and tests cover happy-path and malformed plugin directories.

## Generated files

- `composer.json` with PHPUnit and WordPress Coding Standards dev dependencies.
- `phpunit.xml.dist`.
- `phpcs.xml.dist`.
- `tests/bootstrap.php`.
- `tests/PluginSmokeTest.php`.
- `.github/workflows/plugin-tests.yml`.

## Non-goals

- Installing Composer dependencies.
- Bootstrapping a full WordPress test database.
- Publishing packages or releases.
- Calling WordPress.org, GitHub, Packagist, or telemetry endpoints.
- Copying the source inspiration repository name or implementation.

## Safety requirements

- Read only the plugin directory supplied by the user.
- Write only to explicit `--output` paths.
- Refuse to overwrite generated files unless `--force` is supplied.
- Keep generated templates deterministic and reviewable.
- Avoid secrets, credentials, network calls, and global machine mutation.

## Success criteria

- Unit tests cover fixture parsing, matrix validation, report rendering, and scaffold planning.
- A real CLI smoke uses `fixtures/sample-plugin` and validates generated files.
- README includes install, quickstart, API example, personality, safety notes, and attribution.
- `CONTRIBUTING.md`, `SECURITY.md`, `docs/TASKS.md`, `docs/ORCHESTRATION.md`, and `docs/orchestration.json` exist.
- Package metadata points to `rogerchappel/plugtestkit`.

## Attribution

This project was inspired by the existence of `wordpress-test-template` style tooling and the public repo signal documented in the original idea backlog. plugtestkit is a fresh implementation with a local-first scope and does not copy that project's name or implementation.
