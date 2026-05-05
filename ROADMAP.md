# Roadmap

This roadmap describes intended direction, not a binding delivery promise.

## Now

- Keep the inspect and scaffold commands deterministic and local-first.
- Expand fixture coverage for common plugin header shapes.
- Improve generated bootstrap comments and failure messages.

## Next

- Add optional template profiles for GitHub Actions, GitLab CI, and local-only Composer workflows.
- Detect common plugin file layouts more gracefully.
- Add snapshot tests for generated scaffold output.
- Support maintainer-provided matrix config files.

## Later

- Consider opt-in WordPress.org metadata enrichment if users ask for it.
- Consider a TUI wizard after the CLI/API workflow is stable.
- Consider package-manager-specific recipes for Composer, wp-env, and Docker.

## Not Planned

- Hidden network calls or telemetry.
- Automatic publishing to npm, Packagist, WordPress.org, or GitHub Releases.
- Replacing WordPress core test tooling.
