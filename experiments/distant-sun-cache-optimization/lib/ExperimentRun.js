import {createHash} from 'node:crypto';
import {
	appendFile,
	lstat,
	mkdir,
	readdir,
	rename,
	rm,
	stat,
	writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import {EXPERIMENT_OUTPUT_ROOT} from '../consts.js';
import CacheOptimizationContracts from './CacheOptimizationContracts.js';
import CacheOptimizationContainedFiles from './CacheOptimizationContainedFiles.js';
import ExperimentRunAllocation from './ExperimentRunAllocation.js';
import ExperimentRunHeartbeat from './ExperimentRunHeartbeat.js';
import ExperimentRunTerminalPublisher from './ExperimentRunTerminalPublisher.js';

const {acceptArtifactManifest, acceptTerminalResult, normalizeJsonValue, requireContractPath} =
	CacheOptimizationContracts;
const {isWithin, requireContainedRealFile, requireRealDirectory, sha256File} = CacheOptimizationContainedFiles;

const ARTIFACT_MANIFEST_NAME = 'artifact-manifest.json';
const RUN_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const RUN_CONSTRUCTION_TOKEN = Symbol('ExperimentRun construction');
const experimentRunAllocation = new ExperimentRunAllocation();
const experimentRunTerminalPublisher = new ExperimentRunTerminalPublisher();

/** Owner of allocation, progress, artifacts, and terminal sealing for one contained run. */
export default class ExperimentRun {
	/** @type {string} */ _runId;
	/** @type {string} */ _runDirectory;
	/** @type {string} */ _currentPhase = 'initialize';
	/** @type {string} */ _currentMessage = 'Initializing the experiment run.';
	/** @type {CacheOptimizationExperimentProgressCount | undefined} */ _currentCount;
	/** @type {Promise<void>} */ _progressTail = Promise.resolve();
	/** @type {ExperimentRunHeartbeat} */ _heartbeat;
	/** @type {Set<string>} */ _scratchDirectories = new Set();
	/** @type {boolean} */ _finalized = false;

	/**
	 * Creates an initialized run owner over one exclusively allocated directory.
	 *
	 * @param {CacheOptimizationExperimentRunIdentity} identity - Allocated run identity and absolute directory.
	 * @param {symbol} token - Module-private construction capability.
	 */
	constructor(identity, token) {
		if (token !== RUN_CONSTRUCTION_TOKEN) throw new TypeError('ExperimentRun instances must be allocated by create().');
		this._runId = identity.runId;
		this._runDirectory = identity.runDirectory;
		this._heartbeat = new ExperimentRunHeartbeat(() =>
			this.progress(this._currentPhase, this._currentMessage, this._currentCount),
		);
	}

	/** Six-digit-prefixed immutable run identifier. */
	get runId() {
		return this._runId;
	}

	/** Absolute directory owned by the open run. */
	get runDirectory() {
		return this._runDirectory;
	}

	/**
	 * Call this method to initialize and allocate one new run.
	 * Rejects invalid definitions, repository/output containment failures, lock contention, allocation failures, or initial writes; callers must retain no run on rejection.
	 *
	 * @param {CacheOptimizationExperimentRunDefinition} definition - Pinned initial run record.
	 * @returns {Promise<ExperimentRun>} - Initialized run owner.
	 */
	static async create(definition) {
		if (!RUN_SLUG_PATTERN.test(definition.slug)) throw new TypeError('Run slug must be descriptive kebab-case.');
		await experimentRunAllocation.requireRepositoryIdentity();
		await requireRealDirectory(EXPERIMENT_OUTPUT_ROOT, 'Experiment output root');
		const identity = await experimentRunAllocation.allocate(definition.slug);
		const run = new ExperimentRun(identity, RUN_CONSTRUCTION_TOKEN);
		try {
			await run.writeArtifact('command.txt', `${definition.command}\n`);
			await run.writeJsonArtifact('inputs.json', definition.inputs);
			await run.writeJsonArtifact('provenance.json', definition.provenance);
			await run.writeJsonArtifact('environment.json', definition.environment);
			await run.writeJsonArtifact('references/manifest.json', definition.references);
			await run.writeJsonArtifact('result.json', {
				schemaId: 'distant-sun-cache-optimization-run-result-v1',
				runId: run.runId,
				state: 'running',
			});
			await run.writeArtifact('report.md', `# ${run.runId}\n\nStatus: running.\n`);
			await run.writeArtifact('progress.jsonl', '');
			await run.progress('initialize', 'Initialized the immutable experiment run record.');
			return run;
		} catch (error) {
			await experimentRunAllocation.rollbackInitialization(identity.runDirectory);
			throw error;
		}
	}

	/**
	 * Call this method to write one new artifact within the open run.
	 * Rejects invalid, escaped, reparse, duplicate, or sealed-run paths and write failures; callers must retain the open run for failure finalization.
	 *
	 * @param {string} relativePath - Run-relative artifact path.
	 * @param {string | Uint8Array} value - Artifact bytes.
	 * @returns {Promise<void>} - Completion after exclusive creation.
	 */
	async writeArtifact(relativePath, value) {
		this._requireOpen();
		const target = await this._prepareArtifactPath(relativePath);
		await writeFile(target, value, {flag: 'wx'});
	}

	/**
	 * Call this method to write one formatted JSON artifact within the open run.
	 * Rejects non-JSON values and every writeArtifact failure; callers must retain the open run for failure finalization.
	 *
	 * @param {string} relativePath - Run-relative artifact path.
	 * @param {CacheOptimizationJsonValue} value - JSON-compatible artifact value.
	 * @returns {Promise<void>} - Completion after exclusive creation.
	 */
	async writeJsonArtifact(relativePath, value) {
		const normalized = normalizeJsonValue(value, `JSON artifact ${relativePath}`);
		await this.writeArtifact(relativePath, `${JSON.stringify(normalized, null, 2)}\n`);
	}

	/**
	 * Call this method to create a run-owned temporary directory.
	 * Rejects invalid, reparse, escaped, or sealed-run paths; callers must stop using the path after removal.
	 *
	 * @param {string} relativePath - Direct-child temporary-directory name.
	 * @returns {Promise<string>} - Absolute validated real directory.
	 */
	async createScratchDirectory(relativePath) {
		this._requireOpen();
		await this._requireMutableRunBoundary();
		requireContractPath(relativePath, 'Scratch directory path');
		const segments = relativePath.split('/');
		if (segments.length !== 1) throw new Error('Scratch directories must be direct children of the run.');
		const leaf = path.join(this._runDirectory, segments[0]);
		await mkdir(leaf);
		const created = await requireRealDirectory(leaf, 'Scratch directory');
		if (!isWithin(this._runDirectory, created) || created !== path.resolve(leaf)) {
			throw new Error('Scratch directory is not the exclusively created real contained path.');
		}
		this._scratchDirectories.add(created);
		return created;
	}

	/**
	 * Call this method to remove a run-owned temporary directory after its consumer stops.
	 * Rejects invalid, reparse, escaped, missing, or sealed-run paths; callers must retain the run on rejection.
	 *
	 * @param {string} relativePath - Direct-child temporary-directory name.
	 * @returns {Promise<void>} - Completion after validated recursive removal.
	 */
	async removeScratchDirectory(relativePath) {
		this._requireOpen();
		await this._requireMutableRunBoundary();
		requireContractPath(relativePath, 'Scratch directory path');
		const expected = path.resolve(this._runDirectory, ...relativePath.split('/'));
		if (!this._scratchDirectories.has(expected)) throw new Error('Scratch directory is not owned by this run instance.');
		const directory = await requireRealDirectory(expected, 'Scratch directory');
		if (!isWithin(this._runDirectory, directory) || directory !== expected) {
			throw new Error('Scratch directory is not the expected real contained path.');
		}
		await rm(directory, {recursive: true});
		this._scratchDirectories.delete(directory);
	}

	/**
	 * Call this method to record a phase transition and update heartbeat context.
	 * Rejects progress-write or run-lifecycle failures; callers must stop work and finalize the run as failed.
	 *
	 * @param {string} phase - Stable phase identifier.
	 * @param {string} message - Human-readable progress statement.
	 * @param {CacheOptimizationExperimentProgressCount} [count] - Optional countable progress.
	 * @returns {Promise<void>} - Completion after the event is flushed.
	 */
	async setPhase(phase, message, count) {
		this._currentPhase = phase;
		this._currentMessage = message;
		this._currentCount = count;
		await this.progress(phase, message, count);
	}

	/**
	 * Call this method to append and flush one progress event.
	 * Rejects escaped, reparse, missing, or sealed progress paths and append failures; callers must stop work and finalize the run as failed.
	 *
	 * @param {string} phase - Stable phase identifier.
	 * @param {string} message - Human-readable progress statement.
	 * @param {CacheOptimizationExperimentProgressCount} [count] - Optional countable progress.
	 * @param {CacheOptimizationExperimentRunConclusion} [state] - Optional terminal state.
	 * @returns {Promise<void>} - Completion after the event is appended.
	 */
	async progress(phase, message, count, state) {
		this._requireOpen();
		await this._requireMutableRunBoundary();
		const event = {
			timestamp: new Date().toISOString(),
			phase,
			...(count ? {completed: count.completed, total: count.total} : {}),
			message,
			...(state ? {state} : {}),
		};
		const append = this._progressTail.then(async () => {
			const progressPath = await requireContainedRealFile(
				this._runDirectory,
				'progress.jsonl',
				'Progress artifact',
			);
			await appendFile(progressPath, `${JSON.stringify(event)}\n`, 'utf8');
		});
		this._progressTail = append.catch(() => undefined);
		await append;
	}

	/**
	 * Call this method to begin progress heartbeats within the 30-second contract.
	 * Throws when the run is sealed or a heartbeat is already active; callers must not start a second interval.
	 *
	 * @returns {void}
	 */
	startHeartbeat() {
		this._requireOpen();
		this._heartbeat.start();
	}

	/**
	 * Call this method to stop progress heartbeats and flush pending events.
	 * Rejects a saved heartbeat append failure exactly once; callers must retain that failure and may call again before failed finalization.
	 *
	 * @returns {Promise<void>} - Completion after pending progress writes settle.
	 */
	async stopHeartbeat() {
		await this._heartbeat.stop();
		await this._progressTail;
	}

	/**
	 * Call this method to seal the run exactly once after writing its terminal result.
	 * Rejects invalid terminal data, progress/resource failures, or terminal publication failure; callers must retain an unsealed run and the original failure.
	 *
	 * @param {CacheOptimizationExperimentRunFinalization} finalization - Terminal result and report.
	 * @returns {Promise<CacheOptimizationArtifactManifest>} - Terminal artifact manifest.
	 */
	async finalize(finalization) {
		this._requireOpen();
		if (this._scratchDirectories.size !== 0) throw new Error('Run owns scratch directories that must be removed before finalization.');
		const result = acceptTerminalResult(finalization.result, this._runId, finalization.conclusion);
		await this.stopHeartbeat();
		await this._replaceArtifact('result.json', `${JSON.stringify(result, null, 2)}\n`);
		await this._replaceArtifact('report.md', finalization.report);
		await this.progress('terminal', `Run concluded as ${finalization.conclusion}.`, undefined, finalization.conclusion);
		await this._progressTail;
		const artifacts = await this._inventoryArtifacts();
		const artifactSetSha256 = createHash('sha256').update(JSON.stringify(artifacts)).digest('hex');
		const manifest = {
			schemaId: 'distant-sun-cache-optimization-artifact-manifest-v1',
			runId: this._runId,
			conclusion: finalization.conclusion,
			artifactSetSha256,
			artifacts,
			finalizedAt: new Date().toISOString(),
		};
		await this._publishTerminalManifest(manifest);
		this._finalized = true;
		return manifest;
	}

	/**
	 * Called by finalization to validate and atomically publish the terminal manifest last.
	 *
	 * @param {CacheOptimizationArtifactManifest} manifest - Complete terminal manifest.
	 * @returns {Promise<void>} - Completion after atomic publication, or rejection with no terminal path published.
	 */
	async _publishTerminalManifest(manifest) {
		const accepted = acceptArtifactManifest(manifest);
		const target = await this._prepareArtifactPath(ARTIFACT_MANIFEST_NAME);
		await experimentRunTerminalPublisher.publish(target, `${JSON.stringify(accepted, null, 2)}\n`);
	}

	/**
	 * Called by artifact writers to create and validate an artifact parent.
	 *
	 * @param {string} relativePath - Run-relative artifact path.
	 * @returns {Promise<string>} - Absolute contained artifact path.
	 */
	async _prepareArtifactPath(relativePath) {
		await this._requireMutableRunBoundary();
		requireContractPath(relativePath, 'Run artifact path');
		if (relativePath === ARTIFACT_MANIFEST_NAME && this._finalized) {
			throw new Error('Terminal artifact manifest is already sealed.');
		}
		const segments = relativePath.split('/');
		let parent = this._runDirectory;
		for (const segment of segments.slice(0, -1)) {
			const candidate = path.join(parent, segment);
			try {
				parent = await requireRealDirectory(candidate, 'Artifact parent');
			} catch (error) {
				if (error.code !== 'ENOENT') throw error;
				await mkdir(candidate);
				parent = await requireRealDirectory(candidate, 'Artifact parent');
			}
			if (!isWithin(this._runDirectory, parent)) {
				throw new Error('Artifact parent escapes the run directory.');
			}
		}
		return path.join(parent, segments.at(-1));
	}

	/**
	 * Called by finalization to replace an open-run placeholder atomically.
	 *
	 * @param {string} relativePath - Existing run-relative artifact path.
	 * @param {string | Uint8Array} value - Replacement bytes.
	 * @returns {Promise<void>} - Completion after atomic replacement.
	 */
	async _replaceArtifact(relativePath, value) {
		const target = await this._prepareArtifactPath(relativePath);
		const temporary = `${target}.${process.pid}.${Date.now()}.tmp`;
		try {
			await writeFile(temporary, value, {flag: 'wx'});
			await rename(temporary, target);
		} finally {
			await rm(temporary, {force: true});
		}
	}

	/**
	 * Called by finalization to hash every nonterminal artifact in canonical path order.
	 *
	 * @returns {Promise<CacheOptimizationArtifactRecord[]>} - Canonical artifact records.
	 */
	async _inventoryArtifacts() {
		const relativePaths = await this._listFiles(this._runDirectory, '');
		const records = [];
		for (const relativePath of relativePaths.filter((value) => value !== ARTIFACT_MANIFEST_NAME).sort()) {
			const absolutePath = await requireContainedRealFile(
				this._runDirectory,
				relativePath,
				`Run artifact ${relativePath}`,
			);
			const information = await stat(absolutePath);
			records.push({
				path: relativePath,
				byteLength: information.size,
				sha256: await sha256File(absolutePath),
			});
		}
		return records;
	}

	/**
	 * Called by finalization to enumerate files without following reparse entries.
	 *
	 * @param {string} directory - Absolute real directory.
	 * @param {string} prefix - Run-relative directory prefix.
	 * @returns {Promise<string[]>} - Run-relative file paths.
	 */
	async _listFiles(directory, prefix) {
		const files = [];
		for (const entry of await readdir(directory, {withFileTypes: true})) {
			if (entry.isSymbolicLink()) throw new Error(`Run contains a symbolic link: ${entry.name}`);
			const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
			const absolutePath = path.join(directory, entry.name);
			if (entry.isDirectory()) files.push(...(await this._listFiles(absolutePath, relativePath)));
			else if (entry.isFile()) files.push(relativePath);
			else throw new Error(`Run contains an unsupported filesystem entry: ${relativePath}`);
		}
		return files;
	}

	/**
	 * Called by mutating methods to require the allocated real run and reject terminal publication.
	 *
	 * @returns {Promise<void>} - Completion after boundary validation.
	 */
	async _requireMutableRunBoundary() {
		const runsRoot = await requireRealDirectory(path.join(EXPERIMENT_OUTPUT_ROOT, 'runs'), 'Experiment runs root');
		const runDirectory = await requireRealDirectory(this._runDirectory, 'Experiment run');
		if (path.relative(runsRoot, runDirectory) !== this._runId) throw new Error('Experiment run escaped its allocation root.');
		try {
			await lstat(path.join(runDirectory, ARTIFACT_MANIFEST_NAME));
			throw new Error('Experiment run already has a terminal artifact manifest.');
		} catch (error) {
			if (error.code !== 'ENOENT') throw error;
		}
	}

	/**
	 * Called by mutating methods to reject writes after terminal publication.
	 *
	 * @returns {void}
	 */
	_requireOpen() {
		if (this._finalized) throw new Error('Experiment run is already finalized.');
	}
}
