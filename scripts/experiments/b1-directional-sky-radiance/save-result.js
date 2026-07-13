import {createHash} from 'node:crypto';
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {join, resolve} from 'node:path';

import {parseArguments, renderReport, runExperiment} from './run.js';
import {ProductionRun} from './ProductionRun.js';
import {DEFAULT_EXPERIMENT_RESULTS_ROOT, resolveProductionResultRoot} from '../production-result-paths.js';

const options = parseArguments(process.argv.slice(2));
const resultRoot = options.productionRunPath
	? resolveProductionResultRoot(
			options.outputRoot,
			'b1-directional-sky-radiance',
			ProductionRun.load(options.productionRunPath).manifest.backend,
		)
	: resolve(options.outputRoot ?? DEFAULT_EXPERIMENT_RESULTS_ROOT);
const resultDirectory = options.productionRunPath ? resultRoot : join(resultRoot, 'b1-directional-sky-radiance');
const resultPath = join(resultDirectory, 'result.md');
mkdirSync(resultDirectory, {recursive: true});
if (options.publishedModelsPath) {
	const bytes = readFileSync(options.publishedModelsPath);
	const durablePath = join(resultDirectory, 'published-models.tsv');
	if (resolve(options.publishedModelsPath) !== resolve(durablePath)) {
		writeFileSync(durablePath, bytes);
	}
	const sha256 = createHash('sha256').update(bytes).digest('hex');
	writeFileSync(join(resultDirectory, 'published-models.sha256'), `${sha256}  published-models.tsv\n`, 'utf8');
	options.publishedModelsPath = durablePath;
}
const run = runExperiment(options);
const report = renderReport(run);
process.stdout.write(report);
const savePassed = run.readyStagePassed && (!options.canonical || (run.accepted && run.profileComparisonComplete));
if (savePassed) {
	writeFileSync(resultPath, report, 'utf8');
	console.log(`\nSaved B1 result: ${resultPath}`);
} else {
	process.exitCode = 1;
}
