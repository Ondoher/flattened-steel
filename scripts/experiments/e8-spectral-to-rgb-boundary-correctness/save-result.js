import {mkdirSync, writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {renderReport, runExperiment} from './run.js';
const u = new URL('../../../references/results/experiments/e8-spectral-to-rgb-boundary-correctness/', import.meta.url),
	d = fileURLToPath(u),
	p = fileURLToPath(new URL('result.md', u));
const r = runExperiment(),
	report = renderReport(r);
process.stdout.write(report);
if (r.accepted) {
	mkdirSync(d, {recursive: true});
	writeFileSync(p, report, 'utf8');
	console.log(`\nSaved accepted result: ${p}`);
} else process.exitCode = 1;
