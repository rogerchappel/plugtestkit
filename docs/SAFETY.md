# Safety model

plugtestkit is intentionally local-first.

## What it does

- Reads plugin files from a directory you provide.
- Parses WordPress plugin headers and `readme.txt` metadata.
- Produces reports on stdout or a path you provide.
- Writes scaffold files only under an explicit `--output` directory.

## What it does not do

- No network calls.
- No telemetry.
- No credential discovery.
- No package publishing.
- No WordPress.org API lookups.
- No mutation of the source plugin directory unless you deliberately choose it as `--output`.

## Review generated files

Generated PHPUnit bootstrap files contain conventional WordPress test-suite paths and should be reviewed before production use. They are templates, not a guarantee that a plugin's full integration environment is configured.
