<?php
/**
 * Plugin Name: Sample Fixture Plugin
 * Plugin URI: https://example.test/sample-fixture-plugin
 * Description: A tiny fixture plugin used by plugtestkit tests and smoke checks.
 * Version: 1.2.3
 * Requires at least: 6.4
 * Requires PHP: 8.1
 * Author: Fixture Maintainer
 * Text Domain: sample-fixture
 * License: GPL-2.0-or-later
 */

if (! defined('ABSPATH')) {
    exit;
}

function sample_fixture_plugin_label(): string
{
    return 'sample-fixture';
}
