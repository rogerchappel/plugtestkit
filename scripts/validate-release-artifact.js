import { appendFile, readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const [packJsonPath] = process.argv.slice(2);
if (!packJsonPath) fail('usage: validate-release-artifact.js <npm-pack.json>');

const root = process.cwd();
const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
const expectedTag = `v${pkg.version}`;
if (process.env.GITHUB_REF_NAME !== expectedTag) {
  fail(`release tag ${process.env.GITHUB_REF_NAME || '<unset>'} does not match ${expectedTag}`);
}

const packOutput = JSON.parse(await readFile(path.resolve(packJsonPath), 'utf8'));
if (!Array.isArray(packOutput) || packOutput.length !== 1) {
  fail(`expected exactly one npm pack result, received ${Array.isArray(packOutput) ? packOutput.length : 'invalid JSON shape'}`);
}

const [artifact] = packOutput;
const expectedId = `${pkg.name}@${pkg.version}`;
const expectedFilename = `${pkg.name}-${pkg.version}.tgz`;
if (artifact.id !== expectedId || artifact.name !== pkg.name || artifact.version !== pkg.version) {
  fail(`packed identity does not match ${expectedId}`);
}
if (artifact.filename !== expectedFilename) {
  fail(`packed filename ${artifact.filename} does not match ${expectedFilename}`);
}

const tarballs = (await readdir(root)).filter((entry) => entry.endsWith('.tgz'));
if (tarballs.length !== 1 || tarballs[0] !== expectedFilename) {
  fail(`expected only ${expectedFilename}, found ${tarballs.join(', ') || 'no tarballs'}`);
}

const artifactPath = path.join(root, expectedFilename);
if (!(await stat(artifactPath)).isFile()) fail(`${artifactPath} is not a file`);
if (!process.env.GITHUB_OUTPUT) fail('GITHUB_OUTPUT is required');
await appendFile(process.env.GITHUB_OUTPUT, `artifact_path=${artifactPath}\n`);
console.log(`release artifact validated: ${expectedTag} -> ${expectedId} (${artifactPath})`);

function fail(message) {
  throw new Error(message);
}
