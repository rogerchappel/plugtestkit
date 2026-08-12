import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectPlugin } from '../src/inspect.js';
import { findPluginFiles } from '../src/plugin-files.js';

test('inspects sample plugin fixture', async () => {
  const result = await inspectPlugin('fixtures/sample-plugin');
  assert.equal(result.ok, true);
  assert.equal(result.metadata.name, 'Sample Fixture Plugin');
  assert.equal(result.metadata.requiresPhp, '8.1');
  assert.deepEqual(result.matrix.php, ['8.1', '8.2', '8.3', '8.4', '8.5']);
});

test('flags directories without plugin headers', async () => {
  const result = await inspectPlugin('fixtures/missing-plugin');
  assert.equal(result.ok, false);
  assert.equal(result.findings.some((finding) => finding.code === 'NO_PLUGIN_HEADER'), true);
});

test('does not discover or inspect non-comment header lookalikes', async () => {
  const { mainFiles } = await findPluginFiles('fixtures/header-lookalike-plugin');
  assert.deepEqual(mainFiles, []);

  const result = await inspectPlugin('fixtures/header-lookalike-plugin');
  assert.equal(result.ok, false);
  assert.equal(result.metadata.name, 'header-lookalike-plugin');
  assert.equal(result.metadata.version, null);
  assert.equal(result.findings.some((finding) => finding.code === 'NO_PLUGIN_HEADER'), true);
});

test('discovers and inspects a plugin with a case-insensitive Plugin Name header', async () => {
  const { mainFiles } = await findPluginFiles('fixtures/mixed-case-header-plugin');
  assert.deepEqual(mainFiles, ['fixtures/mixed-case-header-plugin/mixed-case-header-plugin.php']);

  const result = await inspectPlugin('fixtures/mixed-case-header-plugin');
  assert.equal(result.ok, true);
  assert.equal(result.metadata.name, 'Mixed Case Header Plugin');
  assert.equal(result.metadata.version, '1.2.3');
  assert.equal(result.findings.some((finding) => finding.code === 'NO_PLUGIN_HEADER'), false);
});

test('discovers a plugin header after line 80 when it is within the 8 KiB scan window', async () => {
  const { mainFiles } = await findPluginFiles('fixtures/late-header-plugin');
  assert.deepEqual(mainFiles, ['fixtures/late-header-plugin/late-header-plugin.php']);
  const result = await inspectPlugin('fixtures/late-header-plugin');
  assert.equal(result.ok, true);
  assert.equal(result.metadata.name, 'Late Header Plugin');
});

test('rejects a plugin header beyond the 8 KiB scan window', async () => {
  const { mainFiles } = await findPluginFiles('fixtures/out-of-window-plugin');
  assert.deepEqual(mainFiles, []);
  const result = await inspectPlugin('fixtures/out-of-window-plugin');
  assert.equal(result.ok, false);
  assert.equal(result.findings.some((finding) => finding.code === 'NO_PLUGIN_HEADER'), true);
});
