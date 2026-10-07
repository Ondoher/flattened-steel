import {createHash} from 'node:crypto';
import {copyFileSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync} from 'node:fs';
import {dirname, join, relative, resolve} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import DistantSunSharedCacheGenerationFiles from '../../algorithm32/solar-zenith-cache/DistantSunSharedCacheGenerationFiles.js';
import {DistantSunSceneCacheNumerics} from '../../algorithm32/solar-zenith-cache/DistantSunSceneCacheNumerics.js';

import {Algorithm32} from '../../../src/algorithm32/implementation/algorithm32/Algorithm32.js';
import {SharedModel} from '../../../src/algorithm32/implementation/algorithm32/model/SharedModel.js';
import {DistantSunCpuCache} from '../../../src/algorithm32/implementation/distant-sun/cache/DistantSunCpuCache.js';
import {B1_PHYSICAL_MEASUREMENT_BOUNDARY} from '../../algorithm32/production-b-experiments/B1MeasurementBoundary.js';
import {makeCube} from '../b3-matched-atmosphere-solver/cube.js';
import {CAPTURE_TIMES, loadKiderDataset, EXPECTED_DATASET_FINGERPRINTS} from './benchmark.js';
import B1ReferenceInputs from './B1ReferenceInputs.js';
import {createBrunetonProductionProfile, createViewDirection} from './production-profile.js';
import {ProductionGpuHost} from './ProductionGpuHost.js';
import {ProductionRun} from './ProductionRun.js';
import {publishProductionB1Result} from './publish-production-result.js';
import {resolveProductionResultRoot} from '../production-result-paths.js';
import B1PointLocalCacheAssets, {
	B1_POINT_LOCAL_COMPILER_IDENTITY,
} from '../../algorithm32/production-b-experiments/B1PointLocalCacheAssets.js';

const INCOMING_VARIANT_METADATA = Object.freeze({
	'production-68': Object.freeze({profileFamily: 'paper', profileSuffix: '', presentationSuffix: ''}),
	'ordinary-fibonacci-34': Object.freeze({
		profileFamily: 'paper-ordinary-fibonacci-34',
		profileSuffix: '-ordinary-fibonacci-34',
		presentationSuffix: ' Historical Ordinary Fibonacci-34',
	}),
	'bruneton-angular-288': Object.freeze({
		profileFamily: 'paper-bruneton-angular-288',
		profileSuffix: '-bruneton-angular-288',
		presentationSuffix: ' Experimental Bruneton Angular 12x24',
		recycleGpuSessionBetweenConditions: true,
	}),
	'bruneton-angular-392': Object.freeze({
		profileFamily: 'paper-bruneton-angular-392',
		profileSuffix: '-bruneton-angular-392',
		presentationSuffix: ' Experimental Bruneton Angular 14x28',
		recycleGpuSessionBetweenConditions: true,
	}),
	'bruneton-angular-512': Object.freeze({
		profileFamily: 'paper-bruneton-angular-512',
		profileSuffix: '-bruneton-angular-512',
		presentationSuffix: ' Experimental Bruneton Angular 16x32',
		recycleGpuSessionBetweenConditions: true,
	}),
	'paired-fibonacci-272': Object.freeze({
		profileFamily: 'paper-paired-fibonacci-272',
		profileSuffix: '-paired-fibonacci-272',
		presentationSuffix: ' Experimental Paired Fibonacci-272',
	}),
	'paired-fibonacci-544': Object.freeze({
		profileFamily: 'paper-paired-fibonacci-544',
		profileSuffix: '-paired-fibonacci-544',
		presentationSuffix: ' Experimental Paired Fibonacci-544',
	}),
	'reflection-completed-ordinary-68': Object.freeze({
		profileFamily: 'paper-reflection-completed-ordinary-68',
		profileSuffix: '-reflection-completed-ordinary-68',
		presentationSuffix: ' Experimental Reflection-Completed Ordinary Fibonacci-68',
	}),
	'reflection-completed-136': Object.freeze({
		profileFamily: 'paper-reflection-completed-136',
		profileSuffix: '-reflection-completed-136',
		presentationSuffix: ' Experimental Reflection-Completed 136',
	}),
});
const CPU_REFERENCE_COMPILER_IDENTITY = 'algorithm32-b1-cpu-reference-binary64-v1';
const REPOSITORY_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

