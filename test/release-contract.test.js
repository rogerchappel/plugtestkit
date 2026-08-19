import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

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
