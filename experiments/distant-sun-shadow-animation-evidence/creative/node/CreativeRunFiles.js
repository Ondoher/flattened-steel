import {createHash} from 'node:crypto';
import {lstat, mkdir, readFile, readdir, realpath, writeFile} from 'node:fs/promises';
import path from 'node:path';

/** Filesystem containment and input identities for one creative render run. */
export const CreativeRunFiles = {
	/**
	 * Call this method to hash the exact retained bytes.
	 *
	 * @param {Uint8Array | string} bytes - Input bytes or UTF-8 text.
	 * @returns {string} - Lowercase SHA-256 digest.
	 */
	sha256(bytes) {
		return createHash('sha256').update(bytes).digest('hex');
	},

	/**
	 * Call this method to check lexical containment before resolving a path.
	 *
	 * @param {string} root - Absolute boundary root.
	 * @param {string} target - Absolute target path.
	 * @returns {boolean} - Whether the target stays within the boundary.
	 */
	isWithin(root, target) {
		const relative = path.relative(root, target);
		return (
			relative === '' ||
			(relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative))
		);
	},

	/**
	 * Call this method to validate every ancestor of an existing real path.
	 * Rejects symbolic links, junctions, and canonical paths different from the requested path.
	 *
	 * @param {string} absolutePath - Existing absolute input or output path.
	 * @returns {Promise<string>} - Canonical path after complete ancestor validation.
	 */
	async requireRealPath(absolutePath) {
		const expected = path.resolve(absolutePath);
		let current = path.parse(expected).root;
		for (const segment of expected.slice(current.length).split(path.sep).filter(Boolean)) {
			current = path.join(current, segment);
			const information = await lstat(current);
			const actual = await realpath(current);
			if (information.isSymbolicLink() || actual.toLowerCase() !== current.toLowerCase()) {
				throw new Error(`Creative render path crosses a reparse boundary: ${current}.`);
			}
		}
		return expected;
	},

	/**
	 * Call this method to resolve a safe slash-separated relative path below a root.
	 *
	 * @param {string} root - Validated absolute root.
	 * @param {string} relativePath - Nonempty normalized relative path.
	 * @returns {string} - Lexically contained absolute destination.
	 */
	resolve(root, relativePath) {
		if (
			typeof relativePath !== 'string' ||
			path.isAbsolute(relativePath) ||
			/[\\:%\u0000]/u.test(relativePath) ||
			!relativePath.split('/').every((segment) => segment && segment !== '.' && segment !== '..')
		) {
			throw new Error('Creative render relative path is invalid.');
		}
		const absolute = path.join(root, ...relativePath.split('/'));
		if (!this.isWithin(root, absolute)) throw new Error('Creative render path escaped its root.');
		return absolute;
	},

	/**
	 * Call this method to create missing directories after checking each existing ancestor.
	 *
	 * @param {string} root - Existing validated directory boundary.
	 * @param {string} relativePath - Directory path below the boundary.
	 * @returns {Promise<string>} - Created or existing validated directory.
	 */
	async ensureDirectory(root, relativePath) {
		const target = this.resolve(root, relativePath);
		let current = await this.requireRealPath(root);
		for (const segment of path.relative(root, target).split(path.sep)) {
			current = path.join(current, segment);
			try {
				await mkdir(current);
			} catch (error) {
				if (/** @type {NodeJS.ErrnoException} */ (error).code !== 'EEXIST') throw error;
			}
			await this.requireRealPath(current);
			if (!(await lstat(current)).isDirectory()) throw new Error('Creative output ancestor is not a directory.');
		}
		return current;
	},

	/**
	 * Call this method to load one validated repository input and its byte identity.
	 *
	 * @param {string} root - Validated repository root.
	 * @param {string} relativePath - Repository-relative file path.
	 * @returns {Promise<CreativeNodeFileSnapshot>} - Exact input bytes and identity.
	 */
	async readSnapshot(root, relativePath) {
		const absolute = await this.requireRealPath(this.resolve(root, relativePath));
		if (!(await lstat(absolute)).isFile()) throw new Error(`Creative input is not a real file: ${relativePath}.`);
		const bytes = await readFile(absolute);
		return {bytes, identity: {path: relativePath, byteLength: bytes.byteLength, sha256: this.sha256(bytes)}};
	},

	/**
	 * Call this method to enumerate a read-only input tree without following links.
	 *
	 * @param {string} root - Validated repository root.
	 * @param {string} relativePath - Repository-relative directory path.
	 * @returns {Promise<string[]>} - Sorted repository-relative file paths.
	 */
	async listFiles(root, relativePath) {
		const absolute = await this.requireRealPath(this.resolve(root, relativePath));
		const paths = [];
		for (const entry of (await readdir(absolute, {withFileTypes: true})).sort((left, right) =>
			left.name.localeCompare(right.name),
		)) {
			const child = `${relativePath}/${entry.name}`;
			await this.requireRealPath(this.resolve(root, child));
			if (entry.isDirectory()) paths.push(...(await this.listFiles(root, child)));
			else if (entry.isFile()) paths.push(child);
			else throw new Error(`Unsupported creative input entry: ${child}.`);
		}
		return paths;
	},

	/**
	 * Call this method to publish a new JSON artifact without replacing any prior file.
	 *
	 * @param {string} root - Validated new run directory.
	 * @param {string} relativePath - Run-relative artifact path.
	 * @param {unknown} value - Serializable artifact content.
	 * @returns {Promise<void>} - Durable new artifact publication.
	 */
	async writeJson(root, relativePath, value) {
		const absolute = this.resolve(root, relativePath);
		await this.requireRealPath(path.dirname(absolute));
		await writeFile(absolute, `${JSON.stringify(value, null, 2)}\n`, {encoding: 'utf8', flag: 'wx'});
	},
};
