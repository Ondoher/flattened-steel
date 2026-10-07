import {createHash, randomUUID} from 'node:crypto';
import {createReadStream} from 'node:fs';
import {appendFile, mkdir, readFile, readdir, stat, writeFile, lstat, realpath} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import Files from '../../algorithm32/solar-zenith-cache/DistantSunSharedCacheGenerationFiles.js';

/** Repository-derived exclusive proof output and read-only parent evidence access.
 * @implements {TheHoursRunCapability}
 */
export class TheHoursRun {
	/**
	 * Creates an output owner. Allocation is explicit and never reopens a sealed run.
	 *
	 * @param {TheHoursRunConfiguration} configuration - Selected ignored output and read-only evidence root.
	 */
	constructor(configuration) {
		this._repositoryRoot = fileURLToPath(new URL('../../../', import.meta.url));
		if (!/^\.codex-tmp\/[a-zA-Z0-9_-]+\/runs$/u.test(configuration.outputRoot)) {
			throw new RangeError('The Hours output must be a task-contained .codex-tmp runs directory.');
		}
		this._files = new Files(this.repositoryRoot);
		this._evidence = new Files(configuration.evidenceRoot);
		this._outputRoot = configuration.outputRoot;
		this._sealed = false;
		this._runRelative = '';
		this._parents = new Map();
	}

	/** Immutable repository identity derived from this module's location.
	 * @returns {string} - Absolute ordinary repository root.
	 */
	get repositoryRoot() {
		return this._repositoryRoot;
	}

	/**
	 * Called by artifact operations to reject writes before allocation or after sealing.
	 *
	 * @returns {void} - Active output authority checked.
	 */
	_assertWritable() {
		if (!this._runRelative || this._sealed) throw new Error('The Hours run is unallocated or sealed.');
	}

	/**
	 * Called by path resolution to reject aliases, traversal and platform-specific alternate paths.
	 *
	 * @param {string} relative - Canonical artifact path.
	 * @returns {string} - Validated path.
	 */
	_acceptPath(relative) {
		if (
			typeof relative !== 'string' ||
			!relative.split('/').every((part) => part === '.codex-tmp' || /^[a-zA-Z0-9_-][a-zA-Z0-9._-]*$/u.test(part))
		) {
			throw new RangeError('The Hours artifact path must be a contained canonical relative path.');
		}
		return relative;
	}

	/**
	 * Called by authentication and sealing to hash a regular file without retaining its contents.
	 *
	 * @param {string} absolute - Checked ordinary file path.
	 * @returns {Promise<TheHoursArtifactIdentity>} - Exact byte identity.
	 */
	async _identity(absolute) {
		const metadata = await stat(absolute);
		if (!metadata.isFile()) throw new Error('The Hours artifact must be an ordinary file.');
		const digest = createHash('sha256');
		for await (const chunk of createReadStream(absolute)) digest.update(chunk);
		return {path: absolute, byteLength: metadata.size, sha256: digest.digest('hex')};
	}

	/**
	 * Call this method to allocate one new proof directory.
	 *
	 * @param {string} label - Safe operation identity.
	 * @returns {Promise<string>} - Repository-relative exclusive run root.
	 */
	async allocate(label) {
		if (this._runRelative || !/^[a-z][a-z0-9-]{0,39}$/u.test(label))
			throw new Error('Invalid or repeated run allocation.');
		await this._files.directory(this._outputRoot);
		const relative = `${this._outputRoot}/${new Date().toISOString().replace(/[:.]/gu, '-')}-${label}-${randomUUID()}`;
		await mkdir(path.join(this.repositoryRoot, ...relative.split('/')));
		await this._files.resolve(relative);
		this._runRelative = relative;
		await this.progress({phase: 'allocated', label});
		return relative;
	}

	/**
	 * Call this method to resolve one existing ordinary read-only parent artifact.
	 *
	 * @param {string} relative - Evidence-root-relative path.
	 * @returns {Promise<string>} - Checked absolute path.
	 */
	parentPath(relative) {
		return this._evidence.resolve(this._acceptPath(relative));
	}

	/**
	 * Call this method to authenticate a parent against its pinned byte identity.
	 *
	 * @param {TheHoursArtifactIdentity} expected - Pinned parent identity beneath the evidence root.
	 * @returns {Promise<TheHoursArtifactIdentity>} - Verified parent identity with original path.
	 */
	async authenticate(expected) {
		const identity = await this._identity(await this.parentPath(expected.path));
		if (identity.byteLength !== expected.byteLength || identity.sha256 !== expected.sha256) {
			throw new Error(`Parent identity mismatch: ${expected.path}`);
		}
		const result = {...identity, path: expected.path};
		this._parents.set(expected.path, result);
		return result;
	}

