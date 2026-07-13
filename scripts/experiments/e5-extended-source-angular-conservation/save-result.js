import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { renderReport, runExperiment } from './run.js';

const resultDirectoryUrl = new URL(
  '../../../references/results/experiments/e5-extended-source-angular-conservation/',
  import.meta.url
);
const resultDirectory = fileURLToPath(resultDirectoryUrl);
const resultPath = fileURLToPath(new URL('result.md', resultDirectoryUrl));
const result = runExperiment();
const report = renderReport(result);

process.stdout.write(report);

if (result.accepted) {
  mkdirSync(resultDirectory, { recursive: true });
  writeFileSync(resultPath, report, 'utf8');
  console.log(`\nSaved accepted result: ${resultPath}`);
} else {
  process.exitCode = 1;
}
