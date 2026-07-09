# CLI reference

## `plugtestkit inspect <plugin-dir>`

Parses a local WordPress plugin directory and prints a report.

Options:

- `--json` — emit JSON instead of text.
- `--output <file>` — write the report to a file.

## `plugtestkit matrix <plugin-dir>`

Prints only the filtered PHP and WordPress test matrix plus matrix findings.

Options:

- `--json` — emit compact JSON for CI generators or agent planners.

## `plugtestkit scaffold <plugin-dir> --output <dir>`

Generates a test harness into an explicit output directory.

Options:

- `--dry-run` — print the file plan without writing files.
- `--force` — overwrite existing files in the output directory.

## Exit codes

- `0` — command completed and inspection had no error findings.
- `1` — command failed or inspection had error findings.
- `2` — invalid command.
