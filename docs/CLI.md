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

The command inspects the plugin before creating the output directory. Error
findings such as a missing plugin header or invalid test matrix are printed to
standard error, and no scaffold files are written.

Options:

- `--dry-run` — print the file plan and inspection findings without writing files.
- `--force` — overwrite existing files in the output directory.

Options may appear before or after the command and plugin directory. Unknown,
duplicate, or command-incompatible options are rejected, as are missing option
values and extra positional arguments.

## Exit codes

- `0` — command completed and inspection had no error findings.
- `1` — command failed or inspection had error findings.
- `2` — invalid command or command-line usage.