/** Called by command parsing to normalize a required comma-separated selection.
 *
 * @param {string} value - Raw comma-separated argument.
 * @param {string} label - Command option used in diagnostics.
 * @returns {string[]} - Trimmed nonempty selection tokens.
 */
function parseList(value, label) {
	if (!value) throw new Error(`${label} requires a comma-separated value.`);
	return value
		.split(',')
		.map((item) => item.trim())
		.filter(Boolean);
}

/** Call this method to validate explicit production generation command options.
 *
 * @param {string[]} argv - Command arguments excluding executable and script.
 * @returns {object} - Validated generation selections.
 */
export function parseArguments(argv) {
	const options = {
		backend: 'gpu',
		orders: [...ProductionRun.REQUIRED_ORDERS],
		conditions: [...CAPTURE_TIMES],
		incomingDirectionVariant: 'production-68',
		dryRun: false,
		measureGpuCompletion: false,
	};
	for (let index = 0; index < argv.length; index += 1) {
		const argument = argv[index];
		if (argument === '--dry-run') {
			options.dryRun = true;
		} else if (argument === '--measure-gpu-completion') {
			options.measureGpuCompletion = true;
		} else if (argument === '--backend') {
			options.backend = argv[++index];
		} else if (argument === '--orders') {
			options.orders = parseList(argv[++index], '--orders').map(Number);
		} else if (argument === '--conditions') {
			options.conditions = parseList(argv[++index], '--conditions');
		} else if (argument === '--incoming-direction-variant') {
			options.incomingDirectionVariant = argv[++index];
		} else if (argument === '--position-domain') {
			options.positionDomain = argv[++index];
			if (!['native48', 'native51-near-ground'].includes(options.positionDomain))
				throw new RangeError('--position-domain must select native48 or native51-near-ground.');
		} else if (argument === '--output-root') {
			const outputRoot = argv[++index];
			if (!outputRoot) throw new Error('--output-root requires a path.');
			options.outputRoot = resolve(outputRoot);
		} else if (argument === '--staging-root') {
			const stagingRoot = argv[++index];
			if (!stagingRoot) throw new Error('--staging-root requires a path.');
			options.stagingRoot = resolve(stagingRoot);
		} else if (argument === '--progress-log') {
			const progressLogPath = argv[++index];
			if (!progressLogPath) throw new Error('--progress-log requires a path.');
			options.progressLogPath = resolve(progressLogPath);
		} else if (argument === '--asset-set') {
			const assetSetDirectory = argv[++index];
			if (!assetSetDirectory) throw new Error('--asset-set requires a path.');
			options.assetSetDirectory = resolve(assetSetDirectory);
		} else if (argument === '--surface-limit') {
			if (options.numericalPolicy) throw new Error('Select one numerical policy.');
			options.numericalPolicy = DistantSunSceneCacheNumerics.createSurfaceLimit(Number(argv[++index]));
		} else if (argument === '--numerical-policy') {
			if (options.numericalPolicy || argv[++index] !== 'anchored-radial')
				throw new Error('Select one supported numerical policy.');
			options.numericalPolicy = DistantSunSceneCacheNumerics.createAnchoredRadial();
		} else if (argument === '--solar-interpolation') {
			options.solarInterpolation = argv[++index];
			if (!['linear', 'monotone-cubic'].includes(options.solarInterpolation))
				throw new RangeError('Unsupported solar interpolation.');
		} else if (argument === '--production-revision') {
			options.productionRevision = argv[++index];
			if (!options.productionRevision) throw new Error('--production-revision requires an identity.');
		} else {
			throw new Error(`Unknown argument: ${argument}`);
		}
	}
	if (!['cpu', 'gpu'].includes(options.backend)) {
		throw new RangeError('--backend must be cpu or gpu.');
	}
	if (
		(options.numericalPolicy || options.solarInterpolation) &&
		(options.backend !== 'gpu' || options.assetSetDirectory)
	) {
		throw new Error('Candidate compiler options require freshly generated GPU assets.');
	}
	if (options.measureGpuCompletion && options.backend !== 'gpu') {
		throw new Error('--measure-gpu-completion requires --backend gpu.');
	}
	if ((options.assetSetDirectory || options.productionRevision) && options.backend !== 'gpu') {
		throw new Error('--asset-set and --production-revision require --backend gpu.');
	}
	if (!(options.incomingDirectionVariant in INCOMING_VARIANT_METADATA)) {
		throw new RangeError(
			'--incoming-direction-variant must select production-68 or one registered diagnostic variant.',
		);
	}
	if (options.orders.some((order) => !Number.isInteger(order) || order < 1 || order > 5)) {
		throw new RangeError('--orders values must be integers from 1 through 5.');
	}
	if (new Set(options.orders).size !== options.orders.length) {
		throw new RangeError('--orders values must be unique.');
	}
	if (options.conditions.some((time) => !CAPTURE_TIMES.includes(time))) {
		throw new RangeError('--conditions values must be canonical B1 capture times.');
	}
	if (new Set(options.conditions).size !== options.conditions.length) {
		throw new RangeError('--conditions values must be unique.');
	}
	return options;
}

