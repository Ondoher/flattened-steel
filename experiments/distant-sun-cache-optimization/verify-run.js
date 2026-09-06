import {createHash} from 'node:crypto';
import {lstat, readFile, readdir, realpath, stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {EXPERIMENT_OUTPUT_ROOT} from './consts.js';
import CacheOptimizationContracts from './lib/CacheOptimizationContracts.js';
import CacheOptimizationContainedFiles from './lib/CacheOptimizationContainedFiles.js';

const {acceptArtifactManifest, acceptC0Result, acceptProgressEvent, acceptTerminalResult, requireRecord} =
	CacheOptimizationContracts;
const {requireContainedRealFile, requireRealDirectory, sha256File} = CacheOptimizationContainedFiles;

const ARTIFACT_MANIFEST_NAME = 'artifact-manifest.json';
const RUN_ID_PATTERN = /^\d{6}-[a-z0-9]+(?:-[a-z0-9]+)*$/u;

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

	return {
		runId,
		conclusion: manifest.conclusion,
		artifactCount: verifiedArtifacts.length,
		artifactSetSha256,
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
