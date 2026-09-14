import {createHash} from 'node:crypto';
import {createReadStream} from 'node:fs';
import {appendFile, lstat, mkdir, readFile, readdir, realpath, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

/** Contained, append-only experiment run and read-only evidence access. */
export class StrobingRun {
	static repositoryRoot = fileURLToPath(new URL('../../', import.meta.url));
	static outputRelative = 'tmp/experiments/distant-sun-recording-strobing';

	/** @param {string} directory @param {string} id */
	constructor(directory, id) {
		this.directory = directory;
		this.id = id;
		this.closed = false;
		this.tail = Promise.resolve();
		/** @type {StrobingProgress} */
		this.current = {phase: 'initialize', message: 'Initializing experiment run.'};
		/** @type {Error | undefined} */
		this.progressError = undefined;
		this.heartbeat = setInterval(() => {
			void this.progress(this.current).catch((error) => {
				this.progressError = error;
			});
		}, 30_000);
	}

	/** @param {string} root @param {string} relative @returns {Promise<string>} */
	static async checkedPath(root, relative = '') {
		const target = path.resolve(root, relative);
		const relation = path.relative(path.resolve(root), target);
		if (relation === '..' || relation.startsWith(`..${path.sep}`) || path.isAbsolute(relation))
			throw new Error('Path escaped its declared root.');
		let cursor = path.parse(target).root;
		for (const segment of target.slice(cursor.length).split(path.sep).filter(Boolean)) {
			cursor = path.join(cursor, segment);
			const info = await lstat(cursor);
			if (info.isSymbolicLink() || (await realpath(cursor)).toLowerCase() !== cursor.toLowerCase())
				throw new Error(`Reparse boundary rejected: ${cursor}`);
		}
		return target;
	}

	/** @param {string} root @param {string} relative @returns {Promise<string>} */
	static async ensureDirectory(root, relative) {
		let cursor = await this.checkedPath(root);
		for (const segment of relative.split('/')) {
			if (!segment || segment === '..' || segment === '.' || /[\\:]/u.test(segment))
				throw new Error('Invalid directory component.');
			const next = path.join(cursor, segment);
			try {
				await mkdir(next);
			} catch (error) {
				if (error.code !== 'EEXIST') throw error;
			}
			cursor = await this.checkedPath(root, path.relative(root, next));
			if (!(await lstat(cursor)).isDirectory()) throw new Error('Output ancestor is not a directory.');
		}
		return cursor;
	}

	/** @param {string} name @returns {Promise<StrobingRun>} */
	static async allocate(name) {
		if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/u.test(name) || name.length > 16)
			throw new Error('Run name must be kebab-case and at most 16 characters.');
		await this.checkedPath(this.repositoryRoot, 'AGENTS.md');
		const runs = await this.ensureDirectory(this.repositoryRoot, `${this.outputRelative}/runs`);
		let maximum = -1;
		for (const entry of await readdir(runs)) {
			if (!/^\d{5}/u.test(entry)) continue;
			if (!/^\d{5}-[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/u.test(entry) || entry.length > 22)
				throw new Error(`Malformed run entry: ${entry}`);
			maximum = Math.max(maximum, Number(entry.slice(0, 5)));
		}
		if (maximum >= 99999) throw new Error('Run sequence exhausted.');
		const id = `${String(maximum + 1).padStart(5, '0')}-${name}`;
		const directory = path.join(runs, id);
		await mkdir(directory);
		await this.checkedPath(runs, id);
		const run = new StrobingRun(directory, id);
		await run.progress(run.current);
		return run;
	}

	/** @param {string} root @param {string} relative @returns {Promise<StrobingFileIdentity>} */
	static async identity(root, relative) {
		const file = await this.checkedPath(root, relative);
		const info = await lstat(file);
		if (!info.isFile()) throw new Error('Evidence input is not a file.');
		const digest = createHash('sha256');
		for await (const chunk of createReadStream(file)) digest.update(chunk);
		return {path: relative.replaceAll('\\', '/'), byteLength: info.size, sha256: digest.digest('hex')};
	}

	/** @param {string} root @param {readonly string[]} excluded @returns {Promise<StrobingArtifactSet>} */
	static async inventory(root, excluded = []) {
		/** @type {StrobingFileIdentity[]} */
		const artifacts = [];
		/** @param {string} relative */
		const visit = async (relative) => {
			const directory = await this.checkedPath(root, relative);
			for (const name of (await readdir(directory)).sort()) {
				const child = relative ? `${relative}/${name}` : name;
				if (excluded.includes(child)) continue;
				const file = await this.checkedPath(root, child);
				if ((await lstat(file)).isDirectory()) await visit(child);
				else artifacts.push(await this.identity(root, child));
			}
		};
		await visit('');
		return {artifacts, artifactSetSha256: createHash('sha256').update(JSON.stringify(artifacts)).digest('hex')};
	}

	/** @param {string} root @param {string} relative @returns {Promise<unknown>} */
	static async readJson(root, relative) {
		return JSON.parse(await readFile(await this.checkedPath(root, relative), 'utf8'));
	}

	/** @param {string} relative @param {unknown} value @returns {Promise<void>} */
	async writeJson(relative, value) {
		if (this.closed) throw new Error('Run is sealed.');
		const destination = path.resolve(this.directory, relative);
		await StrobingRun.checkedPath(this.directory, path.relative(this.directory, path.dirname(destination)));
		await writeFile(destination, `${JSON.stringify(value, null, 2)}\n`, {encoding: 'utf8', flag: 'wx'});
	}

	/** @param {StrobingProgress} event @returns {Promise<void>} */
	async progress(event) {
		if (this.closed) throw new Error('Run is sealed.');
		this.current = event;
		const line = `${JSON.stringify({timestamp: new Date().toISOString(), ...event})}\n`;
		this.tail = this.tail.then(() => appendFile(path.join(this.directory, 'progress.jsonl'), line, 'utf8'));
		await this.tail;
		process.stdout.write(line);
	}

	/** @param {StrobingTerminalState} state @param {unknown} result @param {readonly string[]} excluded */
	async finish(state, result, excluded = []) {
		clearInterval(this.heartbeat);
		await this.tail;
		if (this.progressError) throw this.progressError;
		await this.writeJson('result.json', {runId: this.id, state, result});
		await this.progress({phase: 'terminal', message: `Run ${state}.`, state});
		const exclusions = ['artifact-manifest.json', ...excluded];
		const inventory = await StrobingRun.inventory(this.directory, exclusions);
		await this.writeJson('artifact-manifest.json', {
			schemaId: 'strobing-artifacts-v1',
			runId: this.id,
			state,
			excludedPaths: exclusions,
			...inventory,
		});
		this.closed = true;
		process.stdout.write(
			`${JSON.stringify({runId: this.id, directory: this.directory, state, artifactSetSha256: inventory.artifactSetSha256})}\n`,
		);
	}
}
