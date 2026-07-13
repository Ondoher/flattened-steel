import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildReport } from './run.js';

const resultPath = fileURLToPath(new URL(
  '../../../references/results/experiments/e3-sky-ray-direction-characterization/result.md',
  import.meta.url
));
const report = buildReport();

await mkdir(dirname(resultPath), { recursive: true });
await writeFile(resultPath, report.text, 'utf8');
console.log(`Saved E3 result to ${resultPath}`);
console.log(`E3 characterization completed: ${report.accepted ? 'yes' : 'no'}`);

if (!report.accepted) {
  process.exitCode = 1;
}
