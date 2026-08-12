import test from 'node:test';
import assert from 'node:assert/strict';
import { parsePluginHeaders, parseReadmeMetadata, PLUGIN_HEADER_SCAN_BYTES } from '../src/headers.js';

test('parses WordPress plugin headers from PHP comments', () => {
  const headers = parsePluginHeaders(`<?php
/**
 * Plugin Name: Example Plugin
 * Version: 2.0.0
 * Requires at least: 6.4
 * Requires PHP: 8.1
 * Text Domain: example-plugin
 */`);
  assert.equal(headers.name, 'Example Plugin');
  assert.equal(headers.version, '2.0.0');
  assert.equal(headers.requiresWp, '6.4');
  assert.equal(headers.requiresPhp, '8.1');
  assert.equal(headers.textDomain, 'example-plugin');
});

test('accepts supported comment styles and case-insensitive header labels', () => {
  assert.equal(parsePluginHeaders('<?php // plugin name: Slash Comment').name, 'Slash Comment');
  assert.equal(parsePluginHeaders('<?php\n# Plugin Name: Hash Comment').name, 'Hash Comment');
  assert.equal(parsePluginHeaders('<?php /* Plugin Name: Block Comment */').name, 'Block Comment');
});

test('ignores header lookalikes outside PHP comments', () => {
  const headers = parsePluginHeaders(`<?php
$nowdoc = <<<'PLUGIN'
Plugin Name: Nowdoc Lookalike
# Version: 9.9.9
PLUGIN;
$heredoc = <<<PLUGIN
// Plugin Name: Heredoc Lookalike
PLUGIN;
Plugin Name: Executable Lookalike
echo 'Plugin Name: String Lookalike';`);

  assert.equal(headers.name, null);
  assert.equal(headers.version, null);
});

test('scans the WordPress-compatible first 8 KiB without a line limit', () => {
  const source = `<?php\n${'// filler\n'.repeat(80)}// Plugin Name: Late Header`;
  assert.equal(source.split('\n').findIndex((line) => line.includes('Plugin Name')), 81);
  assert.ok(Buffer.byteLength(source) < PLUGIN_HEADER_SCAN_BYTES);
  assert.equal(parsePluginHeaders(source).name, 'Late Header');
});

test('ignores plugin headers beyond the first 8 KiB', () => {
  const source = `<?php\n/* ${'x'.repeat(PLUGIN_HEADER_SCAN_BYTES)} */\n// Plugin Name: Too Late`;
  assert.equal(parsePluginHeaders(source).name, null);
});

test('parses readme metadata fields', () => {
  const metadata = parseReadmeMetadata('Requires at least: 6.5\nTested up to: 6.7\nRequires PHP: 8.2\nStable tag: 1.0.0');
  assert.deepEqual(metadata, {
    requiresWp: '6.5',
    testedUpTo: '6.7',
    requiresPhp: '8.2',
    stableTag: '1.0.0',
    license: null
  });
});
