import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {E1_CANDIDATE_CONTRACT_PATH, EXPERIMENT_OUTPUT_ROOT, REPOSITORY_ROOT} from './consts.js';
import CacheOptimizationContracts from './lib/CacheOptimizationContracts.js';
import CacheOptimizationContainedFiles from './lib/CacheOptimizationContainedFiles.js';
import {verifyProgressCounts, verifyTerminalProgressCounts} from './verify-run.js';

const {
	acceptArtifactManifest,
	acceptE1CandidateContract,
	acceptE1ConfigurationManifest,
	acceptE1Result,
	acceptE1RuntimeCatalog,
	acceptE1SceneManifest,
	acceptProgressEvent,
} = CacheOptimizationContracts;
const {requireContainedRealFile, requireRealDirectory} = CacheOptimizationContainedFiles;
const RUN_ID_PATTERN = /^\d{6}-e1-format-compression$/u;

/**
 * Read one JSON document.
 *
 * @param {string} filename - Absolute authenticated file path.
 * @returns {Promise<CacheOptimizationJsonObject>} - Parsed document.
 */
async function readJson(filename) {
	return JSON.parse(await readFile(filename, 'utf8'));
}

/**
 * Require one mutation to be rejected by its closed contract.
 *
 * @param {string} label - Stable probe identity.
 * @param {() => void} operation - Validation operation expected to throw.
 * @returns {void}
 */
function requireRejection(label, operation) {
	let rejected = false;
	try {
		operation();
	} catch {
		rejected = true;
	}
	if (!rejected) throw new Error(`E1 negative contract probe was accepted: ${label}`);
}

/**
 * Run the E1 closed-contract mutation probes against one independently sealed graph.
 *
 * @returns {Promise<void>} - Completion after all positive and negative probes pass.
 */
