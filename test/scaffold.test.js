import test from 'node:test';
import assert from 'node:assert/strict';
import { access, mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { planScaffold, writeScaffold } from '../src/scaffold.js';

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
  assert.match(ci, /php: \['8\.1', '8\.2', '8\.3', '8\.4'\]/);
  assert.match(ci, /wordpress: \['6\.6', '6\.7', '6\.8', '6\.9', '7\.0'\]/);
  assert.match(ci, /php-version: \$\{\{ matrix\.php \}\}/);
  assert.match(ci, /WP_VERSION: \$\{\{ matrix\.wordpress \}\}/);
  assert.match(ci, /install-wp-tests\.sh/);
});

test('bootstrap loads the inspected main file rather than the text domain', async () => {
  const plan = await planScaffold('fixtures/custom-entry-plugin');
  const bootstrap = plan.files.find((file) => file.path === 'tests/bootstrap.php').content;
  assert.match(bootstrap, /custom-entry\.php/);
  assert.doesNotMatch(bootstrap, /fancy-toolkit\.php/);
});

test('does not create output when inspection finds no plugin header', async () => {
  const scratch = await mkdtemp(path.join(os.tmpdir(), 'plugtestkit-scaffold-'));
  const output = path.join(scratch, 'output');

  await assert.rejects(
    writeScaffold('fixtures/missing-plugin', output),
    (error) => error.name === 'ScaffoldInspectionError'
      && error.message.includes('NO_PLUGIN_HEADER')
  );
  await assert.rejects(access(output), { code: 'ENOENT' });
});

test('does not create output when inspection finds an invalid matrix', async () => {
  const scratch = await mkdtemp(path.join(os.tmpdir(), 'plugtestkit-scaffold-'));
  const plugin = path.join(scratch, 'invalid-matrix-plugin');
  const output = path.join(scratch, 'output');
  await mkdir(plugin);
  await writeFile(path.join(plugin, 'plugin.php'), `<?php
/**
 * Plugin Name: Invalid Matrix Fixture
 * Requires PHP: next
 */
`);

  await assert.rejects(
    writeScaffold(plugin, output),
    (error) => error.name === 'ScaffoldInspectionError'
      && error.message.includes('MATRIX_ERROR')
  );
  await assert.rejects(access(output), { code: 'ENOENT' });
  assert.match(await readFile(path.join(plugin, 'plugin.php'), 'utf8'), /Requires PHP: next/);
});

test('does not partially write a scaffold when a later target already exists', async () => {
  const scratch = await mkdtemp(path.join(os.tmpdir(), 'plugtestkit-scaffold-'));
  const output = path.join(scratch, 'output');
  const collision = path.join(output, '.github/workflows/plugin-tests.yml');
  const unrelated = path.join(output, 'notes/existing.bin');
  const collisionContent = Buffer.from([0x00, 0xff, 0x50, 0x54, 0x4b]);
  const unrelatedContent = Buffer.from([0xde, 0xad, 0xbe, 0xef]);
  await mkdir(path.dirname(collision), { recursive: true });
  await mkdir(path.dirname(unrelated), { recursive: true });
  await writeFile(collision, collisionContent);
  await writeFile(unrelated, unrelatedContent);

  await assert.rejects(writeScaffold('fixtures/sample-plugin', output), { code: 'EEXIST' });

  assert.deepEqual(await readFile(collision), collisionContent);
  assert.deepEqual(await readFile(unrelated), unrelatedContent);
  for (const target of [
    'composer.json',
    'phpunit.xml.dist',
    'phpcs.xml.dist',
    'tests/bootstrap.php',
    'tests/PluginSmokeTest.php'
  ]) {
    await assert.rejects(access(path.join(output, target)), { code: 'ENOENT' });
  }
});
