import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';

/** Read-only admission of exact artifacts from one completed, sealed task run.
 * @implements {TheHoursInputArtifacts}
 */
export class TheHoursRetainedInputs {
	/** Creates a parent reader anchored to the selected task's run boundary.
	 * @param {TheHoursRetainedInputConfiguration} configuration - Parent run, pinned manifest and new child capability.
	 */
	constructor(configuration) {
		if (!/^\.codex-tmp\/p3-strobing-20261007\/runs\/[a-zA-Z0-9_-]+$/u.test(configuration.parentRoot))
			throw new Error('Retained proof is outside the selected task.');
		this._run = configuration.run;
		this._root = configuration.parentRoot;
		this._manifest = configuration.manifest;
		this._artifacts = new Map();
	}

	/** Call this method to validate the closed parent artifact set against its pinned manifest.
	 * @returns {Promise<void>} - Exact manifest and complete artifact-set identity admitted.
	 */
	async load() {
		const value = /** @type {TheHoursArtifactManifest} */ (
			await this._run.parentJson({...this._manifest, path: `${this._root}/artifact-manifest.json`})
		);
		if (
			value.schemaId !== 'algorithm32-the-hours-proof-v1' ||
			!['accepted', 'rejected'].includes(value.disposition) ||
			createHash('sha256').update(JSON.stringify(value.artifacts)).digest('hex') !== value.artifactSetSha256
		)
			throw new Error('Retained proof is not an admitted closed run.');
		for (const artifact of value.artifacts) {
			if (this._artifacts.has(artifact.path)) throw new Error('Parent artifact manifest repeats a path.');
			this._artifacts.set(artifact.path, artifact);
		}
	}

	/** Call this method to authenticate a declared artifact before independent consumption.
	 * @param {string} relative - Exact run-relative manifest entry.
	 * @returns {Promise<string>} - Checked immutable ordinary parent path.
	 */
	async path(relative) {
		const artifact = this._artifacts.get(relative);
		if (!artifact) throw new Error('Retained proof does not declare the requested artifact.');
		await this._run.authenticate({...artifact, path: `${this._root}/${relative}`});
		return this._run.parentPath(`${this._root}/${relative}`);
	}

	/** Call this method to read a bounded exact declared parent JSON artifact.
	 * @param {string} relative - Exact manifest entry.
	 * @returns {Promise<unknown>} - Complete parsed value after authentication.
	 */
	async json(relative) {
		const artifact = this._artifacts.get(relative);
		if (!artifact || artifact.byteLength > 64 * 1024 * 1024)
			throw new Error('Parent JSON is missing or exceeds its bound.');
		return JSON.parse(await readFile(await this.path(relative), 'utf8'));
	}
}
