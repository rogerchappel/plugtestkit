import test from 'node:test';
import assert from 'node:assert/strict';
import { planScaffold } from '../src/scaffold.js';

test('plans expected scaffold files', async () => {
  const plan = await planScaffold('fixtures/sample-plugin');
  assert.equal(plan.inspection.ok, true);
  assert.deepEqual(plan.files.map((file) => file.path), [
    'composer.json',
    'phpunit.xml.dist',
    'phpcs.xml.dist',
    'tests/bootstrap.php',
    'tests/PluginSmokeTest.php',
    '.github/workflows/plugin-tests.yml'
  ]);
});

test('scaffold includes matrix in GitHub Actions template', async () => {
  const plan = await planScaffold('fixtures/sample-plugin');
  const ci = plan.files.find((file) => file.path.endsWith('plugin-tests.yml')).content;
  assert.match(ci, /php: \['8\.1', '8\.2', '8\.3'\]/);
  assert.match(ci, /wordpress: \['6\.4', '6\.5', '6\.6', '6\.7'\]/);
});
