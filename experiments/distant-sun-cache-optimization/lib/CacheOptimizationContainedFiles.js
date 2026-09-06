import {createHash} from 'node:crypto';
import {lstat, open, realpath} from 'node:fs/promises';
import path from 'node:path';

/**
 * Require a normalized, nonempty relative path using repository separators.
 *
 * @param {string} relativePath - Candidate relative path.
 * @returns {string} - Accepted relative path.
 * @throws {TypeError} - When the path is absolute, empty, or contains traversal.
 */
function requireRelativePath(relativePath) {
	if (
		typeof relativePath !== 'string' ||
		relativePath.length === 0 ||
		path.isAbsolute(relativePath) ||
		relativePath.includes('\\') ||
		relativePath.split('/').some((segment) => !segment || segment === '.' || segment === '..')
	) {
		throw new TypeError('Path must be a normalized contained relative path.');
	}
	return relativePath;
}

/**
 * Return whether one resolved path is a root or its descendant.
 *
 * @param {string} root - Absolute containment root.
 * @param {string} target - Absolute candidate path.
 * @returns {boolean} - Whether target is within root.
 */
function isWithin(root, target) {
	const relative = path.relative(root, target);
	return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

/**
 * Require one existing real directory without a reparse boundary.
 *
 * @param {string} target - Absolute directory path.
 * @param {string} label - Diagnostic identity.
 * @returns {Promise<string>} - Accepted real directory path.
 */
async function requireRealDirectory(target, label) {
	const resolved = path.resolve(target);
	const actual = await realpath(resolved);
	const information = await lstat(resolved);
	if (!information.isDirectory() || information.isSymbolicLink() || actual.toLowerCase() !== resolved.toLowerCase()) {
		throw new Error(`${label} must be a real directory: ${resolved}`);
	}
	return actual;
}

/**
 * Resolve one existing path beneath a trusted real root without a reparse boundary.
 *
 * @param {string} root - Trusted real root.
 * @param {string} relativePath - Root-relative candidate path.
 * @param {string} label - Diagnostic identity.
 * @returns {Promise<string>} - Accepted real path.
 */
async function requireContainedRealPath(root, relativePath, label) {
	requireRelativePath(relativePath);
	const rootRealPath = await realpath(root);
	const target = path.join(rootRealPath, ...relativePath.split('/'));
	const actual = await realpath(target);
	if (!isWithin(rootRealPath, actual)) throw new Error(`${label} escapes its declared root.`);
	const information = await lstat(target);
	if (information.isSymbolicLink() || actual.toLowerCase() !== target.toLowerCase()) {
		throw new Error(`${label} crosses a symlink, junction, or reparse boundary.`);
	}
	return actual;
}

/**
 * Resolve one existing regular file beneath a trusted real root.
 *
 * @param {string} root - Trusted real root.
 * @param {string} relativePath - Root-relative file path.
 * @param {string} label - Diagnostic identity.
 * @returns {Promise<string>} - Accepted real file path.
 */
async function requireContainedRealFile(root, relativePath, label) {
	const target = await requireContainedRealPath(root, relativePath, label);
	if (!(await lstat(target)).isFile()) throw new Error(`${label} must be a regular file.`);
	return target;
}

/**
 * Calculate one file's SHA-256 without retaining it in memory.
 *
 * @param {string} filePath - Absolute file path.
 * @returns {Promise<string>} - Lowercase hexadecimal SHA-256.
 */
async function sha256File(filePath) {
	const handle = await open(filePath, 'r');
	const hash = createHash('sha256');
	const buffer = Buffer.allocUnsafe(4 * 1024 * 1024);
	try {
		let position = 0;
		for (;;) {
			const {bytesRead} = await handle.read(buffer, 0, buffer.byteLength, position);
			if (bytesRead === 0) break;
			hash.update(buffer.subarray(0, bytesRead));
			position += bytesRead;
		}
	} finally {
		await handle.close();
	}
	return hash.digest('hex');
}

/** Filesystem containment and content-identity operations for cache-optimization evidence. */
const CacheOptimizationContainedFiles = {
	requireRelativePath,
	isWithin,
	requireRealDirectory,
	requireContainedRealPath,
	requireContainedRealFile,
	sha256File,
};

export default CacheOptimizationContainedFiles;
