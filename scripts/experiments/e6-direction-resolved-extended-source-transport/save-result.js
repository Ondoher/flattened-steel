import {mkdirSync, writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {renderReport, runExperiment} from './run.js';
const dirUrl = new URL(
	'../../../references/results/experiments/e6-direction-resolved-extended-source-transport/',
	import.meta.url,
);
const dir = fileURLToPath(dirUrl),
	path = fileURLToPath(new URL('result.md', dirUrl));
const result = runExperiment(),
	report = renderReport(result);
process.stdout.write(report);
if (result.accepted) {
	mkdirSync(dir, {recursive: true});
	writeFileSync(path, report, 'utf8');
	console.log(`\nSaved accepted result: ${path}`);
} else process.exitCode = 1;
