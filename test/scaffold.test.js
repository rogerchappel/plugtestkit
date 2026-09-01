import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { access, mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { planScaffold, writeScaffold } from '../src/scaffold.js';
import { exampleTestPhp, workflowDependencyRevisions } from '../src/templates.js';

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

test('generates a valid PHP class identifier for digit-leading plugin names', () => {
  const php = exampleTestPhp({ name: '2FA Guard' });
  const declaration = php.match(/class\s+([^\s]+)\s+extends/);

  assert.equal(declaration?.[1], 'Plugin2FAGuardSmokeTest');
  assert.match(declaration[1], /^[A-Za-z_][A-Za-z0-9_]*$/);

  const phpVersion = spawnSync('php', ['--version'], { encoding: 'utf8' });
  if (!phpVersion.error) {
    const lint = spawnSync('php', ['-l'], { input: php, encoding: 'utf8' });
    assert.equal(lint.status, 0, lint.stderr || lint.stdout);
  }
});

test('scaffold includes matrix in GitHub Actions template', async () => {
  const plan = await planScaffold('fixtures/sample-plugin');
  const ci = plan.files.find((file) => file.path.endsWith('plugin-tests.yml')).content;
  assert.match(ci, /php: \['8\.2', '8\.3', '8\.4', '8\.5'\]/);
  assert.match(ci, /wordpress: \['6\.6', '6\.7', '6\.8', '6\.9', '7\.0'\]/);
  assert.match(ci, /php-version: \$\{\{ matrix\.php \}\}/);
  assert.match(ci, /WP_VERSION: \$\{\{ matrix\.wordpress \}\}/);
  assert.match(ci, /install-wp-tests\.sh/);
});

test('scaffold runs every generated Composer quality script in CI', async () => {
  const plan = await planScaffold('fixtures/sample-plugin');
  const composer = JSON.parse(plan.files.find((file) => file.path === 'composer.json').content);
  const ci = plan.files.find((file) => file.path.endsWith('plugin-tests.yml')).content;

  assert.deepEqual(composer.scripts, {
    test: 'phpunit',
    lint: 'phpcs'
  });
  assert.deepEqual(composer['require-dev'], {
    'phpunit/phpunit': '^9.6',
    'wp-coding-standards/wpcs': '^3.0',
    'dealerdirect/phpcodesniffer-composer-installer': '^1.0'
  });
  assert.equal(composer.requireDev, undefined);
  assert.match(ci, /- run: composer lint\n\s+- run: composer test/);
});

test('scaffold pins workflow dependencies to reviewed immutable revisions', async () => {
  const plan = await planScaffold('fixtures/sample-plugin');
  const ci = plan.files.find((file) => file.path.endsWith('plugin-tests.yml')).content;

  assert.deepEqual(workflowDependencyRevisions, {
    checkout: 'd23441a48e516b6c34aea4fa41551a30e30af803',
    setupPhp: 'bf6b4fbd49ca58e4608c9c89fba0b8d90bd2a39f',
    wpCliScaffold: 'd1e9ac012c53f8ea44e90e2e57e516319550df38'
  });
  assert.match(ci, /actions\/checkout@d23441a48e516b6c34aea4fa41551a30e30af803 # v6/);
  assert.match(ci, /shivammathur\/setup-php@bf6b4fbd49ca58e4608c9c89fba0b8d90bd2a39f # 2\.35\.5/);
  assert.match(ci, /wp-cli\/scaffold-command\/d1e9ac012c53f8ea44e90e2e57e516319550df38\/templates\/install-wp-tests\.sh/);
  assert.doesNotMatch(ci, /uses: [^\n]+@(v\d+|main)\b/);
  assert.doesNotMatch(ci, /wp-cli\/scaffold-command\/(main|master)\//);
});

test('scaffold generates a PHP 8.5 workflow for a PHP 8.5 plugin', async () => {
  const scratch = await mkdtemp(path.join(os.tmpdir(), 'plugtestkit-php-85-'));
  await writeFile(path.join(scratch, 'plugin.php'), `<?php
/**
 * Plugin Name: PHP 8.5 Fixture
 * Requires PHP: 8.5
 * Requires at least: 7.0
 */
`);

  const plan = await planScaffold(scratch);
  const ci = plan.files.find((file) => file.path.endsWith('plugin-tests.yml')).content;
  assert.equal(plan.inspection.ok, true);
  assert.deepEqual(plan.inspection.matrix.php, ['8.5']);
  assert.match(ci, /php: \['8\.5'\]/);
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

test('does not scaffold from non-comment header lookalikes', async () => {
  const scratch = await mkdtemp(path.join(os.tmpdir(), 'plugtestkit-lookalike-'));
  const output = path.join(scratch, 'output');

  await assert.rejects(
    writeScaffold('fixtures/header-lookalike-plugin', output),
    (error) => error.name === 'ScaffoldInspectionError'
      && error.message.includes('NO_PLUGIN_HEADER')
  );
  await assert.rejects(access(output), { code: 'ENOENT' });
});

test('plans a scaffold for a header after line 80 within the scan window', async () => {
  const plan = await planScaffold('fixtures/late-header-plugin');
  assert.equal(plan.inspection.ok, true);
  assert.equal(plan.inspection.metadata.name, 'Late Header Plugin');
});

test('does not scaffold from a header beyond the scan window', async () => {
  await assert.rejects(
    writeScaffold('fixtures/out-of-window-plugin', 'unused-output'),
    (error) => error.name === 'ScaffoldInspectionError'
      && error.message.includes('NO_PLUGIN_HEADER')
  );
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
