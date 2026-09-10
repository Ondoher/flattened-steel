import Inventory from '../../scripts/algorithm32/solar-zenith-cache/DistantSunSharedCacheGenerationInventory.js';
import Graph from '../../scripts/algorithm32/solar-zenith-cache/DistantSunSharedCacheGenerationGraph.js';

/** Authenticated application comparison controls and qualified baseline. */
export default class ApplicationControls {
	/** Call this method to authenticate the existing qualification and control metadata.
	 * Missing or changed authority rejects before any candidate execution.
	 * @param {CacheReuseRun} run - Run evidence owner.
	 * @returns {Promise<CacheReuseControls>} - Authenticated baseline and graph.
	 */
	async load(run) {
		const root =
			'tmp/production-algorithm32/distant-sun-shared-block-cache/runs/2026-09-10T14-57-40-947Z-f747d2ec-9571-474f-89e6-b0783bbf3752';
		const acceptanceBytes = await run.read(`${root}/acceptance.json`);
		if (run.files.hash(acceptanceBytes) !== 'c57164cc550dfa3ee4580880b1b0739c75e71acb348029ef04a18c4978d559fd')
			throw new Error('Baseline acceptance changed.');
		const acceptance = JSON.parse(acceptanceBytes.toString('utf8'));
		const parents = {};
		for (const parent of acceptance.parents)
			parents[parent.role] = JSON.parse((await run.read(parent.artifact.path, parent.artifact)).toString('utf8'));
		const files = {
			read: (relative, expected) => run.read(relative, expected),
			hash: (bytes) => run.files.hash(bytes),
			resolve: (relative) => run.files.resolve(relative),
			directory: () => Promise.reject(new Error('Controls are read-only.')),
			create: () => Promise.reject(new Error('Controls are read-only.')),
			write: () => Promise.reject(new Error('Controls are read-only.')),
			progress: () => Promise.reject(new Error('Controls are read-only.')),
		};
		const inventory = await new Inventory().load(files);
		const reportPath = 'package-set.json';
		const reportBytes = await run.read(`${acceptance.publishedRoot}/${reportPath}`);
		const graph = await new Graph().read({
			files,
			candidateRoot: acceptance.publishedRoot,
			reportArtifact: {path: reportPath, sha256: acceptance.packageSetSha256, byteLength: reportBytes.length},
			signal: new AbortController().signal,
		});
		return {root, acceptance, parents, inventory, graph};
	}
}
