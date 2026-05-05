import path from 'node:path';

export function normalizePathForReport(inputPath, cwd = process.cwd()) {
  const absolute = path.resolve(cwd, inputPath);
  const relative = path.relative(cwd, absolute);
  return relative && !relative.startsWith('..') ? relative : absolute;
}

export function slugify(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'plugin';
}
