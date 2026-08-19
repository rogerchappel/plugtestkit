import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';

test('release workflow validates tag and exact packed artifact before release creation', async () => {
  const workflow = await readFile('.github/workflows/release.yml', 'utf8');
  const validation = workflow.indexOf('node scripts/validate-release-artifact.js npm-pack.json');
  const creation = workflow.indexOf('gh release create');

  assert.ok(validation >= 0, 'release workflow must run the release artifact validator');
  assert.ok(creation > validation, 'release artifact validation must precede release creation');
  assert.match(workflow, /npm pack --json[^\n]*> npm-pack\.json/);
  assert.match(workflow, /gh release create "\$\{GITHUB_REF_NAME\}" --notes-file RELEASE_NOTES\.md "\$\{\{ steps\.artifact\.outputs\.artifact_path \}\}"/);
  assert.doesNotMatch(workflow, /gh release create[^\n]*\*\.tgz/);
});

test('release dry run covers release contract files', async () => {
  const workflow = await readFile('.github/workflows/release-dry-run.yml', 'utf8');
  for (const path of ['scripts/validate-release-artifact.js', 'test/release-contract.test.js']) {
    assert.match(workflow, new RegExp(`- ${path.replaceAll('.', '\\.')}`));
  }
});

test('release artifact validator binds tag, package identity, and sole tarball', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'plugtestkit-release-contract-'));
  const output = path.join(root, 'github-output');
  const validator = path.resolve('scripts/validate-release-artifact.js');
  const artifact = {
    id: 'plugtestkit@1.2.3',
    name: 'plugtestkit',
    version: '1.2.3',
    filename: 'plugtestkit-1.2.3.tgz'
  };

  try {
    await writeFile(path.join(root, 'package.json'), JSON.stringify({ name: 'plugtestkit', version: '1.2.3' }));
    await writeFile(path.join(root, 'npm-pack.json'), JSON.stringify([artifact]));
    await writeFile(path.join(root, artifact.filename), 'tarball');

    const valid = runValidator(validator, root, output, 'v1.2.3');
    assert.equal(valid.status, 0, valid.stderr);
    assert.equal(await readFile(output, 'utf8'), `artifact_path=${path.join(root, artifact.filename)}\n`);

    const mistagged = runValidator(validator, root, output, 'v1.2.4');
    assert.equal(mistagged.status, 1);
    assert.match(mistagged.stderr, /does not match v1\.2\.3/);

    await writeFile(path.join(root, 'unexpected.tgz'), 'tarball');
    const ambiguous = runValidator(validator, root, output, 'v1.2.3');
    assert.equal(ambiguous.status, 1);
    assert.match(ambiguous.stderr, /expected only plugtestkit-1\.2\.3\.tgz/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

function runValidator(validator, cwd, output, tag) {
  return spawnSync(process.execPath, [validator, 'npm-pack.json'], {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, GITHUB_REF_NAME: tag, GITHUB_OUTPUT: output }
  });
}
