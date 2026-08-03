import test from 'node:test';
import assert from 'node:assert/strict';
import { Writable } from 'node:stream';
import { parseArgs, runCli } from '../src/cli.js';

test('parses inspect options', () => {
  assert.deepEqual(parseArgs(['inspect', 'fixtures/sample-plugin', '--json', '--output', 'out.json']), {
    command: 'inspect',
    positionals: ['fixtures/sample-plugin'],
    help: false,
    version: false,
    json: true,
    dryRun: false,
    force: false,
    output: 'out.json'
  });
});

test('runs help command', async () => {
  const output = captureStream();
  const code = await runCli(['--help'], { stdout: output.stream, stderr: captureStream().stream });
  assert.equal(code, 0);
  assert.match(output.text(), /plugtestkit/);
});

test('runs version command', async () => {
  const output = captureStream();
  const code = await runCli(['--version'], { stdout: output.stream, stderr: captureStream().stream });
  assert.equal(code, 0);
  assert.match(output.text(), /^0\.1\.0\n$/);
});

test('runs matrix command as focused JSON', async () => {
  const output = captureStream();
  const code = await runCli(['matrix', 'fixtures/sample-plugin', '--json'], { stdout: output.stream, stderr: captureStream().stream });
  const payload = JSON.parse(output.text());
  assert.equal(code, 0);
  assert.equal(payload.plugin, 'Sample Fixture Plugin');
  assert.deepEqual(payload.php, ['8.1', '8.2', '8.3', '8.4']);
});

test('inspect accepts a case-insensitive Plugin Name header', async () => {
  const output = captureStream();
  const code = await runCli(['inspect', 'fixtures/mixed-case-header-plugin', '--json'], {
    stdout: output.stream,
    stderr: captureStream().stream
  });
  const payload = JSON.parse(output.text());
  assert.equal(code, 0);
  assert.equal(payload.metadata.name, 'Mixed Case Header Plugin');
  assert.equal(payload.findings.some((finding) => finding.code === 'NO_PLUGIN_HEADER'), false);
});

function captureStream() {
  const chunks = [];
  return {
    stream: new Writable({ write(chunk, _encoding, callback) { chunks.push(String(chunk)); callback(); } }),
    text: () => chunks.join('')
  };
}
