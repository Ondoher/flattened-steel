import {createHash} from 'node:crypto';
import {copyFileSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

import {renderReport as renderB1Report, runExperiment as runB1} from './run.js';
import {ProductionRun} from './ProductionRun.js';
import {renderReport as renderB2Report, runExperiment as runB2} from '../b2-hemispherical-sky-irradiance/run.js';
import {renderReport as renderB3Report, runExperiment as runB3} from '../b3-matched-atmosphere-solver/run.js';
import {generateBenchmarkFigures} from '../generate-benchmark-figures.js';
import {
	B1_FIGURE_COLOR_CONTROL,
	B1_PHYSICAL_MEASUREMENT_BOUNDARY,
	requireB1FigureColorControl,
	requireB1PhysicalMeasurementBoundary,
} from '../../algorithm32/production-b-experiments/B1MeasurementBoundary.js';
import {
	DEFAULT_EXPERIMENT_RESULTS_ROOT,
	resolveProductionBackendDirectory,
	resolveProductionResultRoot,
} from '../production-result-paths.js';

const SCORE_DIRECTORY = 'b1-b3-production-scores';
export const PRODUCTION_B1_CLOSEOUT_MAXIMUM_RMSE_MILLIWATT = 11.820391604126252;

/** Require the conjunctive numerical and classification gates for one production B1-B3 result set. */
export function assertProductionBFamilyCloseout({b1, b2, b3}) {
	if (!b1?.accepted || !b1.proposedStage?.completed) {
		throw new Error('Current-production B1 scoring did not complete the Bruneton J4 candidate.');
	}
	const b1Rmse = b1.proposedStage.score?.aggregate?.rmseMilliwatt;
	if (!Number.isFinite(b1Rmse) || b1Rmse > PRODUCTION_B1_CLOSEOUT_MAXIMUM_RMSE_MILLIWATT) {
		throw new Error(
			`Current-production B1 aggregate RMSE must be no greater than ${PRODUCTION_B1_CLOSEOUT_MAXIMUM_RMSE_MILLIWATT}.`,
		);
	}
	if (b1.proposedStage.assessment?.classification !== 'favorable') {
		throw new Error('Current-production B1 must remain favorable under its predeclared judgment rules.');
	}
	if (!b2?.fullBenchmarkAccepted || !b2.proposedScore) {
		throw new Error('Current-production B2 scoring did not complete the Bruneton J4 candidate.');
	}
	if (b2.proposedAssessment?.classification !== 'favorable') {
		throw new Error('Current-production B2 must remain favorable under its predeclared judgment rules.');
	}
	if (!b3?.complete || !b3.proposed || !b3.proposedAssessment) {
		throw new Error('Current-production B3 scoring did not complete the Bruneton J4 candidate.');
	}
	if (
		b3.proposedAssessment.classification !== 'favorable' ||
		b3.proposedAssessment.consistent !== true ||
		b3.proposedAssessment.mismatchAssessment?.complete !== true
	) {
		throw new Error('Current-production B3 must preserve favorable B1 inheritance, same-run consistency, and its mismatch map.');
	}
	return Object.freeze({b1RmseMilliwatt: b1Rmse, classification: 'favorable'});
}

/** Keep physical scoring and visual-figure Color identities separate in the score manifest. */
export function createProductionBPresentationBoundaries(figureColorControl) {
	return Object.freeze({
		physicalScoringBoundary: requireB1PhysicalMeasurementBoundary(B1_PHYSICAL_MEASUREMENT_BOUNDARY),
		figureColorControl: requireB1FigureColorControl(figureColorControl),
	});
}

function sha256(text) {
	return createHash('sha256').update(text).digest('hex');
}

function writeImmutable(path, text) {
	writeFileSync(path, text, {encoding: 'utf8', flag: 'wx'});
	return sha256(text);
}

function copyResult(sourcePath, destinationPath) {
	mkdirSync(dirname(destinationPath), {recursive: true});
	copyFileSync(sourcePath, destinationPath);
	return sha256(readFileSync(destinationPath));
}

function materializeCandidateBoundaries(productionRun, b1Directory, b3Directory) {
	const candidates = ProductionRun.candidatePaths(productionRun);
	const paths = {
		algorithm32Spectra: join(b1Directory, 'algorithm32-paper-proposed.tsv'),
		algorithm32Provenance: join(b1Directory, 'algorithm32-paper-boundary-provenance.json'),
		algorithm32Cube: join(b3Directory, 'algorithm32-paper-proposed-cube.json'),
	};
	const sources = {
		algorithm32Spectra: candidates.proposedPath,
		algorithm32Provenance: candidates.proposedProvenancePath,
		algorithm32Cube: candidates.proposedCubePath,
	};
	const artifacts = Object.entries(paths).map(([name, path]) => ({
		name,
		path,
		sha256: copyResult(sources[name], path),
	}));
	return Object.freeze({paths: Object.freeze(paths), artifacts: Object.freeze(artifacts)});
}

function allocateScoreDirectory(outputRoot, backend) {
	mkdirSync(outputRoot, {recursive: true});
	const nextNumber =
		readdirSync(outputRoot, {withFileTypes: true})
			.filter((entry) => entry.isDirectory() && /^\d{6}-/.test(entry.name))
			.reduce((maximum, entry) => Math.max(maximum, Number(entry.name.slice(0, 6))), 0) + 1;
	const backendLabel = backend === 'gpu-production-shaders-r32f' ? 'gpu-shaders' : 'cpu-reference';
	const scoreRunId = `${String(nextNumber).padStart(6, '0')}-current-production-b1-b3-${backendLabel}`;
	const scoreDirectory = join(outputRoot, scoreRunId);
	mkdirSync(scoreDirectory);
	return {scoreRunId, scoreDirectory};
}

export function scoreProductionRun(path, options = {}) {
	const productionRun = ProductionRun.load(path);
	const productionRunPath = productionRun.manifestPath;
	const resultsRoot = resolve(options.outputRoot ?? DEFAULT_EXPERIMENT_RESULTS_ROOT);
	const backendDirectory = resolveProductionBackendDirectory(productionRun.manifest.backend);
	const b1ResultDirectory = resolveProductionResultRoot(
		resultsRoot,
		'b1-directional-sky-radiance',
		productionRun.manifest.backend,
	);
	const b2ResultDirectory = resolveProductionResultRoot(
		resultsRoot,
		'b2-hemispherical-sky-irradiance',
		productionRun.manifest.backend,
	);
	const b3ResultDirectory = resolveProductionResultRoot(
		resultsRoot,
		'b3-matched-atmosphere-solver',
		productionRun.manifest.backend,
	);
	const scoreRoot = resolveProductionResultRoot(resultsRoot, SCORE_DIRECTORY, productionRun.manifest.backend);

	const b1 = runB1({productionRunPath});
	const b1Report = renderB1Report(b1);

	const b2 = runB2({productionRunPath});
	const b2Report = renderB2Report(b2);

	mkdirSync(scoreRoot, {recursive: true});
	const temporaryDirectory = mkdtempSync(join(scoreRoot, '.score-'));
	let b3Report;
	try {
		const temporaryB1ResultPath = join(temporaryDirectory, 'b1-result.md');
		writeFileSync(temporaryB1ResultPath, b1Report, 'utf8');
		const b3 = runB3({productionRunPath, b1ResultPath: temporaryB1ResultPath});
		assertProductionBFamilyCloseout({b1, b2, b3});
		b3Report = renderB3Report(b3);
	} finally {
		rmSync(temporaryDirectory, {recursive: true, force: true});
	}

	const materialized = materializeCandidateBoundaries(productionRun, b1ResultDirectory, b3ResultDirectory);
	const figureRun = generateBenchmarkFigures({
		profileFamily: 'paper',
		colorModel: B1_FIGURE_COLOR_CONTROL.selectionId,
		singleCandidate: true,
		outputRoot: resultsRoot,
		resultSubdirectory: backendDirectory,
		...materialized.paths,
	});
	mkdirSync(b1ResultDirectory, {recursive: true});
	mkdirSync(b2ResultDirectory, {recursive: true});
	mkdirSync(b3ResultDirectory, {recursive: true});
	writeFileSync(join(b1ResultDirectory, 'result.md'), b1Report, 'utf8');
	writeFileSync(join(b2ResultDirectory, 'result.md'), b2Report, 'utf8');
	writeFileSync(join(b3ResultDirectory, 'result.md'), b3Report, 'utf8');

	const {scoreRunId, scoreDirectory} = allocateScoreDirectory(scoreRoot, productionRun.manifest.backend);
	const resultPaths = {
		b1: join(scoreDirectory, 'b1-result.md'),
		b2: join(scoreDirectory, 'b2-result.md'),
		b3: join(scoreDirectory, 'b3-result.md'),
		manifest: join(scoreDirectory, 'manifest.json'),
	};
	const b1Sha256 = writeImmutable(resultPaths.b1, b1Report);
	const b2Sha256 = writeImmutable(resultPaths.b2, b2Report);
	const b3Sha256 = writeImmutable(resultPaths.b3, b3Report);
	const presentationBoundaries = createProductionBPresentationBoundaries(figureRun.figureColorControl);
	const productionManifestSha256 = sha256(readFileSync(productionRun.manifestPath));
	const sourceOutput = productionRun.manifest.outputs.find((output) => output.order === 4);

	const scoreManifest = {
		schema: 'algorithm32-current-production-b1-b3-scores-v3',
		scoreRunId,
		runId: productionRun.manifest.runId,
		backend: productionRun.manifest.backend,
		productionManifestSha256,
		completedAt: new Date().toISOString(),
		outputRoot: resultsRoot,
		backendDirectory,
		results: [
			{
				name: 'B1',
				file: 'b1-result.md',
				publishedFile: `b1-directional-sky-radiance/${backendDirectory}/result.md`,
				sha256: b1Sha256,
			},
			{
				name: 'B2',
				file: 'b2-result.md',
				publishedFile: `b2-hemispherical-sky-irradiance/${backendDirectory}/result.md`,
				sha256: b2Sha256,
			},
			{
				name: 'B3',
				file: 'b3-result.md',
				publishedFile: `b3-matched-atmosphere-solver/${backendDirectory}/result.md`,
				sha256: b3Sha256,
			},
		],
		boundaries: materialized.artifacts,
		...presentationBoundaries,
		figures: figureRun.artifacts,
		derivation: {
			schemaId: 'algorithm32-current-production-b1-b3-score-derivation-v1',
			source: {
				runId: productionRun.manifest.runId,
				manifestSha256: productionManifestSha256,
				productionRevision: productionRun.manifest.productionRevision,
				compilerIdentity: productionRun.manifest.compilerIdentity,
				assetSetIdentity: productionRun.manifest.assetSetIdentity,
				assetIdentities: productionRun.manifest.assets.map((asset) => asset.assetIdentity),
				profileHashes: productionRun.manifest.profileHashes,
				tableSha256: sourceOutput.tableSha256,
				provenanceSha256: sourceOutput.provenanceSha256,
				cubeSha256: sourceOutput.cubeSha256,
			},
			products: {
				b1: {operation: 'score direct-40 directional radiance', reportSha256: b1Sha256},
				b2: {operation: 'integrate the same B1 directional spectra', reportSha256: b2Sha256},
				b3: {operation: 'score the 31-channel cube derived from the same B1 table', reportSha256: b3Sha256},
				figures: {
					operation: 'render the six B1 visual comparisons plus B2 and B3 diagnostics',
					colorControl: figureRun.figureColorControl,
					outputs: figureRun.artifacts.map(({relativePath, sha256: artifactSha256}) => ({
						relativePath,
						sha256: artifactSha256,
					})),
				},
			},
		},
	};
	writeImmutable(resultPaths.manifest, `${JSON.stringify(scoreManifest, null, 2)}\n`);
	return Object.freeze({...scoreManifest, scoreDirectory});
}

export function parseArguments(argv) {
	if (argv.length === 0) {
		throw new Error('A production-run directory or manifest is required.');
	}
	const options = {productionRunPath: argv[0]};
	for (let index = 1; index < argv.length; index += 1) {
		if (argv[index] !== '--output-root') throw new Error(`Unknown argument: ${argv[index]}`);
		const outputRoot = argv[++index];
		if (!outputRoot) throw new Error('--output-root requires a path.');
		options.outputRoot = resolve(outputRoot);
	}
	return options;
}

const invoked = process.argv[1] && pathToFileURL(process.argv[1]).href;
if (invoked === import.meta.url) {
	try {
		const options = parseArguments(process.argv.slice(2));
		process.stdout.write(`${JSON.stringify(scoreProductionRun(options.productionRunPath, options), null, 2)}\n`);
	} catch (error) {
		console.error(error instanceof Error ? error.stack : error);
		process.exitCode = 1;
	}
}
