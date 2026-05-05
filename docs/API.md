# API

plugtestkit exposes a small ESM API for agents and scripts.

```js
import { inspectPlugin, planScaffold, renderTextReport } from 'plugtestkit';

const result = await inspectPlugin('fixtures/sample-plugin');
console.log(renderTextReport(result));

const plan = await planScaffold('fixtures/sample-plugin');
console.log(plan.files.map((file) => file.path));
```

## Functions

- `inspectPlugin(pluginDir, options)` — returns metadata, matrix, and findings.
- `planScaffold(pluginDir, options)` — returns generated file contents without writing them.
- `writeScaffold(pluginDir, outputDir, options)` — writes scaffold files to an explicit output directory.
- `renderTextReport(result)` — formats a readable inspection report.
- `renderJsonReport(result)` — formats stable JSON output.
- `validateMatrix(metadata, options)` — filters PHP and WordPress versions by plugin requirements.
