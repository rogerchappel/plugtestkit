# Generated templates

The V1 scaffold writes six files:

| File | Purpose |
| --- | --- |
| `composer.json` | Adds PHPUnit, WordPress Coding Standards, and composer scripts. |
| `phpunit.xml.dist` | Points PHPUnit at generated tests. |
| `phpcs.xml.dist` | Enables WordPress Coding Standards. |
| `tests/bootstrap.php` | Loads the WordPress test suite and plugin file. |
| `tests/PluginSmokeTest.php` | Provides a deliberately tiny WP_UnitTestCase starter. |
| `.github/workflows/plugin-tests.yml` | Runs the PHP/WordPress version matrix in GitHub Actions. |

Templates are intentionally conservative. They should get maintainers to a reviewable first test harness without hiding external setup work.
