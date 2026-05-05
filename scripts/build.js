import { readdir, stat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const files = [];
for await (const file of walk('src')) files.push(file);
for await (const file of walk('bin')) files.push(file);
for (const file of files.filter((candidate) => candidate.endsWith('.js'))) {
  const result = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
console.log(`build checked ${files.length} JavaScript files`);

async function* walk(dir) {
  for (const entry of await readdir(dir)) {
    const file = path.join(dir, entry);
    const info = await stat(file);
    if (info.isDirectory()) yield* walk(file);
    else yield file;
  }
}
