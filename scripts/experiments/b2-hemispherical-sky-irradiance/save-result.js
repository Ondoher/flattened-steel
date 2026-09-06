import {mkdirSync, writeFileSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {parseArguments, renderReport, runExperiment} from './run.js';
import {ProductionRun} from '../b1-directional-sky-radiance/ProductionRun.js';
import {DEFAULT_EXPERIMENT_RESULTS_ROOT, resolveProductionResultRoot} from '../production-result-paths.js';

try {
	const options = parseArguments(process.argv.slice(2));
	const resultRoot = options.productionRunPath
		? resolveProductionResultRoot(
				options.outputRoot,
				'b2-hemispherical-sky-irradiance',
				ProductionRun.load(options.productionRunPath).manifest.backend,
			)
		: resolve(options.outputRoot ?? DEFAULT_EXPERIMENT_RESULTS_ROOT);
	const resultDirectory = options.productionRunPath
		? resultRoot
		: join(resultRoot, 'b2-hemispherical-sky-irradiance');
	const resultPath = join(resultDirectory, 'result.md');
	const run = runExperiment(options);
	const report = renderReport(run);
	process.stdout.write(report);
	if (run.measurementStageCompleted) {
		mkdirSync(resultDirectory, {recursive: true});
		writeFileSync(resultPath, report, 'utf8');
		console.log(`\nSaved B2 result: ${resultPath}`);
	} else {
		process.exitCode = 1;
	}
} catch (error) {
	console.error(error instanceof Error ? error.stack : error);
	process.exitCode = 1;
}
