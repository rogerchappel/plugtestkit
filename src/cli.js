import { inspectPlugin, planScaffold, writeScaffold } from './index.js';
import { renderJsonReport, renderTextReport } from './report.js';
import { writeReport } from './output.js';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { version } = require('../package.json');

export async function runCli(argv, streams = {}) {
  const stdout = streams.stdout ?? process.stdout;
  const stderr = streams.stderr ?? process.stderr;
  let args;

  try {
    args = parseArgs(argv);
  } catch (error) {
    stderr.write(`${error.message}\n`);
    return 2;
  }

  if (args.version) {
    stdout.write(`${version}\n`);
    return 0;
  }
  if (args.help || args.command === 'help' || !args.command) {
    stdout.write(helpText());
    return 0;
  }

  try {
    if (args.command === 'inspect') return await inspectCommand(args, stdout);
    if (args.command === 'matrix') return await matrixCommand(args, stdout);
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

async function matrixCommand(args, stdout) {
  const pluginDir = args.positionals[0];
  if (!pluginDir) throw new Error('matrix requires a plugin directory.');
  const result = await inspectPlugin(pluginDir);
  const payload = {
    ok: result.ok,
    plugin: result.metadata.name,
    php: result.matrix.php,
    wordpress: result.matrix.wordpress,
    findings: result.findings.filter((finding) => finding.code === 'MATRIX_WARNING' || finding.code === 'MATRIX_ERROR')
  };
  stdout.write(args.json ? `${JSON.stringify(payload, null, 2)}\n` : renderMatrixText(payload));
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

export function renderMatrixText(payload) {
  const lines = [
    `plugtestkit matrix: ${payload.plugin}`,
    `status: ${payload.ok ? 'ok' : 'needs attention'}`,
    `php: ${payload.php.join(', ') || 'none'}`,
    `wordpress: ${payload.wordpress.join(', ') || 'none'}`
  ];
  if (payload.findings.length > 0) {
    lines.push('findings:');
    for (const finding of payload.findings) {
      lines.push(`  - [${finding.level}] ${finding.message}`);
    }
  }
  return `${lines.join('\n')}\n`;
}

export function parseArgs(argv) {
  const parsed = { command: null, positionals: [], help: false, version: false, json: false, dryRun: false, force: false, output: null };
  const seen = new Set();
  const queue = [...argv];
  while (queue.length) {
    const token = queue.shift();
    if (!parsed.command && !token.startsWith('-')) {
      parsed.command = token;
    } else if (token === '--help' || token === '-h') {
      assertSingleton(seen, 'help', token);
      parsed.help = true;
    } else if (token === '--version' || token === '-v') {
      assertSingleton(seen, 'version', token);
      parsed.version = true;
    } else if (token === '--json') {
      assertSingleton(seen, 'json', token);
      parsed.json = true;
    } else if (token === '--dry-run') {
      assertSingleton(seen, 'dryRun', token);
      parsed.dryRun = true;
    } else if (token === '--force') {
      assertSingleton(seen, 'force', token);
      parsed.force = true;
    } else if (token === '--output' || token === '-o') {
      assertSingleton(seen, 'output', token);
      const value = queue.shift();
      if (!value || value.startsWith('-')) throw new Error(`${token} requires a value.`);
      parsed.output = value;
    } else if (token.startsWith('-')) {
      throw new Error(`Unknown option: ${token}`);
    } else {
      parsed.positionals.push(token);
    }
  }
  validateArgs(parsed);
  return parsed;
}

function assertSingleton(seen, name, token) {
  if (seen.has(name)) throw new Error(`Option may only be specified once: ${token}`);
  seen.add(name);
}

function validateArgs(args) {
  if (args.version) {
    if (args.command || args.positionals.length || args.help || args.json || args.dryRun || args.force || args.output) {
      throw new Error('--version cannot be combined with commands or other options.');
    }
    return;
  }

  if (!args.command) {
    if (args.positionals.length || args.json || args.dryRun || args.force || args.output) throw new Error('A command is required.');
    return;
  }

  if (args.command === 'help') {
    if (args.positionals.length || args.json || args.dryRun || args.force || args.output) throw new Error('help does not accept arguments or options.');
    return;
  }

  const allowed = {
    inspect: ['json', 'output'],
    matrix: ['json'],
    scaffold: ['dryRun', 'force', 'output']
  }[args.command];
  if (!allowed) return;

  for (const [name, label] of [['json', '--json'], ['dryRun', '--dry-run'], ['force', '--force'], ['output', '--output']]) {
    if (args[name] && !allowed.includes(name)) throw new Error(`${label} is not supported by ${args.command}.`);
  }
  if (args.positionals.length === 0) throw new Error(`${args.command} requires a plugin directory.`);
  if (args.positionals.length > 1) throw new Error(`${args.command} accepts exactly one plugin directory.`);
  if (args.command === 'scaffold' && !args.dryRun && !args.output) throw new Error('scaffold requires --output <dir> or --dry-run.');
}

export function helpText() {
  return `plugtestkit - local-first WordPress plugin test harness generator

Usage:
  plugtestkit --version
  plugtestkit inspect <plugin-dir> [--json] [--output <file>]
  plugtestkit matrix <plugin-dir> [--json]
  plugtestkit scaffold <plugin-dir> --output <dir> [--force]
  plugtestkit scaffold <plugin-dir> --dry-run

Commands:
  inspect    Parse plugin headers, validate PHP/WordPress matrix, and report findings.
  matrix     Print the PHP and WordPress test matrix only.
  scaffold   Generate composer, PHPUnit, PHPCS, and GitHub Actions test harness files.

Safety:
  plugtestkit only reads local files and writes to explicit --output paths. It performs no network calls.
`;
}
