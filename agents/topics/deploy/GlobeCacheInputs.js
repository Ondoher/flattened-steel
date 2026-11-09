import {createHash} from 'node:crypto';
import {readFile, readdir} from 'node:fs/promises';
import path from 'node:path';

/**
 * Portable identity of the source, selected settings and control metadata that determine a Globe cache build.
 */
export class GlobeCacheInputs {
	/**
	 * Creates an input collector for the owning checkout.
	 *
	 * @param {string} root - Absolute app repository root.
	 */
	constructor(root) {
		this.root = root;
	}

	/**
	 * Called by input collection to identify normalized text or serialized input values.
	 *
	 * @param {string} value - Text whose line endings have been normalized.
	 * @returns {string} - SHA-256 digest.
	 */
	_hash(value) {
		return createHash('sha256').update(value).digest('hex');
	}

	/**
	 * Called by input collection to inventory compiler and engine sources without following filesystem aliases.
	 *
	 * @returns {Promise<string[]>} - Sorted repository-relative source paths; tests and documentation are excluded.
	 */
	async _sourcePaths() {
		let paths = [];
		let pending = ['src/algorithm32', 'scripts/algorithm32/solar-zenith-cache'];
		while (pending.length) {
			let directory = pending.pop();
			for (let entry of await readdir(path.join(this.root, directory), {withFileTypes: true})) {
				if (['_tests', '__tests__', 'node_modules'].includes(entry.name)) {
					continue;
				}
				let relative = directory + '/' + entry.name;
				if (entry.isSymbolicLink()) {
					throw new Error('Cache input source paths must not be symlinks: ' + relative);
				}
				if (entry.isDirectory()) {
					pending.push(relative);
				} else if (
					entry.isFile() &&
					/\.(js|json|glsl|wgsl)$/.test(entry.name) &&
					!/(?:\.test\.js|\.spec\.js|\.browser\.js|\.d\.ts)$/.test(entry.name) &&
					!/^jsconfig.*\.json$/.test(entry.name)
				) {
					paths.push(relative);
				}
			}
		}
		paths.push('agents/topics/deploy/GlobeCacheInputs.js', 'agents/topics/deploy/GlobeCacheDeployment.js');
		return paths.sort();
	}

	/**
	 * Call this method to calculate a platform-independent cache input identity without reading cache blocks.
	 *
	 * @returns {Promise<GlobeCacheInputRecord>} - Explicit settings, control/source identities and their combined fingerprint.
	 */
	async calculate() {
		let folder = path.join(this.root, 'agents/topics/deploy');
		let settings = JSON.parse(await readFile(path.join(folder, 'cache-build-settings.json'), 'utf8'));
		let orderedSettings = /** @type {GlobeCacheBuildSettings} */ (
			Object.fromEntries(
				Object.keys(settings)
					.sort()
					.map((key) => [key, settings[key]]),
			)
		);
		let seed = JSON.parse(await readFile(path.join(folder, 'cache-control-seed.manifest.json'), 'utf8'));
		let controls = seed.files.map((file) => ({path: file.path, byteLength: file.byteLength, sha256: file.sha256}));
		controls.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
		let sources = [];
		for (let relative of await this._sourcePaths()) {
			let text = await readFile(path.join(this.root, relative), 'utf8');
			sources.push({path: relative, sha256: this._hash(text.replace(/\r\n?/g, '\n'))});
		}
		let inputs = {
			schema: 'flat-globe-cache-inputs-v1',
			settings: orderedSettings,
			controls,
			sources,
		};
		return {fingerprint: this._hash(JSON.stringify(inputs)), ...inputs};
	}
}
