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

Templates are intentionally conservative. They should get maintainers to a reviewable first test harness without hiding external setup work.
