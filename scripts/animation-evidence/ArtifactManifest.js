import {createHash} from 'node:crypto';
import {lstat, readFile, readdir} from 'node:fs/promises';
import path from 'node:path';

/**
 * Call this function to hash bytes with SHA-256.
 * @param {Uint8Array} bytes Bytes to hash.
 * @returns {string} Lowercase hexadecimal digest.
 */
function sha256(bytes) {
	return createHash('sha256').update(bytes).digest('hex');
}

/**
 * Call this function to recursively collect real files without following reparse boundaries.
 * @param {string} root Absolute artifact root.
 * @param {string} relative Current slash-separated relative directory.
 * @param {ReadonlySet<string>} excludedPaths Slash-separated paths excluded from the manifest.
 * @returns {Promise<readonly Readonly<{path: string; byteLength: number; sha256: string}>[]>} Sorted artifact identities.
 */
async function collect(root, relative, excludedPaths) {
	const artifacts = [];
	for (const name of (await readdir(path.join(root, ...relative.split('/').filter(Boolean)))).sort()) {
		const childRelative = relative ? `${relative}/${name}` : name;
		if (excludedPaths.has(childRelative)) continue;
		const absolute = path.join(root, ...childRelative.split('/'));
		const information = await lstat(absolute);
		if (information.isSymbolicLink()) throw new Error(`Artifact path crosses a symbolic link: ${childRelative}`);
		if (information.isDirectory()) artifacts.push(...(await collect(root, childRelative, excludedPaths)));
		else if (information.isFile()) {
			const bytes = await readFile(absolute);
			artifacts.push(Object.freeze({path: childRelative, byteLength: bytes.byteLength, sha256: sha256(bytes)}));
		} else throw new Error(`Unsupported artifact entry: ${childRelative}`);
	}
	return artifacts;
}

/** Filesystem artifact identity operations for immutable evidence directories. */
export const ArtifactManifest = Object.freeze({
	/**
	 * Call this method to create a sorted content manifest for a real artifact directory.
	 * @param {string} root Absolute artifact directory.
	 * @param {readonly string[]} [excludedPaths] Slash-separated relative paths to omit.
	 * @returns {Promise<Readonly<{artifacts: readonly Readonly<{path: string; byteLength: number; sha256: string}>[]; artifactSetSha256: string}>>} Artifact manifest and set identity.
	 */
	async create(root, excludedPaths = ['artifact-manifest.json']) {
		if (!path.isAbsolute(root)) throw new TypeError('Artifact root must be absolute.');
		const information = await lstat(root);
		if (!information.isDirectory() || information.isSymbolicLink()) {
			throw new Error('Artifact root must be a real directory.');
		}
		const artifacts = Object.freeze(await collect(root, '', new Set(excludedPaths)));
		return Object.freeze({
			artifacts,
			artifactSetSha256: sha256(Buffer.from(JSON.stringify(artifacts))),
		});
	},

	/**
	 * Call this method to recompute and verify a previously retained artifact manifest.
	 * @param {string} root Absolute artifact directory.
	 * @param {Readonly<{artifacts: readonly Readonly<{path: string; byteLength: number; sha256: string}>[]; artifactSetSha256: string}>} expected Retained manifest identity.
	 * @param {readonly string[]} [excludedPaths] Slash-separated relative paths to omit.
	 * @returns {Promise<void>} Verification completion promise.
	 */
	async verify(root, expected, excludedPaths = ['artifact-manifest.json']) {
		if (!expected || !Array.isArray(expected.artifacts) || typeof expected.artifactSetSha256 !== 'string') {
			throw new TypeError('Expected artifact manifest is invalid.');
		}
		const actual = await this.create(root, excludedPaths);
		if (JSON.stringify(actual.artifacts) !== JSON.stringify(expected.artifacts)) {
			throw new Error('Artifact entries differ from the retained manifest.');
		}
		if (actual.artifactSetSha256 !== expected.artifactSetSha256) {
			throw new Error('Artifact-set SHA-256 differs from the retained manifest.');
		}
	},
});
