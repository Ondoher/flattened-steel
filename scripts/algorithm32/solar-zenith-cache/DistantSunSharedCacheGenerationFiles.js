import {createHash} from 'node:crypto';
import {lstatSync, realpathSync} from 'node:fs';
import {lstat, mkdir, open, readFile, realpath, rename, writeFile} from 'node:fs/promises';
import path from 'node:path';

/**
 * Contained, exclusive filesystem owner for one production generation run.
 *
 * @implements {SharedGenerationFiles}
 */
export default class DistantSunSharedCacheGenerationFiles {
	/**
	 * Repository root used for every contained generation path.
	 *
	 * @type {string}
	 */ _root;

	/**
	 * Creates a filesystem owner anchored to the repository identity. Invalid or aliased roots throw before use.
	 *
	 * @param {string} repositoryRoot - Absolute repository root derived from the implementation location.
	 */
	constructor(repositoryRoot) {
		this._root = path.resolve(repositoryRoot);
		if (
			lstatSync(this._root).isSymbolicLink() ||
			!lstatSync(this._root).isDirectory() ||
			realpathSync(this._root).toLowerCase() !== this._root.toLowerCase()
		)
			throw new Error('The generation repository root is not an ordinary real directory.');
	}

	/**
	 * Rejects traversal, absolute paths, alternate streams, and ambiguous components.
	 *
	 * @param {string} value - Untrusted repository-relative path.
	 * @returns {string[]} - Ordinary components.
	 */
	_parts(value) {
		if (
			typeof value !== 'string' ||
			!/^[A-Za-z0-9._-]+(?:\/[A-Za-z0-9._-]+)*$/u.test(value) ||
			value.split('/').some((part) => part === '.' || part === '..')
		)
			throw new Error('Generation path is uncontained.');
		return value.split('/');
	}

	/**
	 * Call this method to resolve an ordinary contained path, rejecting every link component.
	 *
	 * @param {string} relativePath - Repository-relative path without traversal.
	 * @returns {Promise<string>} - Verified absolute path.
	 */
	async resolve(relativePath) {
		const parts = this._parts(relativePath);
		let current = this._root;
		for (const part of ['', ...parts]) {
			if (part) current = path.join(current, part);
			const facts = await lstat(current);
			if (facts.isSymbolicLink() || (!facts.isFile() && !facts.isDirectory()))
				throw new Error('Generation path is not ordinary.');
			if (path.resolve(await realpath(current)).toLowerCase() !== current.toLowerCase())
				throw new Error('Generation path resolves through an alias.');
		}
		return current;
	}

	/**
	 * Call this method to create missing ordinary directories beneath the repository. Unsafe paths, nondirectories, and filesystem errors reject; callers must stop the run.
	 *
	 * @param {string} relativePath - Contained directory path.
	 * @returns {Promise<string>} - Verified directory.
	 */
	async directory(relativePath) {
		let current = '';
		for (const part of this._parts(relativePath)) {
			current = current ? `${current}/${part}` : part;
			try {
				await mkdir(path.join(this._root, current));
			} catch (error) {
				if (error.code !== 'EEXIST') throw error;
			}
			const absolute = await this.resolve(current);
			if (!(await lstat(absolute)).isDirectory()) throw new Error('Generation directory is not a directory.');
		}
		return this.resolve(relativePath);
	}

	/**
	 * Call this method to create one new file exclusively after validating its parent. Existing destinations, unsafe parents, and filesystem errors reject; callers must stop the run.
	 *
	 * @param {string} relativePath - New contained file.
	 * @returns {Promise<SharedGenerationFileHandle>} - Caller-owned writable handle.
	 */
	async create(relativePath) {
		this._parts(relativePath);
		await this.resolve(path.posix.dirname(relativePath));
		return open(path.join(this._root, relativePath), 'wx+');
	}

	/**
	 * Call this method to identify exact bytes without interpretation.
	 *
	 * @param {string | Uint8Array} bytes - Source bytes.
	 * @returns {string} - Lowercase SHA-256 digest.
	 */
	hash(bytes) {
		return createHash('sha256').update(bytes).digest('hex');
	}

	/**
	 * Call this method to read a bounded ordinary artifact and authenticate a supplied identity. Unsafe paths, excessive lengths, identity mismatch, or read failures reject; callers must not consume the artifact.
	 *
	 * @param {string} relativePath - Existing contained file.
	 * @param {DistantSunSharedCacheFileIdentity | null} [expected] - Optional external identity.
	 * @param {number} [maximumBytes] - Allocation ceiling.
	 * @returns {Promise<Buffer>} - Authenticated bytes.
	 */
	async read(relativePath, expected = null, maximumBytes = 16 * 1024 * 1024) {
		const absolute = await this.resolve(relativePath);
		const facts = await lstat(absolute);
		if (!facts.isFile() || facts.size > maximumBytes || (expected && facts.size !== expected.byteLength))
			throw new Error('Generation input length is incompatible.');
		const bytes = await readFile(absolute);
		if (bytes.byteLength !== facts.size || (expected && this.hash(bytes) !== expected.sha256))
			throw new Error('Generation input identity is incompatible.');
		return bytes;
	}

	/**
	 * Call this method to publish bytes exclusively within the open run. Creation, write, flush, or close failure rejects; callers must not publish the run.
	 *
	 * @param {string} relativePath - New contained artifact.
	 * @param {Uint8Array} bytes - Complete bytes to persist.
	 * @returns {Promise<DistantSunSharedCacheFileIdentity>} - Artifact identity.
	 */
	async write(relativePath, bytes) {
		const handle = await this.create(relativePath);
		try {
			await handle.writeFile(bytes);
			await handle.sync();
		} finally {
			await handle.close();
		}
		return {path: relativePath, byteLength: bytes.byteLength, sha256: this.hash(bytes)};
	}

	/**
	 * Call this method to replace an open run's progress file atomically. Unsafe paths, nonserializable input, or filesystem failure rejects; callers must stop the open run.
	 *
	 * @param {string} relativePath - Mutable progress file below this run.
	 * @param {unknown} value - JSON-safe progress.
	 * @returns {Promise<void>} - Completion after replacement.
	 */
	async progress(relativePath, value) {
		this._parts(relativePath);
		await this.resolve(path.posix.dirname(relativePath));
		const temporary = path.join(this._root, `${relativePath}.next`);
		await writeFile(temporary, `${JSON.stringify(value)}\n`, {flag: 'wx'});
		await rename(temporary, path.join(this._root, relativePath));
	}
}
