import {mkdirSync, writeFileSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

import {generateB1Figures} from '../generate-benchmark-figures.js';
import {
	DEFAULT_EXPERIMENT_RESULTS_ROOT,
	resolveProductionBackendDirectory,
	resolveProductionResultRoot,
} from '../production-result-paths.js';
import {renderReport, runExperiment} from './run.js';
import {ProductionRun} from './ProductionRun.js';
import {B1_FIGURE_COLOR_CONTROL} from '../../algorithm32/production-b-experiments/B1MeasurementBoundary.js';

/** Score one complete production B1 boundary and publish its report and original figure family. */
export function publishProductionB1Result(path, options = {}) {
	const productionRun = ProductionRun.load(path);
	const run = runExperiment({productionRunPath: productionRun.manifestPath});
	if (!run.accepted || !run.proposedStage.completed) {
		throw new Error('Current-production B1 scoring did not complete the Bruneton J4 candidate.');
	}

	const outputRoot = resolve(options.outputRoot ?? DEFAULT_EXPERIMENT_RESULTS_ROOT);
	const backendDirectory = resolveProductionBackendDirectory(productionRun.manifest.backend);
	const resultDirectory = resolveProductionResultRoot(
		outputRoot,
		'b1-directional-sky-radiance',
		productionRun.manifest.backend,
	);
	const candidatePaths = ProductionRun.candidatePaths(productionRun);
	const figureRun = generateB1Figures({
		profileFamily: productionRun.manifest.profileFamily ?? 'paper',
		colorModel: B1_FIGURE_COLOR_CONTROL.selectionId,
		singleCandidate: true,
		outputRoot,
		resultSubdirectory: backendDirectory,
		algorithm32Spectra: candidatePaths.proposedPath,
		algorithm32Provenance: candidatePaths.proposedProvenancePath,
	});
	const resultPath = join(resultDirectory, 'result.md');
	mkdirSync(resultDirectory, {recursive: true});
	writeFileSync(resultPath, renderReport(run), 'utf8');

	return Object.freeze({
		resultPath,
		figureColorControl: figureRun.figureColorControl,
		figures: figureRun.artifacts,
	});
}

function parseArguments(argv) {
	if (argv.length === 0) throw new Error('A complete production-run directory or manifest is required.');
	const options = {};
	for (let index = 1; index < argv.length; index += 1) {
		if (argv[index] !== '--output-root' || !argv[index + 1]) {
			throw new Error(`Unknown or incomplete argument: ${argv[index]}`);
		}
		options.outputRoot = resolve(argv[++index]);
	}
	return {path: argv[0], options};
}

const invoked = process.argv[1] && pathToFileURL(process.argv[1]).href;
if (invoked === import.meta.url) {
	try {
		const request = parseArguments(process.argv.slice(2));
		process.stdout.write(`${JSON.stringify(publishProductionB1Result(request.path, request.options), null, 2)}\n`);
	} catch (error) {
		console.error(error instanceof Error ? error.stack : error);
		process.exitCode = 1;
	}
}
