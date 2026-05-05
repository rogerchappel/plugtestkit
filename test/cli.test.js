import test from 'node:test';
import assert from 'node:assert/strict';
import { Writable } from 'node:stream';
import { parseArgs, runCli } from '../src/cli.js';

test('parses inspect options', () => {
  assert.deepEqual(parseArgs(['inspect', 'fixtures/sample-plugin', '--json', '--output', 'out.json']), {
    command: 'inspect',
    positionals: ['fixtures/sample-plugin'],
    help: false,
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

function captureStream() {
  const chunks = [];
  return {
    stream: new Writable({ write(chunk, _encoding, callback) { chunks.push(String(chunk)); callback(); } }),
    text: () => chunks.join('')
  };
}
