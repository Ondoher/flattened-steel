import path from 'node:path';
import {readFile} from 'node:fs/promises';
import {readParent} from './parent-evidence.js';
import {outputRoot, checkPath, hash} from './run-boundary.js';

/** Authenticate a sealed native export once, then rehash each consumed artifact.
 * Initial full-inventory authentication uses the unchanged repository parent
 * reader. The private manifest snapshot belongs only to this proof invocation;
 * every subsequent read rejects a changed manifest, artifact, path or alias.
 * @param {string} name - Immutable accepted evidence run.
 * @param {string} [artifact] - Initial metadata artifact; defaults to the native result. Small metadata can avoid retaining a duplicated large aggregate result.
 * @returns {Promise<LocalSunNativeParentReader>} - Scoped reader, not a durable verification cache.
 */
export async function openNativeParent(name, artifact = 'result.json') {
	const metadata = await readParent(name, artifact),
		root = path.join(outputRoot, 'runs', name),
		manifestPath = path.join(root, 'manifest.json');
	await checkPath(root, manifestPath);
	const bytes = await readFile(manifestPath);
	if (hash(bytes) !== metadata.manifestSha256)
		throw new Error('Native parent manifest changed after full authentication.');
	/** @type {LocalSunParentManifest} */ const manifest = JSON.parse(bytes.toString('utf8'));
	return {
		metadata,
		read: async (artifact) => {
			await checkPath(root, manifestPath);
			if (hash(await readFile(manifestPath)) !== metadata.manifestSha256)
				throw new Error('Native parent manifest changed during consumption.');
			const entry = manifest.artifacts.find((identity) => identity.path === artifact);
			if (!entry) throw new Error('Requested native artifact is not authenticated.');
			const target = path.resolve(root, artifact);
			await checkPath(root, target);
			const selected = await readFile(target);
			if (selected.length !== entry.byteLength || hash(selected) !== entry.sha256)
				throw new Error('Native artifact changed after full inventory authentication.');
			return {
				run: name,
				manifestSha256: metadata.manifestSha256,
				artifact,
				artifactSha256: entry.sha256,
				bytes: selected,
			};
		},
	};
}
