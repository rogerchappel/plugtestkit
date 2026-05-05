const PHP_VERSION_RE = /^(?<major>\d+)\.(?<minor>\d+)(?:\.(?<patch>\d+))?$/;

export function parseVersion(value) {
  if (!value) return null;
  const match = String(value).trim().match(PHP_VERSION_RE);
  if (!match) return null;
  return {
    major: Number(match.groups.major),
    minor: Number(match.groups.minor),
    patch: Number(match.groups.patch ?? 0),
    raw: String(value).trim()
  };
}

export function compareVersions(a, b) {
  const left = typeof a === 'string' ? parseVersion(a) : a;
  const right = typeof b === 'string' ? parseVersion(b) : b;
  if (!left || !right) return null;
  for (const part of ['major', 'minor', 'patch']) {
    if (left[part] > right[part]) return 1;
    if (left[part] < right[part]) return -1;
  }
  return 0;
}

export function uniqueSortedVersions(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => compareVersions(a, b) ?? String(a).localeCompare(String(b)));
}