/**
 * Call this function to allocate an isolated staging directory for one production generation.
 *
 * @param {string} outputRoot - The final experiment/backend result directory.
 * @param {'cpu' | 'gpu'} backend - The selected production execution backend.
 * @returns {{runId: string, runDirectory: string, outputDirectory: string}} - The staged run identity and paths.
 */
function allocateRunDirectory(outputRoot, backend, requestedStagingRoot) {
	mkdirSync(outputRoot, {recursive: true});
	const stagingRoot =
		requestedStagingRoot ?? resolve(REPOSITORY_ROOT, 'tmp/algorithm32-bruneton-paper/b1-production-staging');
	mkdirSync(stagingRoot, {recursive: true});
	const runId = `current-production-b1-${backend === 'gpu' ? 'gpu-shaders' : 'cpu-reference'}-${new Date()
		.toISOString()
		.replace(/[-:.]/g, '')}`;
	const runDirectory = mkdtempSync(join(stagingRoot, `${backend}-`));
	return {runId, runDirectory, outputDirectory: outputRoot};
}

/**
 * Call this function to publish a complete staged run directly into its experiment/backend directory.
 *
 * @param {string} runDirectory - The complete isolated staging directory.
 * @param {string} outputDirectory - The final experiment/backend result directory.
 * @returns {void} - The staged files are copied and the staging directory is removed.
 */
function publishRun(runDirectory, outputDirectory) {
	const entries = readdirSync(runDirectory, {withFileTypes: true});
	for (const entry of entries.filter((candidate) => candidate.name !== 'manifest.json')) {
		if (!entry.isFile()) throw new Error(`Unexpected staged B1 output: ${entry.name}`);
		copyFileSync(join(runDirectory, entry.name), join(outputDirectory, entry.name));
	}
	const manifestEntry = entries.find((entry) => entry.name === 'manifest.json');
	if (!manifestEntry?.isFile()) throw new Error('Complete staged B1 output is missing manifest.json.');
	copyFileSync(join(runDirectory, manifestEntry.name), join(outputDirectory, manifestEntry.name));
	rmSync(runDirectory, {recursive: true, force: true});
}

/** Called by immutable output assembly to authenticate canonical JSON text.
 *
 * @param {string} text - Exact serialized text.
 * @returns {string} - Lowercase SHA-256 digest.
 */
