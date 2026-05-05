import test from 'node:test';
import assert from 'node:assert/strict';
import { parsePluginHeaders, parseReadmeMetadata } from '../src/headers.js';

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
