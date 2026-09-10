import {createHash} from 'node:crypto';
import {createReadStream} from 'node:fs';
import {readdir, stat, lstat, realpath} from 'node:fs/promises';
import path from 'node:path';

/** Independent read-only verifier of sealed scientific artifacts and retained run files. */
export default class RunEvidenceVerifier {
	/** Creates a verifier using the new aggregate run's contained reader.
	 * @param {CacheReuseRun} run - Aggregate evidence owner.
	 */
	constructor(run) {
		this.run = run;
	}

	/** Called by retained-workspace inspection to allow browser filenames with spaces while rejecting aliases.
	 * @param {string} relative - Experiment-output path, never an external path.
	 * @returns {Promise<string>} - Fully checked ordinary path.
	 */
	async _resolve(relative) {
		const boundary = 'tmp/experiments/00000-shared-cache-calculation-reuse/runs/';
		if (!relative.startsWith(boundary)) throw new Error('Workspace path escapes experiment runs.');
		let absolute = await this.run.files.resolve(boundary.slice(0, -1));
		for (const component of relative.slice(boundary.length).split('/')) {
			if (!component || component === '.' || component === '..' || /[\\:\u0000]/u.test(component))
				throw new Error('Invalid workspace component.');
			absolute = path.join(absolute, component);
			const info = await lstat(absolute);
			if (
				info.isSymbolicLink() ||
				(!info.isFile() && !info.isDirectory()) ||
				(await realpath(absolute)).toLowerCase() !== absolute.toLowerCase()
			)
				throw new Error('Workspace alias or nonordinary entry.');
		}
		return absolute;
	}

	/** Called by verification to hash a file with bounded working memory.
	 * @param {string} relative - Checked repository-relative file.
	 * @returns {Promise<DistantSunSharedCacheFileIdentity>} - Measured identity.
	 */
	async _identity(relative) {
		const absolute = await this._resolve(relative);
		const hash = createHash('sha256');
		let length = 0;
		for await (const chunk of createReadStream(absolute, {highWaterMark: 1024 * 1024})) {
			hash.update(chunk);
			length += chunk.length;
		}
		return {path: relative, byteLength: length, sha256: hash.digest('hex')};
	}

	/** Called by verification to identify retained execution files without changing a parent run.
	 * @param {string} directory - Existing checked directory.
	 * @param {Map<string, DistantSunSharedCacheFileIdentity>} identities - Collected identities.
	 * @returns {Promise<void>} - Completion after every ordinary file is visited.
	 */
	async _walk(directory, identities) {
		for (const name of (await readdir(await this._resolve(directory))).sort()) {
			const relative = `${directory}/${name}`;
			const absolute = await this._resolve(relative);
			if ((await stat(absolute)).isDirectory()) await this._walk(relative, identities);
			else if (!identities.has(relative)) identities.set(relative, await this._identity(relative));
		}
	}

	/** Call this method to authenticate one sealed accepted run and its declared scientific artifacts.
	 * Changed payloads, missing seals, aliases, or incomplete snapshot provenance reject.
	 * Supplemental workspace hashes describe current retained files, not retroactive scientific acceptance.
	 * @param {string} root - Parent run below this experiment's output root.
	 * @returns {Promise<CacheReuseVerifiedRun>} - Verified claims and complete retained-file inventory.
	 */
	async verify(root) {
		const boundary = 'tmp/experiments/00000-shared-cache-calculation-reuse/runs/';
		if (!root.startsWith(boundary) || root === this.run.root) throw new Error('Invalid parent run.');
		const sealBytes = await this.run.read(`${root}/sealed.json`);
		const seal = JSON.parse(sealBytes.toString('utf8'));
		if (seal.schemaId !== 'cache-reuse-experiment-run-v1' || seal.state !== 'accepted')
			throw new Error('Parent is not an accepted sealed experiment run.');
		const identities = new Map();
		for (const expected of seal.artifacts) {
			if (!expected.path.startsWith(`${root}/`) || identities.has(expected.path))
				throw new Error('Invalid or duplicate artifact ownership.');
			const actual = await this._identity(expected.path);
			if (actual.sha256 !== expected.sha256 || actual.byteLength !== expected.byteLength)
				throw new Error('Sealed artifact changed: ' + expected.path);
			identities.set(actual.path, actual);
		}
		const snapshot = JSON.parse((await this.run.read(`${root}/implementation.json`)).toString('utf8'));
		for (const source of snapshot.sources) {
			if (this.run.files.hash(source.source) !== source.sha256)
				throw new Error('Implementation snapshot changed.');
			const parent = seal.parents.find((entry) => entry.path === source.path);
			if (!parent || parent.sha256 !== source.sha256)
				throw new Error('Implementation snapshot lacks its parent identity.');
		}
		const scientificArtifactCount = identities.size;
		await this._walk(root, identities);
		return {
			root,
			accepted: true,
			scientificArtifactCount,
			retainedFileCount: identities.size,
			retainedBytes: [...identities.values()].reduce((sum, item) => sum + item.byteLength, 0),
			identities: [...identities.values()],
			result: seal.result,
			scope: 'Declared sealed artifact hashes and captured source identities verified; additional retained workspace files inventoried read-only.',
		};
	}
}
