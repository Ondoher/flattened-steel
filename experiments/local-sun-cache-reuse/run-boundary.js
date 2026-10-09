import {createHash} from 'node:crypto';
import {createReadStream} from 'node:fs';
import {lstat, realpath} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

/** Repository marker is relative to this checked-in control, never cwd. */
export const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
/** Declared ignored evidence boundary. */
export const outputRoot = path.join(repositoryRoot, 'tmp/experiments/local-sun-cache-reuse');

/** Reject escapes and aliases before accessing an input or output.
 * @param {string} root - Declared boundary.
 * @param {string} target - Absolute input or output.
 * @returns {Promise<void>} - Completion after validation.
 */
export async function checkPath(root, target) {
	root = path.resolve(root);
	target = path.resolve(target);
	const relative = path.relative(root, target);
	if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative))
		throw new Error('Path escape.');
	let current = root;
	for (const segment of ['', ...relative.split(path.sep).filter(Boolean)]) {
		current = segment ? path.join(current, segment) : current;
		try {
			const facts = await lstat(current);
			if (facts.isSymbolicLink() || (await realpath(current)).toLowerCase() !== current.toLowerCase())
				throw new Error('Path alias.');
		} catch (error) {
			if (error.code !== 'ENOENT') throw error;
		}
	}
}

/** Identify exact bytes.
 * @param {Uint8Array | string} bytes - Artifact contents.
 * @returns {string} - SHA-256.
 */
export function hash(bytes) {
	return createHash('sha256').update(bytes).digest('hex');
}

/** Hash a checked artifact with bounded buffering rather than loading its full payload.
 * @param {string} root - Declared read boundary.
 * @param {string} target - Absolute artifact path.
 * @returns {Promise<LocalSunArtifactDigest>} - Exact byte count and SHA-256.
 */
export async function hashFile(root, target) {
	await checkPath(root, target);
	const digest = createHash('sha256');
	let byteLength = 0;
	for await (const chunk of createReadStream(target, {highWaterMark: 1048576})) {
		byteLength += chunk.length;
		digest.update(chunk);
	}
	return {byteLength, sha256: digest.digest('hex')};
}
