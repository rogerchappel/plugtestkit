import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
const scratch = await mkdtemp(path.join(tmpdir(), 'plugtestkit-package-'));

try {
  const pack = run('npm', ['pack', '--json', '--pack-destination', scratch], root);
  const entries = JSON.parse(pack.stdout);
  if (entries.length !== 1) fail(`expected one packed artifact, received ${entries.length}`);

  const artifact = entries[0];
  if (artifact.id !== `${pkg.name}@${pkg.version}`) {
    fail(`packed identity ${artifact.id} does not match ${pkg.name}@${pkg.version}`);
  }

  const requiredFiles = ['bin/plugtestkit.js', 'package.json', 'README.md', 'src/cli.js'];
  const packedFiles = new Set(artifact.files.map(({ path: file }) => file));
  for (const file of requiredFiles) {
    if (!packedFiles.has(file)) fail(`packed artifact is missing ${file}`);
  }

  const tarball = path.join(scratch, artifact.filename);
  const installRoot = path.join(scratch, 'install');
  run('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', '--prefix', installRoot, tarball], root);

  const cli = path.join(installRoot, 'node_modules', '.bin', 'plugtestkit');
  const help = run(cli, ['--help'], root).stdout;
  if (!help.includes('plugtestkit - local-first')) fail('packed CLI --help returned unexpected output');

  const version = run(cli, ['--version'], root).stdout.trim();
  if (version !== pkg.version) fail(`packed CLI version ${version} does not match ${pkg.version}`);

  console.log(`package smoke passed: ${artifact.id} (${artifact.files.length} files)`);
} finally {
  await rm(scratch, { recursive: true, force: true });
}

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8' });
  if (result.status !== 0) {
    process.stderr.write(result.stdout);
    process.stderr.write(result.stderr);
    process.exit(result.status ?? 1);
  }
  return result;
}

function fail(message) {
  throw new Error(message);
}
