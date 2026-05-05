# Scaffold example

Generate a local test harness for the sample fixture:

```sh
plugtestkit scaffold fixtures/sample-plugin --output .plugtestkit/sample-plugin
```

Expected files:

- `composer.json`
- `phpunit.xml.dist`
- `phpcs.xml.dist`
- `tests/bootstrap.php`
- `tests/PluginSmokeTest.php`
- `.github/workflows/plugin-tests.yml`

Review generated PHP paths before copying into a production plugin. The command never installs dependencies or contacts WordPress.org.
