import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { parsePluginHeaders, parseReadmeMetadata } from './headers.js';
import { validateMatrix } from './matrix.js';
import { directoryExists, findPluginFiles } from './plugin-files.js';
import { normalizePathForReport, slugify } from './path-utils.js';

export async function inspectPlugin(pluginDir, options = {}) {
  const cwd = options.cwd ?? process.cwd();
  const absoluteDir = path.resolve(cwd, pluginDir);
  const findings = [];

  const { mainFiles, phpFiles } = await findPluginFiles(absoluteDir);
  if (mainFiles.length === 0) {
    findings.push({ level: 'error', code: 'NO_PLUGIN_HEADER', message: 'No PHP file with a WordPress plugin header was found.' });
  }
  if (mainFiles.length > 1) {
    findings.push({ level: 'warning', code: 'MULTIPLE_PLUGIN_HEADERS', message: 'Multiple plugin header files were found; using the first one.' });
  }

  const mainFile = mainFiles[0] ?? phpFiles[0] ?? null;
  const headers = mainFile ? parsePluginHeaders(await readFile(mainFile, 'utf8')) : {};

  const readmePath = path.join(absoluteDir, 'readme.txt');
  const hasReadme = await directoryExists(absoluteDir) && await fileExists(readmePath);
  const readme = hasReadme ? parseReadmeMetadata(await readFile(readmePath, 'utf8')) : {};
  if (!hasReadme) {
    findings.push({ level: 'warning', code: 'NO_README_TXT', message: 'No WordPress.org readme.txt was found.' });
  }

  const metadata = {
    name: headers.name ?? slugify(path.basename(absoluteDir)),
    version: headers.version ?? readme.stableTag ?? null,
    requiresPhp: headers.requiresPhp ?? readme.requiresPhp ?? null,
    requiresWp: headers.requiresWp ?? readme.requiresWp ?? null,
    testedUpTo: readme.testedUpTo ?? headers.testedUpTo ?? null,
    textDomain: headers.textDomain ?? slugify(headers.name ?? path.basename(absoluteDir)),
    license: headers.license ?? readme.license ?? null,
    description: headers.description ?? null
  };

  const matrix = validateMatrix(metadata, options.matrix);
  for (const warning of matrix.warnings) findings.push({ level: 'warning', code: 'MATRIX_WARNING', message: warning });
  for (const error of matrix.errors) findings.push({ level: 'error', code: 'MATRIX_ERROR', message: error });

  return {
    ok: !findings.some((finding) => finding.level === 'error'),
    pluginDir: normalizePathForReport(absoluteDir, cwd),
    mainFile: mainFile ? normalizePathForReport(mainFile, cwd) : null,
    phpFiles: phpFiles.map((file) => normalizePathForReport(file, cwd)),
    metadata,
    matrix,
    findings
  };
}

async function fileExists(file) {
  try {
    await readFile(file);
    return true;
  } catch {
    return false;
  }
}
