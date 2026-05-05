import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

export async function writeReport(outputPath, content, options = {}) {
  const target = path.resolve(options.cwd ?? process.cwd(), outputPath);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, content, 'utf8');
  return target;
}
