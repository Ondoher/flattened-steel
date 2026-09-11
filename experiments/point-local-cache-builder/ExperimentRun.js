import {mkdir, open, readFile, readdir, rename, unlink} from 'node:fs/promises';
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
		this.sealed = false;
		this.phase = 'initializing';
		this.started = performance.now();
	}

	/** Call this method to reserve an exclusive, nonreused five-digit run number.
	 * Invalid suffixes, unsafe paths, a held allocation lock, or exhausted counters reject before execution.
	 * @param {string} label - Lowercase purpose suffix containing at most sixteen characters.
	 * @returns {Promise<string>} - New repository-relative output directory.
	 */
	async allocate(label) {
		if (typeof label !== 'string' || label.length > 16 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(label))
			throw new Error('Run suffix must contain 1-16 kebab-case characters.');
		const relative = 'tmp/experiments/point-local-cache-builder';
		const parent = await this.files.directory(relative);
		const lockPath = parent + '/.run-allocation-lock';
		const lock = await open(lockPath, 'wx');
		try {
			let last = -1;
			try {
				const counterPath = await this.files.resolve(relative + '/.last-run-number');
				const counter = (await readFile(counterPath, 'utf8')).trim();
				if (!/^\d{5}$/u.test(counter)) throw new Error('Invalid run counter.');
				last = Number(counter);
			} catch (error) {
				if (error.code !== 'ENOENT') throw error;
			}
			for (const name of await readdir(parent)) {
				const match = /^(\d{5})-/u.exec(name);
				if (!match) continue;
				await this.files.resolve(relative + '/' + name);
				last = Math.max(last, Number(match[1]));
			}
			if (last >= 99999) throw new Error('Run counter exhausted.');
			const prefix = String(last + 1).padStart(5, '0');
			const pending = await open(parent + '/.counter-next', 'wx');
			try {
				await pending.writeFile(prefix + '\n');
				await pending.sync();
			} finally {
				await pending.close();
			}
			await rename(parent + '/.counter-next', parent + '/.last-run-number');
			const result = relative + '/' + prefix + '-' + label;
			await mkdir(parent + '/' + prefix + '-' + label);
			await this.files.resolve(result);
			return result;
		} finally {
			await lock.close();
			await unlink(lockPath);
		}
	}

	/** Call this method to allocate a fresh run and start flushed progress reporting.
	 * @param {string} label - Execution purpose.
	 * @returns {Promise<void>} - Completion after initialization.
	 */
	async start(label) {
		if (this.root) throw new Error('Run already initialized.');
		await this.files.resolve('AGENTS.md');
		this.root = await this.allocate(label);
		this.progressPath = (await this.files.resolve(this.root)) + '/progress.jsonl';
		this.progressHandle = openSync(this.progressPath, 'wx');
		this.progress({phase: label, message: 'Run started.'});
		this.timer = setInterval(() => this.progress({phase: this.phase, message: 'Execution remains active.'}), 25000);
		const sourceRoot = 'experiments/point-local-cache-builder';
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
		if (this.sealed) throw new Error('Run is sealed.');
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
		if (this.sealed) throw new Error('Run is sealed.');
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
		if (this.sealed || !['accepted', 'rejected', 'failed', 'interrupted'].includes(state))
			throw new Error('Invalid terminal transition.');
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
			schemaId: 'point-local-builder-run-v1',
			state,
			elapsedMilliseconds: performance.now() - this.started,
			parents: [...this.parents.values()],
			artifacts: [...this.artifacts],
			result,
		});
		this.sealed = true;
		process.stdout.write(`RUN_ROOT=${this.root}\n`);
	}
}
