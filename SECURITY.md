# Security Policy

## Supported Versions

plugtestkit has not published a stable release yet.

| Version | Supported |
| --- | --- |
| 0.x | Best-effort security fixes before 1.0 |

## Reporting a Vulnerability

Please do not report suspected vulnerabilities in public issues, pull requests, or discussions.

Open a public issue asking for a private reporting path without including exploit details, secrets, personal data, or sensitive technical details. A maintainer will provide a suitable private channel when available.

## Scope

In scope:

- Bugs that cause plugtestkit to read outside an explicitly provided plugin directory.
- Bugs that cause plugtestkit to write outside an explicit `--output` path.
- Unsafe generated templates that encourage secret leakage or hidden network behavior.
- CI or release configuration maintained in this repository.

Out of scope:

- Security issues in downstream WordPress plugins.
- General WordPress, PHPUnit, Composer, or PHPCS vulnerabilities not introduced by this project.
- Requests for guaranteed support timelines.

## Safety posture

plugtestkit should not perform network calls, telemetry, credential discovery, or package publishing. Treat regressions against that safety model as security-relevant.