function sha256(text) {
	return createHash('sha256').update(text).digest('hex');
}

/** Called by generation to write one exclusive JSON artifact and return its identity.
 *
 * @param {string} path - Exclusive destination file.
 * @param {object} value - JSON-safe artifact value.
 * @returns {string} - SHA-256 digest of persisted canonical text.
 */
function writeJson(path, value) {
	const text = `${JSON.stringify(value, null, 2)}\n`;
	writeFileSync(path, text, {encoding: 'utf8', flag: 'wx'});
	return sha256(text);
}

/** Called by generation to report distinct cache-construction progress states.
 *
 * @param {number} order - Requested scattering order.
 * @param {string} time - Registered local benchmark time.
 * @returns {Function} - Progress observer retaining its last reported state.
 */
function createProgressReporter(order, time) {
	let previousKey = '';
	return (progress) => {
		const key = `${progress.phase}/${progress.order}/${progress.completed}/${progress.total}`;
		if (key === previousKey) return;
		previousKey = key;
		process.stderr.write(
			`[B1 ${time} J${order}] ${progress.phase} J${progress.order} ${progress.completed}/${progress.total}\n`,
		);
	};
}

/** Called by benchmark output assembly to retain the fixed 40-channel table boundary.
 *
 * @returns {string} - Tab-separated measurement header.
 */
function tableHeader() {
	return ['model', 'time', 'grid_x', 'grid_y', ...Array.from({length: 40}, (_, index) => `lambda_${index}`)].join(
		'\t',
	);
}

/** Call this method to execute the selected production benchmark generation and preserve immutable output.
 *
 * @param {object} [options] - Explicit backend, conditions, numerical policy, and output selections.
 * @returns {Promise<object>} - Completed generation result and evidence paths.
 */
