import test from 'node:test';
import assert from 'node:assert/strict';
import { Writable } from 'node:stream';
import { access, mkdtemp } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
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

test('preserves documented option ordering', () => {
  assert.deepEqual(parseArgs(['--json', 'inspect', '--output', 'out.json', 'fixtures/sample-plugin']).positionals, ['fixtures/sample-plugin']);
});

for (const [name, argv, message] of [
  ['unknown flags', ['inspect', 'fixtures/sample-plugin', '--bogus'], /Unknown option: --bogus/],
  ['missing option values', ['inspect', 'fixtures/sample-plugin', '--output'], /--output requires a value/],
  ['option-like missing values', ['inspect', 'fixtures/sample-plugin', '--output', '--json'], /--output requires a value/],
  ['unsupported inspect options', ['inspect', 'fixtures/sample-plugin', '--force'], /--force is not supported by inspect/],
  ['unsupported matrix options', ['matrix', 'fixtures/sample-plugin', '--output', 'report.json'], /--output is not supported by matrix/],
  ['duplicate singleton options', ['matrix', 'fixtures/sample-plugin', '--json', '--json'], /Option may only be specified once: --json/],
  ['missing positionals', ['inspect', '--json'], /inspect requires a plugin directory/],
  ['surplus positionals', ['scaffold', 'fixtures/sample-plugin', 'extra', '--dry-run'], /scaffold accepts exactly one plugin directory/],
  ['missing scaffold mode', ['scaffold', 'fixtures/sample-plugin'], /scaffold requires --output <dir> or --dry-run/]
]) {
  test(`rejects ${name} with usage exit status`, async () => {
    const output = captureStream();
    const errors = captureStream();
    const code = await runCli(argv, { stdout: output.stream, stderr: errors.stream });
    assert.equal(code, 2);
    assert.equal(output.text(), '');
    assert.match(errors.text(), message);
  });
}

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
  assert.deepEqual(payload.php, ['8.1', '8.2', '8.3', '8.4', '8.5']);
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

test('inspect rejects non-comment header lookalikes', async () => {
  const output = captureStream();
  const code = await runCli(['inspect', 'fixtures/header-lookalike-plugin', '--json'], {
    stdout: output.stream,
    stderr: captureStream().stream
  });
  const payload = JSON.parse(output.text());
  assert.equal(code, 1);
  assert.equal(payload.metadata.version, null);
  assert.equal(payload.findings.some((finding) => finding.code === 'NO_PLUGIN_HEADER'), true);
});

test('scaffold reports inspection errors without partial writes', async () => {
  const scratch = await mkdtemp(path.join(os.tmpdir(), 'plugtestkit-cli-'));
  const outputDir = path.join(scratch, 'output');
  const output = captureStream();
  const errors = captureStream();
  const code = await runCli(['scaffold', 'fixtures/missing-plugin', '--output', outputDir], {
    stdout: output.stream,
    stderr: errors.stream
  });

  assert.equal(code, 1);
  assert.equal(output.text(), '');
  assert.match(errors.text(), /ScaffoldInspectionError: Cannot write scaffold because plugin inspection failed/);
  assert.match(errors.text(), /NO_PLUGIN_HEADER: No PHP file with a WordPress plugin header was found/);
  await assert.rejects(access(outputDir), { code: 'ENOENT' });
});

test('scaffold dry-run exposes findings and remains side-effect-free', async () => {
  const scratch = await mkdtemp(path.join(os.tmpdir(), 'plugtestkit-cli-'));
  const outputDir = path.join(scratch, 'output');
  const output = captureStream();
  const code = await runCli(['scaffold', 'fixtures/missing-plugin', '--dry-run', '--output', outputDir], {
    stdout: output.stream,
    stderr: captureStream().stream
  });
  const payload = JSON.parse(output.text());

  assert.equal(code, 1);
  assert.equal(payload.ok, false);
  assert.equal(payload.findings.some((finding) => finding.code === 'NO_PLUGIN_HEADER'), true);
  await assert.rejects(access(outputDir), { code: 'ENOENT' });
});

function captureStream() {
  const chunks = [];
  return {
    stream: new Writable({ write(chunk, _encoding, callback) { chunks.push(String(chunk)); callback(); } }),
    text: () => chunks.join('')
  };
}