async function main() {
	const runId = process.argv[2];
	if (!RUN_ID_PATTERN.test(runId ?? '')) {
		throw new TypeError('Usage: node verify-e1-contracts.js <six-digit-e1-format-compression-run-id>');
	}
	const runsRoot = await requireRealDirectory(path.join(EXPERIMENT_OUTPUT_ROOT, 'runs'), 'Experiment runs root');
	const runDirectory = await requireRealDirectory(path.join(runsRoot, runId), 'E1 run');
	const manifest = acceptArtifactManifest(await readJson(path.join(runDirectory, 'artifact-manifest.json')));
	/**
	 * Resolve the sole sealed-run artifact matching one required identity pattern.
	 * Rejects when the artifact is missing, duplicated, or escapes the immutable run boundary.
	 *
	 * @param {RegExp} pattern - Run-relative artifact-path pattern.
	 * @param {string} label - Stable diagnostic identity.
	 * @returns {Promise<string>} - Authenticated absolute artifact path.
	 */
	const artifactPath = (pattern, label) => {
		const matches = manifest.artifacts.filter((artifact) => pattern.test(artifact.path));
		if (matches.length !== 1) throw new Error(`${label} artifact is not unique.`);
		return requireContainedRealFile(runDirectory, matches[0].path, label);
	};
	const [contract, result, configuration, catalog, progressText] = await Promise.all([
		readJson(await requireContainedRealFile(REPOSITORY_ROOT, E1_CANDIDATE_CONTRACT_PATH, 'E1 contract')),
		readJson(await requireContainedRealFile(runDirectory, 'result.json', 'E1 result')),
		artifactPath(/^candidate\/metadata\/configurations\//u, 'E1 configuration').then(readJson),
		artifactPath(/^candidate\/metadata\/catalogs\//u, 'E1 catalog').then(readJson),
		readFile(await requireContainedRealFile(runDirectory, 'progress.jsonl', 'E1 progress'), 'utf8'),
	]);
	const progress = progressText
		.trim()
		.split(/\r?\n/u)
		.map((line, index) => acceptProgressEvent(JSON.parse(line), index));
	const acceptedContract = acceptE1CandidateContract(contract);
	const acceptedConfiguration = acceptE1ConfigurationManifest(configuration);
	const acceptedCatalog = acceptE1RuntimeCatalog(catalog);
	const acceptedResult = acceptE1Result(result);
	const terminalEntry = acceptedCatalog.scenes.at(-1);
	if (!terminalEntry) throw new Error('E1 catalog omits its terminal scene.');
	const terminalScene = await readJson(
		await requireContainedRealFile(
			path.join(runDirectory, 'candidate'),
			terminalEntry.manifest.path,
			'E1 terminal scene',
		),
	);

	const acceptedTerminalScene = acceptE1SceneManifest(terminalScene);

	const changedBound = structuredClone(acceptedContract);
	Reflect.set(
		changedBound.bounds,
		'maximumCompleteByteLength',
		changedBound.bounds.maximumCompleteByteLength + 1,
	);
	requireRejection('changed frozen bound', () => acceptE1CandidateContract(changedBound));
	const changedLayout = structuredClone(acceptedConfiguration);
	Reflect.set(changedLayout.layout, 'altitudeCount', 4);
	requireRejection('layout identity and dimensions differ', () => acceptE1ConfigurationManifest(changedLayout));
	const shiftedDomain = structuredClone(acceptedConfiguration);
	Reflect.set(shiftedDomain.coordinateDomains.altitude, 'firstIndex', 1);
	requireRejection('coordinate domain shifted', () => acceptE1ConfigurationManifest(shiftedDomain));
	const duplicatedCatalog = structuredClone(acceptedCatalog);
	Reflect.set(duplicatedCatalog.scenes, 1, structuredClone(duplicatedCatalog.scenes[0]));
	requireRejection('catalog coverage duplicated', () => acceptE1RuntimeCatalog(duplicatedCatalog));
	const changedSelection = structuredClone(acceptedTerminalScene);
	Reflect.set(changedSelection, 'selection', {
		representativeSolarZenithDegrees: 107,
		minimumInputDegrees: 106.5,
		maximumInputExclusiveDegrees: 107,
	});
	requireRejection('nonterminal representative equals exclusive maximum', () =>
		acceptE1SceneManifest(changedSelection),
	);
	const changedDirection = structuredClone(acceptedTerminalScene);
	Reflect.set(changedDirection.sceneSun, 'directionToSourceUpEastNorth', [0.5, 0.5, 0.5]);
	requireRejection('scene-Sun direction is not a unit vector', () => acceptE1SceneManifest(changedDirection));
	const changedWarm = structuredClone(acceptedResult);
	Reflect.set(changedWarm.candidates[0].requests.warm, 'requestCount', 1);
	requireRejection('warm scenario performs work', () => acceptE1Result(changedWarm));
	const changedReuse = structuredClone(acceptedResult);
	Reflect.set(
		changedReuse.candidates[0].requests.neighborReuse,
		'sharedBlockCount',
		changedReuse.candidates[0].requests.neighborReuse.sharedBlockCount + 1,
	);
	requireRejection('neighbor reuse arithmetic differs', () => acceptE1Result(changedReuse));
	const changedOverfetch = structuredClone(acceptedResult);
	Reflect.set(changedOverfetch.candidates[0].requests.overfetch, 'minimumRatio', 0.5);
	requireRejection('request model underfetches', () => acceptE1Result(changedOverfetch));
	verifyProgressCounts(progress, acceptedResult.schemaId);
	const omittedCounts = structuredClone(progress);
	for (const event of omittedCounts.filter((candidate) => candidate.phase === 'input-authentication')) {
		Reflect.deleteProperty(event, 'completed');
		Reflect.deleteProperty(event, 'total');
	}
	requireRejection('countable phase omits counts', () =>
		verifyProgressCounts(omittedCounts, acceptedResult.schemaId),
	);
	const incompleteCounts = structuredClone(progress);
	for (const event of incompleteCounts.filter(
		(candidate) => candidate.phase === 'input-authentication' && candidate.completed === 109,
	)) {
		Reflect.set(event, 'completed', 108);
	}
	requireRejection('countable phase stops before total', () =>
		verifyProgressCounts(incompleteCounts, acceptedResult.schemaId),
	);
	const regressedCounts = structuredClone(progress);
	const regressionIndex = regressedCounts.findIndex(
		(candidate) => candidate.phase === 'input-authentication' && candidate.completed === 50,
	);
	if (regressionIndex < 0) throw new Error('E1 progress lacks the regression-probe anchor.');
	Reflect.deleteProperty(regressedCounts[regressionIndex], 'completed');
	Reflect.deleteProperty(regressedCounts[regressionIndex], 'total');
	Reflect.set(regressedCounts[regressionIndex + 1], 'completed', 1);
	requireRejection('count resets after a count-free delimiter', () =>
		verifyProgressCounts(regressedCounts, acceptedResult.schemaId),
	);
	const failedResult = structuredClone(acceptedResult);
	Reflect.set(failedResult, 'accepted', false);
	Reflect.set(failedResult, 'conclusion', 'failed');
	verifyTerminalProgressCounts(omittedCounts, failedResult);

	process.stdout.write(`${JSON.stringify({runId, acceptedBaselines: 7, rejectedMutations: 12})}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
