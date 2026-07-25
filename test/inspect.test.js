import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectPlugin } from '../src/inspect.js';

test('inspects sample plugin fixture', async () => {
  const result = await inspectPlugin('fixtures/sample-plugin');
  assert.equal(result.ok, true);
  assert.equal(result.metadata.name, 'Sample Fixture Plugin');
  assert.equal(result.metadata.requiresPhp, '8.1');
  assert.deepEqual(result.matrix.php, ['8.1', '8.2', '8.3', '8.4']);
});

test('flags directories without plugin headers', async () => {
  const result = await inspectPlugin('fixtures/missing-plugin');
  assert.equal(result.ok, false);
  assert.equal(result.findings.some((finding) => finding.code === 'NO_PLUGIN_HEADER'), true);
});
