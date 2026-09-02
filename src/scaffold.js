import { lstat, mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { inspectPlugin } from './inspect.js';
import { bootstrapPhp, composerJson, exampleTestPhp, githubActionsCi, phpcsXml, phpunitXml } from './templates.js';

export async function planScaffold(pluginDir, options = {}) {
  const inspection = await inspectPlugin(pluginDir, options);
  const mainFile = options.bootstrapMainFile
    ?? (inspection.mainFile ? path.basename(inspection.mainFile) : `${inspection.metadata.textDomain}.php`);
  const files = [
    { path: 'composer.json', content: composerJson(inspection.metadata) },
    { path: 'phpunit.xml.dist', content: phpunitXml(inspection.metadata) },
    { path: 'phpcs.xml.dist', content: phpcsXml(inspection.metadata) },
    { path: 'tests/bootstrap.php', content: bootstrapPhp(
      inspection.metadata,
      mainFile
    ) },
    { path: 'tests/PluginSmokeTest.php', content: exampleTestPhp(inspection.metadata) },
    { path: '.github/workflows/plugin-tests.yml', content: githubActionsCi(inspection.matrix) }
  ];

  return { inspection, files };
}

export async function writeScaffold(pluginDir, outputDir, options = {}) {
  const cwd = options.cwd ?? process.cwd();
  const absoluteOutput = path.resolve(cwd, outputDir);
  const inspection = await inspectPlugin(pluginDir, options);
  if (!inspection.ok) {
    throw new ScaffoldInspectionError(inspection.findings);
  }
  const absoluteMainFile = path.resolve(cwd, inspection.mainFile);
  const bootstrapMainFile = path.relative(absoluteOutput, absoluteMainFile).split(path.sep).join('/');
  const plan = await planScaffold(pluginDir, { ...options, bootstrapMainFile });
  if (!plan.inspection.ok) {
    throw new ScaffoldInspectionError(plan.inspection.findings);
  }
  const written = [];

  if (!options.force) {
    for (const file of plan.files) {
      const target = path.join(absoluteOutput, file.path);
      try {
        await lstat(target);
      } catch (error) {
        if (error.code === 'ENOENT') continue;
        throw error;
      }

      const error = new Error(`Scaffold target already exists: ${target}`);
      error.code = 'EEXIST';
      error.path = target;
      throw error;
    }
  }

  try {
    for (const file of plan.files) {
      const target = path.join(absoluteOutput, file.path);
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, file.content, options.force ? undefined : { flag: 'wx' });
      written.push(target);
    }
  } catch (error) {
    if (!options.force) {
      await Promise.all(written.map((target) => unlink(target)));
    }
    throw error;
  }

  return { ...plan, outputDir: absoluteOutput, written };
}

export class ScaffoldInspectionError extends Error {
  constructor(findings) {
    const errors = findings.filter((finding) => finding.level === 'error');
    const details = errors.map((finding) => `${finding.code}: ${finding.message}`).join('\n');
    super(`Cannot write scaffold because plugin inspection failed:\n${details}`);
    this.name = 'ScaffoldInspectionError';
    this.findings = errors;
  }
}
