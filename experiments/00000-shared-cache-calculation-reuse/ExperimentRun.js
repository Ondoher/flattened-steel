import {randomUUID} from 'node:crypto';
import {appendFileSync, openSync, closeSync, fsyncSync, readdirSync, readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import Files from '../../scripts/algorithm32/solar-zenith-cache/DistantSunSharedCacheGenerationFiles.js';

/** Immutable experiment execution and authenticated filesystem evidence owner.
 * @implements {CacheReuseRun}
 */
export default class ExperimentRun {
	/** Creates an execution owner without allocating an output run. */
	constructor() {
		this.repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
		this.files = new Files(this.repository);
		this.parents = new Map();
		this.artifacts = [];
		this.root = '';
		this.phase = 'initializing';
		this.started = performance.now();
	}

	/** Call this method to allocate a fresh run and start flushed progress reporting.
	 * @param {string} label - Execution purpose.
	 * @returns {Promise<void>} - Completion after initialization.
	 */
	async start(label) {
		await this.files.resolve('AGENTS.md');
		this.root = `tmp/experiments/00000-shared-cache-calculation-reuse/runs/${new Date().toISOString().replace(/[:.]/gu, '-')}-${label}-${randomUUID()}`;
		await this.files.directory(this.root);
		this.progressPath = (await this.files.resolve(this.root)) + '/progress.jsonl';
		this.progressHandle = openSync(this.progressPath, 'wx');
		this.progress({phase: label, message: 'Run started.'});
		this.timer = setInterval(() => this.progress({phase: this.phase, message: 'Execution remains active.'}), 25000);
		const sourceRoot = 'experiments/00000-shared-cache-calculation-reuse';
		const sources = [];
		for (const name of readdirSync(await this.files.resolve(sourceRoot)).sort()) {
			const relative = `${sourceRoot}/${name}`;
			const bytes = await this.read(relative);
			sources.push({path: relative, sha256: this.files.hash(bytes), source: bytes.toString('utf8')});
		}
		await this.write('implementation.json', {node: process.version, command: process.argv, sources});
	}

	/** Call this method to authenticate and record a read-only input.
	 * @param {string} relative - Repository-relative input path.
	 * @param {DistantSunSharedCacheFileIdentity | null} [expected] - Expected identity.
	 * @param {number} [maximum] - Maximum byte allocation.
	 * @returns {Promise<Buffer>} - Authenticated bytes.
	 */
	async read(relative, expected = null, maximum = 32 * 1024 * 1024) {
		const bytes = await this.files.read(relative, expected, maximum);
		this.parents.set(relative, {path: relative, byteLength: bytes.length, sha256: this.files.hash(bytes)});
		return bytes;
	}

	/** Call this method to persist one exclusive derived artifact.
	 * @param {string} name - Run-local filename.
	 * @param {unknown} value - JSON value or bytes.
	 * @returns {Promise<DistantSunSharedCacheFileIdentity>} - Artifact identity.
	 */
	async write(name, value) {
		if (!/^[A-Za-z0-9._-]+$/u.test(name)) throw new Error('Invalid artifact filename.');
		const bytes = value instanceof Uint8Array ? value : Buffer.from(JSON.stringify(value) + '\n');
		const artifact = await this.files.write(`${this.root}/${name}`, bytes);
		this.artifacts.push(artifact);
		return artifact;
	}

	/** Call this method to append and flush a monitorable event.
	 * @param {CacheReuseProgress} event - Phase, counts, and optional terminal state.
	 * @returns {void}
	 */
	progress(event) {
		this.phase = event.phase;
		const record = {timestamp: new Date().toISOString(), ...event};
		appendFileSync(this.progressHandle, JSON.stringify(record) + '\n');
		fsyncSync(this.progressHandle);
		if (event.message !== 'Execution remains active.') process.stdout.write(JSON.stringify(record) + '\n');
	}

	/** Call this method to seal a terminal run after all owned artifacts are closed.
	 * @param {CacheReuseTerminalState} state - Terminal disposition.
	 * @param {unknown} result - Final claim and limitations.
	 * @returns {Promise<void>} - Completion after exclusive seal publication.
	 */
	async finish(state, result) {
		clearInterval(this.timer);
		this.progress({phase: 'terminal', state, message: `Run ${state}.`});
		closeSync(this.progressHandle);
		const bytes = readFileSync(await this.files.resolve(`${this.root}/progress.jsonl`));
		this.artifacts.push({
			path: `${this.root}/progress.jsonl`,
			byteLength: bytes.length,
			sha256: this.files.hash(bytes),
		});
		await this.write('sealed.json', {
			schemaId: 'cache-reuse-experiment-run-v1',
			state,
			elapsedMilliseconds: performance.now() - this.started,
			parents: [...this.parents.values()],
			artifacts: [...this.artifacts],
			result,
		});
		process.stdout.write(`RUN_ROOT=${this.root}\n`);
	}
}
