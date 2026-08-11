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
  const lines = pluginCommentLines(source);

  for (const [key, label] of Object.entries(PLUGIN_HEADER_FIELDS)) {
    const pattern = pluginHeaderPattern(label);
    const line = lines.find((candidate) => pattern.test(candidate));
    headers[key] = line ? line.match(pattern)[1].replace(/\*\/$/, '').trim() : null;
  }

  return headers;
}

export function hasPluginNameHeader(source) {
  const lines = pluginCommentLines(source);
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
  return new RegExp(`^\\s*\\*?\\s*${escapeRegExp(label)}\\s*:\\s*(.+?)\\s*$`, 'i');
}

function pluginCommentLines(source) {
  const lines = String(source).split(/\r?\n/).slice(0, 80);
  const comments = [];
  let inBlock = false;
  let heredoc = null;

  for (const line of lines) {
    if (heredoc) {
      if (new RegExp(`^\\s*${escapeRegExp(heredoc)};?\\s*$`).test(line)) heredoc = null;
      continue;
    }

    const heredocMatch = line.match(/<<<[ \t]*(?:['"]([A-Za-z_][A-Za-z0-9_]*)['"]|([A-Za-z_][A-Za-z0-9_]*))/);
    if (!inBlock && heredocMatch) {
      heredoc = heredocMatch[1] ?? heredocMatch[2];
      continue;
    }

    let offset = 0;
    while (offset < line.length) {
      if (inBlock) {
        const end = line.indexOf('*/', offset);
        comments.push(end === -1 ? line.slice(offset) : line.slice(offset, end));
        if (end === -1) break;
        inBlock = false;
        offset = end + 2;
        continue;
      }

      const rest = line.slice(offset);
      const token = rest.match(/\/\*|\/\/|#/);
      if (!token) break;
      const index = offset + token.index;
      if (isInsideQuotedString(line.slice(0, index))) break;
      if (token[0] === '/*') {
        inBlock = true;
        offset = index + 2;
      } else {
        comments.push(line.slice(index + token[0].length));
        break;
      }
    }
  }

  return comments;
}

function isInsideQuotedString(prefix) {
  let quote = null;
  let escaped = false;
  for (const character of prefix) {
    if (escaped) {
      escaped = false;
    } else if (character === '\\' && quote) {
      escaped = true;
    } else if (quote === character) {
      quote = null;
    } else if (!quote && (character === "'" || character === '"')) {
      quote = character;
    }
  }
  return quote !== null;
}
