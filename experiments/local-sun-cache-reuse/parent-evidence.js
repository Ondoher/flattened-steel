import path from 'node:path';
import {readFile} from 'node:fs/promises';
import {outputRoot, checkPath, hash, hashFile} from './run-boundary.js';

/** Authenticate a sealed parent's entire inventory before deriving new evidence.
 * @param {string} name - Immutable parent run name.
 * @param {string} artifact - Manifest-listed requested artifact.
 * @param {boolean} [allowRejected] - Explicitly permit rejected comparison evidence, never an acceptance claim.
 * @returns {Promise<LocalSunParentArtifact>} - Exact bytes and provenance identity.
 */
export async function readParent(name, artifact, allowRejected = false) {
	if (!/^\d{5}-[a-z0-9-]+$/u.test(name)) throw new Error('Invalid parent run name.');
	const root = path.join(outputRoot, 'runs', name);
	await checkPath(outputRoot, root);
	const manifestPath = path.join(root, 'manifest.json');
	await checkPath(root, manifestPath);
	const manifestBytes = await readFile(manifestPath);
	/** @type {LocalSunParentManifest} */
	const manifest = JSON.parse(manifestBytes.toString('utf8'));
	if (
		manifest.schema !== 'local-sun-cache-reuse-run-v1' ||
		!(manifest.state === 'accepted' || (allowRejected && manifest.state === 'rejected')) ||
		manifest.run !== name ||
		!Array.isArray(manifest.artifacts)
	)
		throw new Error('Parent run has no admitted sealed disposition.');
	let selected;
	for (const identity of manifest.artifacts) {
		const target = path.resolve(root, identity.path);
		await checkPath(root, target);
		const observed = await hashFile(root, target);
		if (observed.byteLength !== identity.byteLength || observed.sha256 !== identity.sha256)
			throw new Error('Parent artifact mismatch.');
		if (identity.path === artifact) {
			selected = await readFile(target);
			if (selected.length !== identity.byteLength || hash(selected) !== identity.sha256)
				throw new Error('Selected parent artifact changed during authentication.');
		}
	}
	if (!selected) throw new Error('Requested artifact missing.');
	return {run: name, manifestSha256: hash(manifestBytes), artifact, artifactSha256: hash(selected), bytes: selected};
}
