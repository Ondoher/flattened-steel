import {createHash} from 'node:crypto';
import {lstat, readFile, readdir, realpath, stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {
	C0_ACCEPTED_INVENTORY_PATH,
	C0_ACCEPTED_MANIFEST_PATH,
	EXPERIMENT_OUTPUT_ROOT,
	REPOSITORY_ROOT,
} from './consts.js';
import CacheOptimizationContracts from './lib/CacheOptimizationContracts.js';
import CacheOptimizationContainedFiles from './lib/CacheOptimizationContainedFiles.js';
import CacheOptimizationE1CandidateVerifier from './lib/CacheOptimizationE1CandidateVerifier.js';

const {
	acceptArtifactManifest,
	acceptC0Result,
	acceptE2Result,
	acceptE1Result,
	acceptInventoryPins,
	acceptProgressEvent,
	acceptTerminalResult,
	requireContractPath,
	requireRecord,
	requireSha256,
} = CacheOptimizationContracts;
const {requireContainedRealFile, requireRealDirectory, sha256File} = CacheOptimizationContainedFiles;

const ARTIFACT_MANIFEST_NAME = 'artifact-manifest.json';
const RUN_ID_PATTERN = /^\d{6}-[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const E1_PROGRESS_SEGMENT_TOTALS = {
	'input-authentication': [109],
	'coordinate-extraction': [5_494],
	'scene-reconstruction': [109],
	'candidate-build': [356, 356, 356, 178, 178, 178, 94, 94, 94, 89, 89, 89, 89],
	'published-verification': [109],
};
const C0_PROGRESS_SEGMENT_TOTALS = {'inventory-authentication': [109]};

/**
 * Validate the exact count-bearing work segments required by one accepted result schema.
 * Rejects omitted, incomplete, reset, regressed, or unexpected progress segments.
 *
 * @param {readonly CacheOptimizationProgressEvent[]} progress - Accepted ordered progress events.
 * @param {string} resultSchemaId - Accepted terminal result schema identity.
 * @returns {void}
 */
export function verifyProgressCounts(progress, resultSchemaId) {
	const expectedByPhase =
		resultSchemaId === 'distant-sun-cache-optimization-e1-result-v2'
			? E1_PROGRESS_SEGMENT_TOTALS
			: resultSchemaId === 'distant-sun-cache-optimization-c0-result-v2'
				? C0_PROGRESS_SEGMENT_TOTALS
				: {};
	for (const [phase, expectedTotals] of Object.entries(expectedByPhase)) {
		const segments = [];
		let active;
		for (const event of progress) {
			if (event.phase !== phase || event.completed === undefined || event.total === undefined) continue;
			if (!active || active.completed === active.total) {
				if (active && event.completed === active.completed && event.total === active.total) continue;
				active = {completed: event.completed, total: event.total};
				segments.push(active);
				continue;
			}
			if (event.total !== active.total || event.completed < active.completed) {
				throw new Error(`Progress count reset or regressed within phase: ${phase}`);
			}
			active.completed = event.completed;
		}
		if (
			segments.length !== expectedTotals.length ||
			segments.some(
				(segment, index) => segment.total !== expectedTotals[index] || segment.completed !== segment.total,
			)
		) {
			throw new Error(`Progress count segments are incomplete or differ for phase: ${phase}`);
		}
	}
}

/**
 * Apply exact completion totals only to an accepted E1 or C0 terminal result.
 * Failed, rejected, and interrupted evidence retains its partial progress without claiming accepted completion.
 *
 * @param {readonly CacheOptimizationProgressEvent[]} progress - Accepted ordered progress events.
 * @param {CacheOptimizationTerminalResult} result - Accepted terminal result envelope.
 * @returns {void}
 */
export function verifyTerminalProgressCounts(progress, result) {
	if (result.accepted === true) verifyProgressCounts(progress, result.schemaId);
}

/**
 * Enumerate a sealed run without following symbolic links or reparse entries.
 *
 * @param {string} directory - Current absolute directory.
 * @param {string} prefix - Run-relative directory prefix.
 * @returns {Promise<string[]>} - Normalized run-relative file paths.
 */
async function listFiles(directory, prefix = '') {
	const files = [];
	for (const entry of await readdir(directory, {withFileTypes: true})) {
		if (entry.isSymbolicLink()) throw new Error(`Run contains a symbolic link: ${entry.name}`);
		const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
		const absolutePath = path.join(directory, entry.name);
		const information = await lstat(absolutePath);
		if (information.isSymbolicLink()) throw new Error(`Run contains a reparse boundary: ${relativePath}`);
		if (information.isDirectory()) files.push(...(await listFiles(absolutePath, relativePath)));
		else if (information.isFile()) files.push(relativePath);
		else throw new Error(`Run contains an unsupported filesystem entry: ${relativePath}`);
	}
	return files;
}

/**
 * Read one JSON file from a verified run boundary.
 *
 * @param {string} runDirectory - Absolute sealed run directory.
 * @param {string} relativePath - Run-relative JSON path.
 * @returns {Promise<CacheOptimizationJsonObject>} - Parsed JSON object.
 */
async function readJson(runDirectory, relativePath) {
	const target = await requireContainedRealFile(runDirectory, relativePath, relativePath);
	return requireRecord(JSON.parse(await readFile(target, 'utf8')), relativePath);
}

/**
 * Call this function to verify one contained sealed run without mutating it.
 * Rejects any containment, schema, identity, artifact, progress, or terminal-coherence mismatch; callers must treat the run as unverified and leave it unchanged.
 *
 * @param {string} runDirectory - Absolute real run directory.
 * @param {string} runId - Expected six-digit-prefixed run identity.
 * @returns {Promise<CacheOptimizationSealedRunVerification>} - Authenticated terminal summary.
 */
export async function verifySealedRun(runDirectory, runId) {
	const manifest = acceptArtifactManifest(await readJson(runDirectory, ARTIFACT_MANIFEST_NAME));
	if (manifest.runId !== runId) throw new Error('Artifact manifest run identity mismatch.');

	const actualPaths = (await listFiles(runDirectory)).filter((value) => value !== ARTIFACT_MANIFEST_NAME).sort();
	const declaredPaths = manifest.artifacts.map((artifact) => artifact.path);
	if (JSON.stringify(actualPaths) !== JSON.stringify(declaredPaths)) {
		throw new Error('Sealed run files differ from the canonical artifact manifest.');
	}

	const verifiedArtifacts = [];
	for (const artifact of manifest.artifacts) {
		const target = await requireContainedRealFile(runDirectory, artifact.path, artifact.path);
		const information = await stat(target);
		const sha256 = await sha256File(target);
		if (information.size !== artifact.byteLength || sha256 !== artifact.sha256) {
			throw new Error(`Artifact identity mismatch: ${artifact.path}`);
		}
		verifiedArtifacts.push({path: artifact.path, byteLength: information.size, sha256});
	}
	const artifactSetSha256 = createHash('sha256').update(JSON.stringify(verifiedArtifacts)).digest('hex');
	if (artifactSetSha256 !== manifest.artifactSetSha256) throw new Error('Artifact-set identity mismatch.');

	const result = acceptTerminalResult(await readJson(runDirectory, 'result.json'), runId, manifest.conclusion);
	if (result.schemaId === 'distant-sun-cache-optimization-c0-result-v2' && result.accepted === true) {
		acceptC0Result(result);
	}
	let semanticVerification;
	let acceptedE1Result;
	let acceptedE2Result;
	if (result.schemaId === 'distant-sun-cache-optimization-e1-result-v2' && result.accepted === true) {
		acceptedE1Result = acceptE1Result(result);
		const controlDirectory = path.dirname(path.join(REPOSITORY_ROOT, C0_ACCEPTED_MANIFEST_PATH));
		const controlVerification = await verifySealedRun(controlDirectory, acceptedE1Result.parent.runId);
		if (controlVerification.artifactSetSha256 !== acceptedE1Result.parent.artifactSetSha256) {
			throw new Error('E1 frozen C0 parent does not independently authenticate.');
		}
		const inputs = await readJson(runDirectory, 'inputs.json');
		if (JSON.stringify(inputs.acceptedC0) !== JSON.stringify(acceptedE1Result.parent)) {
			throw new Error('E1 inputs differ from the accepted C0 parent.');
		}
		const inventoryIdentity = requireRecord(inputs.inventory, 'E1 input inventory identity');
		if (JSON.stringify(Object.keys(inventoryIdentity).sort()) !== JSON.stringify(['path', 'sha256'])) {
			throw new Error('E1 input inventory identity properties changed.');
		}
		const inventoryPath = requireContractPath(inventoryIdentity.path, 'E1 input inventory path');
		const inventorySha256 = requireSha256(inventoryIdentity.sha256, 'E1 input inventory SHA-256');
		if (inventoryPath !== C0_ACCEPTED_INVENTORY_PATH) throw new Error('E1 input inventory path changed.');
		const inventoryTarget = await requireContainedRealFile(
			REPOSITORY_ROOT,
			C0_ACCEPTED_INVENTORY_PATH,
			'Accepted C0 inventory',
		);
		if ((await sha256File(inventoryTarget)) !== inventorySha256) {
			throw new Error('E1 input inventory identity changed.');
		}
		const inventory = acceptInventoryPins(JSON.parse(await readFile(inventoryTarget, 'utf8')));
		const packageSetArtifact = verifiedArtifacts.filter((artifact) =>
			/^candidate\/metadata\/package-set-report-[a-f0-9]{64}\.json$/u.test(artifact.path),
		);
		if (packageSetArtifact.length !== 1) throw new Error('Accepted E1 run must publish exactly one package-set report.');
		const packageSetIdentity = {
			...packageSetArtifact[0],
			path: packageSetArtifact[0].path.slice('candidate/'.length),
		};
		semanticVerification = await new CacheOptimizationE1CandidateVerifier(
			path.join(runDirectory, 'candidate'),
			{
				decodedRetentionByteLength: acceptedE1Result.bounds.decodedRetentionByteLength,
				maximumCompleteByteLength: acceptedE1Result.bounds.maximumCompleteByteLength,
				maximumScenePayloadByteLength: acceptedE1Result.bounds.maximumScenePayloadByteLength,
			},
		).verify(packageSetIdentity, acceptedE1Result.parent, inventory);
		const semanticExactness = {
			sceneCount: semanticVerification.sceneCount,
			checkedByteLength: semanticVerification.checkedByteLength,
			byteDifferenceCount: semanticVerification.byteDifferenceCount,
			matches: semanticVerification.matches,
		};
		if (JSON.stringify(semanticExactness) !== JSON.stringify(acceptedE1Result.exactness)) throw new Error('E1 semantic verification differs from the terminal exactness claim.');
		const candidateArtifactPaths = verifiedArtifacts
			.filter((artifact) => artifact.path.startsWith('candidate/'))
			.map((artifact) => artifact.path.slice('candidate/'.length))
			.sort();
		if (JSON.stringify(candidateArtifactPaths) !== JSON.stringify(semanticVerification.artifactPaths)) {
			throw new Error('E1 sealed candidate subtree contains an unreferenced or missing artifact.');
		}
		const recommendation = acceptedE1Result.recommendation;
		const structuralRecommendation = {
			layoutId: recommendation.layoutId,
			zstandardLevel: recommendation.zstandardLevel,
			blockCount: recommendation.blockCount,
			uniqueBlockArtifactCount: recommendation.uniqueBlockArtifactCount,
			encodedByteLength: recommendation.encodedByteLength,
			metadataByteLength: recommendation.metadataByteLength,
			metadataArtifactCount: recommendation.metadataArtifactCount,
			completeByteLength: recommendation.completeByteLength,
			maximumDecodedBlockByteLength: recommendation.maximumDecodedBlockByteLength,
		};
		const structuralGraph = {
			layoutId: semanticVerification.layoutId,
			zstandardLevel: semanticVerification.zstandardLevel,
			blockCount: semanticVerification.blockCount,
			uniqueBlockArtifactCount: semanticVerification.uniqueBlockArtifactCount,
			encodedByteLength: semanticVerification.encodedByteLength,
			metadataByteLength: semanticVerification.metadataByteLength,
			metadataArtifactCount: semanticVerification.metadataArtifactCount,
			completeByteLength: semanticVerification.completeByteLength,
			maximumDecodedBlockByteLength: semanticVerification.maximumDecodedBlockByteLength,
		};
		if (JSON.stringify(structuralGraph) !== JSON.stringify(structuralRecommendation)) {
			throw new Error('E1 semantic graph structure differs from the recommendation.');
		}
	}
	if (result.schemaId === 'distant-sun-cache-optimization-e2-result-v1' && result.accepted === true) {
		acceptedE2Result = acceptE2Result(result);
		const e1Verification = await verifySealedRun(path.join(EXPERIMENT_OUTPUT_ROOT, 'runs', acceptedE2Result.parent.runId), acceptedE2Result.parent.runId);
		if (e1Verification.artifactSetSha256 !== acceptedE2Result.parent.artifactSetSha256 || e1Verification.conclusion !== 'accepted') throw new Error('E2 accepted E1 parent does not independently authenticate.');
		const browserEvidence = await readJson(runDirectory, 'evidence/browser-transport.json');
		if (JSON.stringify(browserEvidence) !== JSON.stringify(acceptedE2Result.browser)) throw new Error('E2 terminal browser evidence differs from the sealed browser artifact.');
	}
	const progress = (await readFile(path.join(runDirectory, 'progress.jsonl'), 'utf8'))
		.trim()
		.split(/\r?\n/u)
		.map((line, index) => acceptProgressEvent(JSON.parse(line), index));
	for (let index = 1; index < progress.length; index += 1) {
		const previousMilliseconds = Date.parse(progress[index - 1].timestamp);
		const currentMilliseconds = Date.parse(progress[index].timestamp);
		if (currentMilliseconds < previousMilliseconds) {
			throw new Error('Progress timestamps are not monotonic.');
		}
		if (currentMilliseconds - previousMilliseconds > 30_000) {
			throw new Error('Progress record exceeds the 30-second heartbeat bound.');
		}
		if (progress[index - 1].state !== undefined) {
			throw new Error('Progress record contains a nonfinal terminal state.');
		}
	}
	const terminal = progress.at(-1);
	if (terminal?.phase !== 'terminal' || terminal.state !== manifest.conclusion) {
		throw new Error('Progress record lacks the matching final terminal state.');
	}
	if (Date.parse(manifest.finalizedAt) < Date.parse(terminal.timestamp)) {
		throw new Error('Artifact manifest predates the terminal progress event.');
	}
	if (progress[0]?.phase !== 'initialize') throw new Error('Progress record does not begin with initialization.');
	const requiredPhases =
		acceptedE1Result !== undefined
			? [
					'initialize',
					'input-authentication',
					'coordinate-extraction',
					'scene-reconstruction',
					'candidate-build',
					'candidate-publication',
					'published-verification',
					'terminal',
				]
			: acceptedE2Result !== undefined
				? ['initialize', 'browser-transport', 'terminal']
				: result.schemaId === 'distant-sun-cache-optimization-c0-result-v2' && result.accepted === true
				? ['initialize', 'inventory-authentication', 'browser-control', 'terminal']
				: ['initialize', 'terminal'];
	for (const phase of requiredPhases) {
		if (!progress.some((event) => event.phase === phase)) throw new Error(`Progress record omits required phase: ${phase}`);
	}
	verifyTerminalProgressCounts(progress, result);
	if (acceptedE1Result !== undefined) {
		const monitoredElapsedMilliseconds = Date.parse(terminal.timestamp) - Date.parse(progress[0].timestamp);
		const elapsedGap = monitoredElapsedMilliseconds - acceptedE1Result.totalElapsedMilliseconds;
		if (elapsedGap < 0 || elapsedGap > 1_000) {
			throw new Error('E1 claimed elapsed time differs from its monitored run boundary.');
		}
	}

	return {
		runId,
		conclusion: manifest.conclusion,
		artifactCount: verifiedArtifacts.length,
		artifactSetSha256,
		...(semanticVerification === undefined ? {} : {semanticVerification}),
	};
}

/**
 * Resolve and verify one sealed run selected by command-line identity.
 *
 * @returns {Promise<void>} - Completion after printing the verification summary.
 */
async function main() {
	const runId = process.argv[2];
	if (!RUN_ID_PATTERN.test(runId ?? '')) throw new TypeError('Usage: node verify-run.js <six-digit-run-id>');
	const runsRoot = await requireRealDirectory(
		path.join(EXPERIMENT_OUTPUT_ROOT, 'runs'),
		'Experiment runs root',
	);
	const runDirectory = await requireRealDirectory(path.join(runsRoot, runId), 'Sealed run');
	const relative = path.relative(runsRoot, runDirectory);
	if (relative !== runId) throw new Error('Run directory does not match the requested contained identity.');
	process.stdout.write(`${JSON.stringify(await verifySealedRun(runDirectory, runId), null, 2)}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	await main();
}
