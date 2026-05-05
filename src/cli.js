import { inspectPlugin, planScaffold, writeScaffold } from './index.js';
import { renderJsonReport, renderTextReport } from './report.js';
import { writeReport } from './output.js';

export async function runCli(argv, streams = {}) {
  const stdout = streams.stdout ?? process.stdout;
  const stderr = streams.stderr ?? process.stderr;
  const args = parseArgs(argv);

  if (args.help || args.command === 'help' || !args.command) {
    stdout.write(helpText());
    return 0;
  }

  try {
    if (args.command === 'inspect') return await inspectCommand(args, stdout);
    if (args.command === 'scaffold') return await scaffoldCommand(args, stdout);
    stderr.write(`Unknown command: ${args.command}\n\n${helpText()}`);
    return 2;
  } catch (error) {
    stderr.write(`${error.name ?? 'Error'}: ${error.message}\n`);
    return 1;
  }
}

async function inspectCommand(args, stdout) {
  const pluginDir = args.positionals[0];
  if (!pluginDir) throw new Error('inspect requires a plugin directory.');
  const result = await inspectPlugin(pluginDir);
  const content = args.json ? renderJsonReport(result) : renderTextReport(result);
  if (args.output) {
    await writeReport(args.output, content);
    stdout.write(`Wrote inspection report to ${args.output}\n`);
  } else {
    stdout.write(content);
  }
  return result.ok ? 0 : 1;
}

async function scaffoldCommand(args, stdout) {
  const pluginDir = args.positionals[0];
  if (!pluginDir) throw new Error('scaffold requires a plugin directory.');
  if (args.dryRun || !args.output) {
    const plan = await planScaffold(pluginDir);
    stdout.write(renderJsonReport({ ok: plan.inspection.ok, files: plan.files.map((file) => file.path), findings: plan.inspection.findings }));
    return plan.inspection.ok ? 0 : 1;
  }
  const result = await writeScaffold(pluginDir, args.output, { force: args.force });
  stdout.write(`Wrote ${result.written.length} scaffold files to ${args.output}\n`);
  return result.inspection.ok ? 0 : 1;
}

export function parseArgs(argv) {
  const parsed = { command: null, positionals: [], help: false, json: false, dryRun: false, force: false, output: null };
  const queue = [...argv];
  while (queue.length) {
    const token = queue.shift();
    if (!parsed.command && !token.startsWith('-')) {
      parsed.command = token;
    } else if (token === '--help' || token === '-h') {
      parsed.help = true;
    } else if (token === '--json') {
      parsed.json = true;
    } else if (token === '--dry-run') {
      parsed.dryRun = true;
    } else if (token === '--force') {
      parsed.force = true;
    } else if (token === '--output' || token === '-o') {
      parsed.output = queue.shift();
    } else {
      parsed.positionals.push(token);
    }
  }
  return parsed;
}

export function helpText() {
  return `plugtestkit - local-first WordPress plugin test harness generator

Usage:
  plugtestkit inspect <plugin-dir> [--json] [--output <file>]
  plugtestkit scaffold <plugin-dir> --output <dir> [--force]
  plugtestkit scaffold <plugin-dir> --dry-run

Commands:
  inspect    Parse plugin headers, validate PHP/WordPress matrix, and report findings.
  scaffold   Generate composer, PHPUnit, PHPCS, and GitHub Actions test harness files.

Safety:
  plugtestkit only reads local files and writes to explicit --output paths. It performs no network calls.
`;
}
