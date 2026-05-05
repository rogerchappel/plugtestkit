import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectPlugin } from '../src/inspect.js';
import { renderJsonReport, renderTextReport } from '../src/report.js';

test('renders text reports with status and matrix', async () => {
  const report = renderTextReport(await inspectPlugin('fixtures/sample-plugin'));
  assert.match(report, /status: ok/);
  assert.match(report, /php: 8\.1, 8\.2, 8\.3/);
});

test('renders parseable json reports', async () => {
  const json = renderJsonReport(await inspectPlugin('fixtures/sample-plugin'));
  assert.equal(JSON.parse(json).metadata.textDomain, 'sample-fixture');
});
