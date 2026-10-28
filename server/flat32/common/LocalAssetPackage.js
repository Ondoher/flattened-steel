import {createReadStream} from 'node:fs';
import {lstat, readFile, realpath} from 'node:fs/promises';
import path from 'node:path';

/** Ordinary local package file access shared by the two static-data features. */
export class LocalAssetPackage {
	/** Creates a package reader without opening filesystem resources.
	 *
	 * @param {string} packageRoot - Deployment-selected root directory.
	 */
	constructor(packageRoot) {
		this._root = path.resolve(packageRoot);
	}

	/** Call this method to authenticate the root before serving files.
	 * Missing roots, links and non-directories reject; startup must report unavailability.
	 *
	 * @returns {Promise<void>} - Root accepted.
	 */
	async load() {
		if ((await lstat(this._root)).isSymbolicLink())
			throw new Error('Package root must not be a symlink or junction.');
		this._root = await realpath(this._root);
		if (!(await lstat(this._root)).isDirectory()) throw new Error('Package root must be a directory.');
	}

	/** Call this method to inspect one ordinary contained package file.
	 * Invalid paths, links, missing files and filesystem failures reject without inventing data.
	 *
	 * @param {string} relativePath - Package-relative asset path.
	 * @returns {Promise<Flat32PackageFile>} - Ordinary file identity.
	 */
	async inspectAsset(relativePath) {
		if (
			typeof relativePath !== 'string' ||
			!relativePath ||
			path.isAbsolute(relativePath) ||
			relativePath.split(/[\\/]/u).some((part) => !part || part === '.' || part === '..')
		) {
			throw new RangeError('Package asset path must be contained and relative.');
		}
		let candidate = this._root;
		for (let part of relativePath.split(/[\\/]/u)) {
			candidate = path.join(candidate, part);
			if ((await lstat(candidate)).isSymbolicLink())
				throw new RangeError('Package asset must not traverse a link.');
		}
		const resolved = await realpath(candidate);
		const relative = path.relative(this._root, resolved);
		if (!relative || relative.startsWith('..') || path.isAbsolute(relative))
			throw new RangeError('Package asset escapes its root.');
		const facts = await lstat(resolved);
		if (!facts.isFile()) throw new RangeError('Package asset must be an ordinary file.');
		return {path: resolved, byteLength: facts.size};
	}

	/** Call this method to read a package-owned JSON record.
	 * Path, read and parse failures reject to the owning feature.
	 *
	 * @param {string} relativePath - Ordinary relative JSON file.
	 * @returns {Promise<unknown>} - Parsed external record awaiting domain validation.
	 */
	async readJson(relativePath) {
		const file = await this.inspectAsset(relativePath);
		return JSON.parse(await readFile(file.path, 'utf8'));
	}

	/** Call this method to open an admitted asset without exposing filesystem paths.
	 * Path and inspection errors reject; stream read failures are emitted on the returned stream.
	 *
	 * @param {string} relativePath - Ordinary relative asset path.
	 * @returns {Promise<Flat32ServedStream>} - Readable file and content facts.
	 */
	async openAsset(relativePath) {
		const file = await this.inspectAsset(relativePath);
		return {
			stream: createReadStream(file.path),
			byteLength: file.byteLength,
			contentType: path.extname(file.path) === '.json' ? 'application/json' : 'application/octet-stream',
		};
	}
}
