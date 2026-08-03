export const PLUGIN_HEADER_FIELDS = {
  name: 'Plugin Name',
  pluginUri: 'Plugin URI',
  description: 'Description',
  version: 'Version',
  requiresWp: 'Requires at least',
  testedUpTo: 'Tested up to',
  requiresPhp: 'Requires PHP',
  author: 'Author',
  textDomain: 'Text Domain',
  license: 'License'
};

export function parsePluginHeaders(source) {
  const headers = {};
  const lines = String(source).split(/\r?\n/).slice(0, 80);

  for (const [key, label] of Object.entries(PLUGIN_HEADER_FIELDS)) {
    const pattern = pluginHeaderPattern(label);
    const line = lines.find((candidate) => pattern.test(candidate));
    headers[key] = line ? line.match(pattern)[1].replace(/\*\/$/, '').trim() : null;
  }

  return headers;
}

export function hasPluginNameHeader(source) {
  const lines = String(source).split(/\r?\n/).slice(0, 80);
  const pattern = pluginHeaderPattern(PLUGIN_HEADER_FIELDS.name);
  return lines.some((line) => pattern.test(line));
}

export function parseReadmeMetadata(source) {
  const metadata = {};
  const map = {
    requiresWp: 'Requires at least',
    testedUpTo: 'Tested up to',
    requiresPhp: 'Requires PHP',
    stableTag: 'Stable tag',
    license: 'License'
  };

  for (const [key, label] of Object.entries(map)) {
    const pattern = new RegExp(`^${escapeRegExp(label)}\\s*:\\s*(.+?)\\s*$`, 'im');
    metadata[key] = source.match(pattern)?.[1]?.trim() ?? null;
  }

  return metadata;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function pluginHeaderPattern(label) {
  return new RegExp(`^[\\s/*#@]*${escapeRegExp(label)}\\s*:\\s*(.+?)\\s*$`, 'i');
}
