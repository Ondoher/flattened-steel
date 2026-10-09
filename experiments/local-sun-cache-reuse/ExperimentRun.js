import path from 'node:path';
import {appendFile, lstat, mkdir, open, readFile, readdir, unlink, writeFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {repositoryRoot, outputRoot, checkPath, hashFile} from './run-boundary.js';

/** Exclusively serialize sequence allocation across separate proof processes.
 * Never steal or delete another process's lock, including an interrupted one.
 * @returns {Promise<()=>Promise<void>>} - Release only this exact owned lock.
 */
async function allocationLock() {
	const target = path.join(outputRoot, 'run-allocation.lock');
	await checkPath(repositoryRoot, target);
	const identity = JSON.stringify({pid: process.pid, nonce: randomUUID()});
	for (let attempt = 0; attempt < 100; attempt++) {
		let handle;
		try {
			handle = await open(target, 'wx');
		} catch (error) {
			if (!(error instanceof Error) || !('code' in error) || error.code !== 'EEXIST') throw error;
			await new Promise((resolve) => setTimeout(resolve, 50));
			continue;
		}
		try {
			await handle.writeFile(identity);
		} finally {
			await handle.close();
		}
		return async () => {
			await checkPath(repositoryRoot, target);
			if ((await readFile(target, 'utf8')) !== identity)
				throw new Error('Allocation lock ownership changed; preserve it.');
			await unlink(target);
		};
	}
	throw new Error('Run allocation is locked by another owner; no sequence or existing evidence was changed.');
}

/** Isolated run allocation, append-only progress, and immutable finalization.
 * @implements {LocalSunExperimentRunContract}
 */
export class ExperimentRun {
	/** Allocate the next run and start its heartbeat.
	 * @param {string} label - Kebab name, at most sixteen characters.
	 * @returns {Promise<ExperimentRun>} - New unsealed run.
	 */
	static async create(label) {
		if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(label) || label.length > 16) throw new Error('Invalid run name.');
		await checkPath(repositoryRoot, path.join(repositoryRoot, 'AGENTS.md'));
		await readFile(path.join(repositoryRoot, 'AGENTS.md'));
		const runs = path.join(outputRoot, 'runs');
		await checkPath(repositoryRoot, runs);
		await mkdir(runs, {recursive: true});
		const release = await allocationLock();
		try {
			let maximum = -1;
			for (const name of await readdir(runs)) {
				if (!/^\d{5}/u.test(name)) continue;
				if (!/^\d{5}-[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(name) || name.length > 22)
					throw new Error('Malformed run entry.');
				await checkPath(runs, path.join(runs, name));
				if (!(await lstat(path.join(runs, name))).isDirectory()) throw new Error('Run must be a directory.');
				maximum = Math.max(maximum, Number(name.slice(0, 5)));
			}
			if (maximum >= 99999) throw new Error('Sequence exhausted.');
			const name = `${String(maximum + 1).padStart(5, '0')}-${label}`;
			const root = path.join(runs, name);
			await checkPath(runs, root);
			await mkdir(root);
			const run = new ExperimentRun(root, name);
			await run.progress('start', label);
			return run;
		} finally {
			await release();
		}
	}
	/** Own a newly allocated directory.
	 * @param {string} root - Checked run root.
	 * @param {string} name - Unique run identity.
	 */
	constructor(root, name) {
		this.root = root;
		this.name = name;
		this.sealed = false;
		this.tail = Promise.resolve();
		this.heartbeat = setInterval(() => {
			void this.progress('working', 'Execution remains active.');
		}, 25000);
	}
	/** Append and flush an event in serialized order.
	 * @param {string} phase - Current operation.
	 * @param {string} message - Progress description.
	 * @param {LocalSunEnvironmentRunState} [state] - Terminal disposition.
	 * @returns {Promise<void>} - Written event.
	 */
	progress(phase, message, state) {
		if (this.sealed) throw new Error('Run sealed.');
		this.tail = this.tail.then(async () => {
			const target = path.join(this.root, 'progress.jsonl');
			await checkPath(this.root, target);
			await appendFile(
				target,
				`${JSON.stringify({timestamp: new Date().toISOString(), phase, message, ...(state ? {state} : {})})}\n`,
			);
		});
		return this.tail;
	}
	/** Create an artifact once.
	 * @param {string} relative - Run-relative destination.
	 * @param {string | Uint8Array} bytes - Exact contents.
	 * @returns {Promise<void>} - Written artifact.
	 */
	async write(relative, bytes) {
		if (this.sealed) throw new Error('Run sealed.');
		const target = path.resolve(this.root, relative);
		await checkPath(this.root, target);
		await writeFile(target, bytes, {flag: 'wx'});
	}
	/** Seal closed artifacts after external processes stop writing.
	 * @param {LocalSunEnvironmentRunState} state - Terminal evaluation.
	 * @param {string | null} failure - Failure reason.
	 * @returns {Promise<void>} - Published immutable manifest.
	 */
	async finish(state, failure = null) {
		clearInterval(this.heartbeat);
		await this.progress('terminal', `${state}: ${failure ?? 'Completed'}`, state);
		await this.tail;
		/** @type {LocalSunEnvironmentArtifactIdentity[]} */
		const artifacts = [];
		/** Hash every closed file.
		 * @param {string} directory - Contained directory.
		 * @returns {Promise<void>} - Complete inventory.
		 */
		const inventory = async (directory) => {
			await checkPath(this.root, directory);
			for (const entry of await readdir(directory, {withFileTypes: true})) {
				const target = path.join(directory, entry.name);
				await checkPath(this.root, target);
				if (entry.isDirectory()) await inventory(target);
				else {
					const digest = await hashFile(this.root, target);
					artifacts.push({
						path: path.relative(this.root, target).replaceAll('\\', '/'),
						...digest,
					});
				}
			}
		};
		await inventory(this.root);
		await this.write(
			'manifest.json',
			`${JSON.stringify({schema: 'local-sun-cache-reuse-run-v1', run: this.name, state, failure, artifacts}, null, '\t')}\n`,
		);
		this.sealed = true;
	}
}
