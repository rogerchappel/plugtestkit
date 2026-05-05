export function renderTextReport(result) {
  const lines = [];
  lines.push(`plugtestkit report: ${result.metadata.name}`);
  lines.push(`status: ${result.ok ? 'ok' : 'needs attention'}`);
  lines.push(`plugin: ${result.pluginDir}`);
  if (result.mainFile) lines.push(`main file: ${result.mainFile}`);
  lines.push('');
  lines.push('metadata:');
  for (const [key, value] of Object.entries(result.metadata)) {
    lines.push(`  ${key}: ${value ?? 'unknown'}`);
  }
  lines.push('');
  lines.push('matrix:');
  lines.push(`  php: ${result.matrix.php.join(', ') || 'none'}`);
  lines.push(`  wordpress: ${result.matrix.wordpress.join(', ') || 'none'}`);
  lines.push('');
  lines.push('findings:');
  if (result.findings.length === 0) {
    lines.push('  none');
  } else {
    for (const finding of result.findings) {
      lines.push(`  - [${finding.level}] ${finding.code}: ${finding.message}`);
    }
  }
  return `${lines.join('\n')}\n`;
}

export function renderJsonReport(result) {
  return `${JSON.stringify(result, null, 2)}\n`;
}