export async function runGeneration(options = {}) {
	const backend = options.backend ?? 'gpu';
	if (!['cpu', 'gpu'].includes(backend)) throw new RangeError('Generation backend must be cpu or gpu.');
	const orders = options.orders ?? ProductionRun.REQUIRED_ORDERS;
	const requestedTimes = options.conditions ?? CAPTURE_TIMES;
	const incomingDirectionVariant = options.incomingDirectionVariant ?? 'production-68';
	const positionDomain = options.positionDomain ?? 'native48';
	if (positionDomain !== 'native48' && !options.dryRun && (!options.outputRoot || backend !== 'gpu')) {
		throw new Error('A refined position domain requires GPU generation and an explicit --output-root.');
	}
	const variantMetadata = INCOMING_VARIANT_METADATA[incomingDirectionVariant];
	if (variantMetadata === undefined)
		throw new RangeError(`Unknown incoming-direction variant: ${incomingDirectionVariant}.`);
	const {profileFamily} = variantMetadata;
	const outputRoot = resolveProductionResultRoot(options.outputRoot, 'b1-directional-sky-radiance', backend);
	const completeCanonicalSelection =
		incomingDirectionVariant === 'production-68' &&
		orders.length === ProductionRun.REQUIRED_ORDERS.length &&
		orders.every((order, index) => order === ProductionRun.REQUIRED_ORDERS[index]) &&
		requestedTimes.length === CAPTURE_TIMES.length &&
		requestedTimes.every((time, index) => time === CAPTURE_TIMES[index]);
	if (!options.dryRun && !options.outputRoot && !completeCanonicalSelection) {
		throw new Error('A bounded or experimental production generation requires an explicit --output-root.');
	}
	const dataset = loadKiderDataset();
	for (const [key, expected] of Object.entries(EXPECTED_DATASET_FINGERPRINTS))
		if (dataset[key] !== expected)
			throw new Error(`Official B1 measurement ${key} differs from the pinned baseline.`);
	const referenceInputs = {bundle: B1ReferenceInputs.identity(), ...EXPECTED_DATASET_FINGERPRINTS};
	const conditions = requestedTimes.map((time) => dataset.conditions.find((condition) => condition.time === time));
	const profiles = conditions.flatMap((condition) =>
		orders.map((order) =>
			createBrunetonProductionProfile({
				time: condition.time,
				fittedAzimuthDegrees: condition.sun.fittedAzimuthDegrees,
				maximumScatteringOrder: order,
				incomingDirectionVariant,
				positionDomain,
			}),
		),
	);
	const selectedIncomingDirectionDomain = profiles[0].domains.incomingDirections;
	const selectedPositionDomain = profiles[0].domains.positions;

	if (options.dryRun) {
		for (const profile of profiles) {
			const algorithm = new Algorithm32({profile});
			algorithm.dispose();
		}
		return {
			status: 'DRY-RUN',
			backend,
			profiles: profiles.map((profile) => ({id: profile.id, contentHash: profile.contentHash})),
		};
	}
	const runtimeSourceIdentity = backend === 'gpu' ? await B1PointLocalCacheAssets.sourceIdentity() : null;
	if (backend === 'gpu' && !options.assetSetDirectory) {
		if (!completeCanonicalSelection)
			throw new Error('Automatic production cache generation requires the canonical B1 selection.');
		const compiled = await B1PointLocalCacheAssets.compileSet({
			numericalPolicy: options.numericalPolicy,
			solarInterpolation: options.solarInterpolation,
			positionDomain,
			conditions: conditions.map((condition) => ({
				id: `b1-${condition.time}`,
				localTime: condition.time,
				fittedAzimuthDegrees: condition.sun.fittedAzimuthDegrees,
			})),
			sourceIdentity: runtimeSourceIdentity,
			referenceInputs,
			onProgress: (progress) => process.stderr.write(`[B1 compiler] ${JSON.stringify(progress)}\n`),
		});
		options = {
			...options,
			assetSetDirectory: compiled.outputDirectory,
			productionRevision: compiled.productionRevision,
		};
	}
	if (backend === 'gpu' && !options.productionRevision)
		throw new Error('Reusing an asset set requires its --production-revision identity.');

	const outputFiles = new DistantSunSharedCacheGenerationFiles(REPOSITORY_ROOT);
	const stagingRoot =
		options.stagingRoot ?? resolve(REPOSITORY_ROOT, 'tmp/algorithm32-bruneton-paper/b1-production-staging');
	for (const directory of [outputRoot, stagingRoot])
		await outputFiles.directory(relative(REPOSITORY_ROOT, directory).replaceAll('\\', '/'));
	const {runId, runDirectory, outputDirectory} = allocateRunDirectory(outputRoot, backend, stagingRoot);
	const startedAt = new Date().toISOString();
	const outputs = [];
	const gpuProgressLogPath =
		backend === 'gpu'
			? (options.progressLogPath ??
				resolve(REPOSITORY_ROOT, 'tmp/algorithm32-bruneton-paper/b1-production-gpu-progress.log'))
			: null;
	const gpuHost =
		backend === 'gpu'
			? new ProductionGpuHost({
					progressLogPath: gpuProgressLogPath,
					assetSetDirectory: options.assetSetDirectory,
					productionRevision: options.productionRevision,
				})
			: null;
	let gpuCapabilities = null;
	let gpuAssetInputs = null;
	let generatedGpuConditionCount = 0;

	try {
		await gpuHost?.open();
		gpuAssetInputs = gpuHost?.assetSetProvenance ?? null;
		for (const order of orders) {
			let viewPath;
			const lines = [tableHeader()];
			const profileRecords = [];
			const cubeValues = [];
			const gpuConditionDiagnostics = [];
			for (const condition of conditions) {
				const profile = createBrunetonProductionProfile({
					time: condition.time,
					fittedAzimuthDegrees: condition.sun.fittedAzimuthDegrees,
					maximumScatteringOrder: order,
					incomingDirectionVariant,
					positionDomain,
				});
				viewPath = profile.numerical.viewPath;
				process.stderr.write(`[B1 ${condition.time} J${order} ${backend}] constructing production cache\n`);
				let algorithm = null;
				let cache = null;
				let gpuValues = null;
				if (backend === 'gpu') {
					if (variantMetadata.recycleGpuSessionBetweenConditions === true && generatedGpuConditionCount > 0) {
						await gpuHost.recycleSession();
					}
					const gpuResult = await gpuHost.generateCondition({
						time: condition.time,
						fittedAzimuthDegrees: condition.sun.fittedAzimuthDegrees,
						maximumScatteringOrder: order,
						incomingDirectionVariant,
						positionDomain,
						measureGpuCompletion: options.measureGpuCompletion === true,
					});
					generatedGpuConditionCount += 1;
					if (gpuResult.measurementBoundaryIdentity !== B1_PHYSICAL_MEASUREMENT_BOUNDARY.identity) {
						throw new Error('B1 GPU result did not preserve the Color-free physical measurement boundary.');
					}
					gpuValues = gpuResult.values;
					gpuCapabilities ??= gpuResult.capabilities;
					gpuConditionDiagnostics.push({
						time: condition.time,
						assetSetIdentity: gpuResult.assetSetIdentity,
						assetIdentity: gpuResult.assetIdentity,
						shaderDiagnostics: gpuResult.shaderDiagnostics,
						shaderSourceMetrics: gpuResult.shaderSourceMetrics,
						executionTimings: gpuResult.executionTimings,
					});
				} else {
					algorithm = new Algorithm32({profile});
					const model = new SharedModel({version: 1, profile});
					const buildResult = profile.models.lightSource.buildCpuScatteringCache({
						model,
						onProgress: createProgressReporter(order, condition.time),
					});
					cache = new DistantSunCpuCache(buildResult);
				}

				const conditionCubeValues = [];
				for (let gridX = 0; gridX < 9; gridX += 1) {
					for (let gridY = 0; gridY < 9; gridY += 1) {
						const values =
							backend === 'gpu'
								? gpuValues[gridY * 9 + gridX]
								: algorithm.evaluate({
										viewRay: {direction: createViewDirection(gridX, gridY)},
										scatteringCache: cache,
									}).pathRadiance.values;
						if (values.some((value) => !Number.isFinite(value) || value < 0)) {
							throw new Error(
								`Production returned invalid radiance at ${condition.time}/${gridX}/${gridY}/J${order}.`,
							);
						}
						lines.push(
							[
								'proposed',
								condition.time,
								gridX,
								gridY,
								...values.map((value) => value.toPrecision(17)),
							].join('\t'),
						);
						conditionCubeValues.push([...values.slice(0, 31)]);
					}
				}
				cubeValues.push(conditionCubeValues);
				profileRecords.push({
					id: profile.id,
					contentHash: profile.contentHash,
					time: condition.time,
					fittedAzimuthDegrees: condition.sun.fittedAzimuthDegrees,
				});
				cache?.dispose();
				algorithm?.dispose();
				process.stderr.write(`[B1 ${condition.time} J${order} ${backend}] complete\n`);
			}

			const table = `${lines.join('\n')}\n`;
			const tableName = `algorithm32-current-production-${backend}-j${order}.tsv`;
			const tablePath = join(runDirectory, tableName);
			writeFileSync(tablePath, table, {encoding: 'utf8', flag: 'wx'});
			const tableSha256 = sha256(table);
			const provenance = {
				schema: 'algorithm32-current-production-b1-provenance-v2',
				runId,
				backend: backend === 'gpu' ? 'gpu-production-shaders-r32f' : 'cpu-reference-binary64',
				executionBoundary:
					backend === 'gpu'
						? 'production GPU cache construction and production final-view transport shader with native spectral readout'
						: 'production binary64 CPU cache construction and reference final-view evaluation',
				gpuCapabilities: backend === 'gpu' ? gpuCapabilities : null,
				runtimeSourceIdentity,
				referenceInputs,
				cacheRepresentation:
					gpuAssetInputs?.compilerIdentity === B1_POINT_LOCAL_COMPILER_IDENTITY
						? `receiver-local-${positionDomain}-z180-w27`
						: 'source-aligned-native48-w27',
				gpuConditionDiagnostics: backend === 'gpu' ? gpuConditionDiagnostics : null,
				modelNameInBenchmarkTables: 'proposed',
				profileId: `paper-j${order}${variantMetadata.profileSuffix}`,
				presentationName: `Algorithm32 Paper J${order}${variantMetadata.presentationSuffix}`,
				physicalProfileId: 'algorithm32-paper-comparison-v1',
				physicalProfileContentHash: 'sha256:d47601d954167ca8775c0a88cd8ca9b9527ae8e74a6f42ae6041eec3244aeecc',
				order,
				rowCount: conditions.length * 81,
				completeCanonicalBoundary: conditions.length === 17,
				physicalMeasurementBoundary: B1_PHYSICAL_MEASUREMENT_BOUNDARY,
				spectralChannelCount: 40,
				nativeSpectralBoundary: {
					channelCount: 40,
					centersNanometers: Array.from({length: 40}, (_, index) => 360 + (470 * index) / 40),
					sampleSemantics: 'point-sampled-spectral-density',
					projection: 'identity-direct-40',
				},
				numericalControls: {
					pathIntervalCount: viewPath.intervalCount,
					...(viewPath.sampleDistribution === null
						? {}
						: {pathSampleDistribution: viewPath.sampleDistribution.kind}),
					sourceTransmittanceIntervalCount: 20,
					incidentDirectionCount: selectedIncomingDirectionDomain.directionCount,
					incidentAltitudeBinCount: selectedPositionDomain.count,
					incomingDirectionDomain: selectedIncomingDirectionDomain.id,
					scatteringOutputDomain:
						gpuAssetInputs?.compilerIdentity === B1_POINT_LOCAL_COMPILER_IDENTITY
							? 'receiver-local-boundary-inclusive-gnomonic-cubed-sphere-w27'
							: 'source-aligned-boundary-inclusive-gnomonic-cubed-sphere-w27',
					scatteringOutputFaceWidth: 27,
					...(gpuAssetInputs?.compilerIdentity === B1_POINT_LOCAL_COMPILER_IDENTITY
						? {
								outgoingInterpolation: 'shader-bilinear-f32',
								solarZenithEvaluation: 'range-reduced-atan-series-17',
							}
						: {}),
					scatteringOutputDirectionCount: 4374,
					positionNodeCount: selectedPositionDomain.count,
					...(positionDomain === 'native51-near-ground'
						? {
								positionDomain: {
									selection: positionDomain,
									id: selectedPositionDomain.id,
									nodes: selectedPositionDomain.nodes,
								},
							}
						: {}),
					positionLookup: 'view-only-linear-physical-altitude-over-actual-nodes',
					maximumScatteringOrder: order,
				},
				table: {name: tableName, sha256: tableSha256, byteLength: Buffer.byteLength(table)},
				profiles: profileRecords,
			};
			const provenanceName = `algorithm32-current-production-${backend}-j${order}-provenance.json`;
			const provenanceSha256 = writeJson(join(runDirectory, provenanceName), provenance);
			let defaultProvenance = null;
			let defaultProvenanceSha256 = null;
			if (order === 4) {
				defaultProvenance = `algorithm32-current-production-${backend}-default-provenance.json`;
				defaultProvenanceSha256 = writeJson(join(runDirectory, defaultProvenance), {
					...provenance,
					profileId: `paper${variantMetadata.profileSuffix}`,
					presentationName: `Algorithm32 Paper${variantMetadata.presentationSuffix}`,
				});
			}
			let cube = null;
			let cubeSha256 = null;
			if (
				conditions.length === CAPTURE_TIMES.length &&
				conditions.every((condition, index) => condition.time === CAPTURE_TIMES[index])
			) {
				cube = `algorithm32-current-production-${backend}-j${order}-cube.json`;
				cubeSha256 = writeJson(
					join(runDirectory, cube),
					makeCube(cubeValues, {
						source: `current production Algorithm32 B1 ${backend} boundary`,
						runId,
						order,
						table: tableName,
						tableSha256,
					}),
				);
			}
			outputs.push({
				order,
				table: tableName,
				tableSha256,
				provenance: provenanceName,
				provenanceSha256,
				cube,
				cubeSha256,
				defaultProvenance,
				defaultProvenanceSha256,
				derivation: {
					inputAssetSetIdentity: gpuAssetInputs?.assetSetIdentity ?? null,
					inputProfileHashes: profileRecords.map(({time, id, contentHash}) => ({time, id, contentHash})),
					operation:
						'production final-view directional spectral-radiance evaluation; first 31 channels form the B3 cube',
				},
			});
		}
	} finally {
		await gpuHost?.close();
	}

	const profileHashes = profiles.map((profile, index) => ({
		order: profile.numerical.cacheConstruction.maximumScatteringOrder,
		time: conditions[Math.floor(index / orders.length)].time,
		id: profile.id,
		contentHash: profile.contentHash,
	}));
	const manifest = {
		schema: ProductionRun.MANIFEST_SCHEMA,
		runId,
		backend: backend === 'gpu' ? 'gpu-production-shaders-r32f' : 'cpu-reference-binary64',
		executionIdentity:
			backend === 'gpu' ? 'algorithm32-b1-production-gpu-final-view-r32f-v1' : CPU_REFERENCE_COMPILER_IDENTITY,
		canonicality: {
			kind: completeCanonicalSelection ? 'canonical-candidate' : 'bounded-or-diagnostic',
			publicationEligible: completeCanonicalSelection,
		},
		runtimeSourceIdentity,
		referenceInputs,
		productionRevision: gpuAssetInputs?.productionRevision ?? null,
		compilerIdentity: gpuAssetInputs?.compilerIdentity ?? CPU_REFERENCE_COMPILER_IDENTITY,
		assetSetIdentity: gpuAssetInputs?.assetSetIdentity ?? null,
		assetSet: gpuAssetInputs?.assetSet ?? null,
		assetSetManifest: gpuAssetInputs?.assetSetManifest ?? null,
		assets: gpuAssetInputs?.assets ?? [],
		profileHashes,
		gpuCapabilities: backend === 'gpu' ? gpuCapabilities : null,
		gpuProgressLogPath,
		status: 'COMPLETE',
		startedAt,
		completedAt: new Date().toISOString(),
		conditions: requestedTimes,
		orders,
		profileFamily,
		incomingDirectionVariant,
		...(positionDomain === 'native51-near-ground' ? {positionDomain} : {}),
		outputs,
	};
	writeJson(join(runDirectory, 'manifest.json'), manifest);
	publishRun(runDirectory, outputDirectory);
	const completeCanonicalB1 =
		requestedTimes.length === CAPTURE_TIMES.length &&
		requestedTimes.every((time, index) => time === CAPTURE_TIMES[index]) &&
		orders.length === 1 &&
		orders[0] === 4;
	const b1Publication = completeCanonicalB1
		? publishProductionB1Result(join(outputDirectory, 'manifest.json'), {outputRoot: options.outputRoot})
		: null;
	return {...manifest, runDirectory: outputDirectory, b1Publication};
}

const invoked = process.argv[1] && pathToFileURL(process.argv[1]).href;
if (invoked === import.meta.url) {
	try {
		const result = await runGeneration(parseArguments(process.argv.slice(2)));
		process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
	} catch (error) {
		console.error(error instanceof Error ? error.stack : error);
		process.exitCode = 1;
	}
}
