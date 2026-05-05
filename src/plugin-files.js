import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { PlugtestkitError } from './errors.js';

const HEADER_HINTS = ['Plugin Name', 'Requires PHP', 'Requires at least', 'Text Domain'];

export async function findPluginFiles(pluginDir) {
  let entries;
  try {
    entries = await readdir(pluginDir, { withFileTypes: true });
  } catch (error) {
    throw new PlugtestkitError(`Cannot read plugin directory: ${pluginDir}`, {
      code: 'PLUGIN_DIR_UNREADABLE',
      details: { cause: error.message }
    });
  }

  const phpFiles = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.php'))
    .map((entry) => path.join(pluginDir, entry.name));

  const mainFiles = [];
  for (const file of phpFiles) {
    const content = await readFile(file, 'utf8');
    if (HEADER_HINTS.some((hint) => content.includes(`${hint}:`))) {
      mainFiles.push(file);
    }
  }

  return { phpFiles, mainFiles };
}

export async function directoryExists(dir) {
  try {
    return (await stat(dir)).isDirectory();
  } catch {
    return false;
  }
}
