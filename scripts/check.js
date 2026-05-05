import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const failures = [];

for await (const file of walk(root)) {
  if (file.includes(`${path.sep}.git${path.sep}`) || file.includes(`${path.sep}node_modules${path.sep}`)) continue;
  if (!/\.(js|md|json|yml|yaml|sh)$/.test(file)) continue;
  const content = await readFile(file, 'utf8');
  if (content.includes('/Users/roger/Developer/my-opensource/plugtestkit') && !file.endsWith('AGENTS.md') && !file.endsWith('docs/orchestration.json')) {
    failures.push(`placeholder absolute path leaked into ${path.relative(root, file)}`);
  }
  if (/\s$/m.test(content)) {
    failures.push(`trailing whitespace in ${path.relative(root, file)}`);
  }
}

const pkg = JSON.parse(await readFile('package.json', 'utf8'));
for (const script of ['test', 'check', 'build', 'smoke']) {
  if (!pkg.scripts?.[script]) failures.push(`missing npm script: ${script}`);
}
if (pkg.name !== 'plugtestkit') failures.push('package name must be plugtestkit');

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log('check passed');

async function* walk(dir) {
  for (const entry of await readdir(dir)) {
    const file = path.join(dir, entry);
    const info = await stat(file);
    if (info.isDirectory()) yield* walk(file);
    else yield file;
  }
}
