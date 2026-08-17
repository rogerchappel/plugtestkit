# Generated templates

The V1 scaffold writes six files:

| File | Purpose |
| --- | --- |
| `composer.json` | Adds PHPUnit, WordPress Coding Standards, and composer scripts. |
| `phpunit.xml.dist` | Points PHPUnit at generated tests. |
| `phpcs.xml.dist` | Enables WordPress Coding Standards. |
| `tests/bootstrap.php` | Loads the WordPress test suite and plugin file. |
| `tests/PluginSmokeTest.php` | Provides a deliberately tiny WP_UnitTestCase starter. |
| `.github/workflows/plugin-tests.yml` | Starts MySQL, installs the WordPress test suite for each declared WordPress version, and runs PHPUnit across the PHP/WordPress matrix. |

The generated bootstrap loads the exact plugin entry file found during
inspection, even when its filename differs from the plugin text domain.

The generated smoke-test class keeps plugin names readable while producing a
valid PHP identifier. Punctuation and whitespace are removed at word
boundaries, and names that would otherwise begin with a digit are prefixed
with `Plugin` (for example, `2FA Guard` becomes
`Plugin2FAGuardSmokeTest`). Empty or fully non-alphanumeric names fall back to
`PluginSmokeTest`.

Templates are intentionally conservative. They should get maintainers to a reviewable first test harness without hiding external setup work.