	/**
	 * Call this method to read one bounded authenticated JSON parent.
	 *
	 * @param {TheHoursArtifactIdentity} expected - Pinned JSON artifact.
	 * @returns {Promise<unknown>} - Parsed parent value.
	 */
	async parentJson(expected) {
		if (expected.byteLength > 32 * 1024 * 1024) throw new Error('The Hours JSON parent exceeds its bound.');
		await this.authenticate(expected);
		return JSON.parse(await readFile(await this.parentPath(expected.path), 'utf8'));
	}

	/**
	 * Call this method to create an exclusive output directory before a tool writes its products.
	 *
	 * @param {string} relative - Run-relative new directory.
	 * @returns {Promise<string>} - Checked absolute directory.
	 */
	async directory(relative) {
		this._assertWritable();
		return this._files.directory(`${this._runRelative}/${this._acceptPath(relative)}`);
	}

	/**
	 * Call this method to resolve an existing output artifact.
	 *
	 * @param {string} relative - Run-relative existing path.
	 * @returns {Promise<string>} - Checked ordinary absolute path.
	 */
	outputPath(relative) {
		return this._files.resolve(`${this._runRelative}/${this._acceptPath(relative)}`);
	}

	/**
	 * Call this method to write a new artifact exactly once.
	 *
	 * @param {string} relative - Run-relative artifact path.
	 * @param {string | Uint8Array} bytes - Complete new artifact contents.
	 * @returns {Promise<void>} - Exclusive write completion.
	 */
	async write(relative, bytes) {
		this._assertWritable();
		const accepted = this._acceptPath(relative);
		const parent = path.posix.dirname(accepted);
		const directory = parent === '.' ? await this._files.resolve(this._runRelative) : await this.directory(parent);
		await writeFile(path.join(directory, path.posix.basename(accepted)), bytes, {flag: 'wx'});
	}

	/**
	 * Call this method to persist one new JSON artifact.
	 *
	 * @param {string} relative - Run-relative artifact path.
	 * @param {unknown} value - Complete serialized value.
	 * @returns {Promise<void>} - Exclusive write completion.
	 */
	writeJson(relative, value) {
		return this.write(relative, `${JSON.stringify(value, null, 2)}\n`);
	}

	/**
	 * Call this method to append progress only while this run is active.
	 *
	 * @param {Readonly<Record<string, unknown>>} value - Current stage and measured counts.
	 * @returns {Promise<void>} - Serialized progress publication.
	 */
	async progress(value) {
		this._assertWritable();
		const directory = await this._files.resolve(this._runRelative);
		const target = path.join(directory, 'progress.jsonl');
		try {
			await this.outputPath('progress.jsonl');
		} catch (error) {
			if (error.code !== 'ENOENT') throw error;
		}
		await appendFile(target, `${JSON.stringify({time: new Date().toISOString(), ...value})}\n`);
		console.log(JSON.stringify(value));
	}

	/**
	 * Called by sealing to inventory every final ordinary artifact, rejecting filesystem aliases.
	 *
	 * @param {string} relative - Run-relative directory or empty root.
	 * @returns {Promise<TheHoursArtifactIdentity[]>} - Complete artifact identities.
	 */
	async _inventory(relative = '') {
		const absolute = path.join(this.repositoryRoot, this._runRelative, relative);
		if (
			(await lstat(absolute)).isSymbolicLink() ||
			(await realpath(absolute)).toLowerCase() !== absolute.toLowerCase()
		)
			throw new Error('The Hours inventory resolves through an alias.');
		const artifacts = [];
		for (const entry of await readdir(absolute, {withFileTypes: true})) {
			const child = relative ? `${relative}/${entry.name}` : entry.name;
			if (entry.isSymbolicLink()) throw new Error('The Hours output contains an alias.');
			if (entry.isDirectory()) artifacts.push(...(await this._inventory(child)));
			else {
				const target = path.join(absolute, entry.name);
				if (
					(await lstat(target)).isSymbolicLink() ||
					(await realpath(target)).toLowerCase() !== target.toLowerCase()
				)
					throw new Error('The Hours output contains an alias.');
				artifacts.push({...(await this._identity(target)), path: child});
			}
		}
		return artifacts.sort((left, right) => left.path.localeCompare(right.path));
	}

	/**
	 * Call this method to seal the run once, retaining accepted or rejected results and complete provenance.
	 *
	 * @param {TheHoursRunDisposition} disposition - Final automated disposition.
	 * @param {unknown} result - Measured result and honest acceptance limits.
	 * @returns {Promise<string>} - Repository-relative immutable evidence root.
	 */
	async finish(disposition, result) {
		await this.writeJson('result.json', result);
		await this.writeJson('parents.json', [...this._parents.values()]);
		await this.progress({phase: 'sealed', disposition});
		const artifacts = await this._inventory();
		await this.writeJson('artifact-manifest.json', {
			schemaId: 'algorithm32-the-hours-proof-v1',
			disposition,
			artifacts,
			artifactSetSha256: createHash('sha256').update(JSON.stringify(artifacts)).digest('hex'),
		});
		this._sealed = true;
		return this._runRelative;
	}
}
