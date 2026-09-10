import DistantSunSharedCacheFormat from '../../../src/algorithm32/implementation/distant-sun/cache/DistantSunSharedCacheFormat.js';

/** Persisted package-graph authenticator. */
export default class DistantSunSharedCacheGenerationGraph {
	/**
	 * Call this method to authenticate every persisted metadata edge from the expected package root.
	 * Invalid metadata, broken identity links, missing files, or cancellation rejects; callers must discard the candidate.
	 *
	 * @param {SharedGenerationGraphRequest} options - Contained candidate and expected root identity.
	 * @returns {Promise<SharedGenerationGraph>} - Accepted persisted graph and metadata accounting.
	 */
	async read(options) {
		const {files, candidateRoot, reportArtifact, signal} = options;
		const format = new DistantSunSharedCacheFormat();
		let metadataBytes = 0;
		let metadataArtifactCount = 0;
		const read = async (identity) => {
			signal.throwIfAborted();
			const bytes = await files.read(`${candidateRoot}/${identity.path}`, identity);
			metadataBytes += bytes.byteLength;
			metadataArtifactCount += 1;
			return bytes;
		};
		const report = format.parsePackageSetReport((await read(reportArtifact)).toString('utf8'));
		if (report.configurations.length !== 1)
			throw new Error('This generated set must contain one physical configuration.');
		if (
			report.packageSetIdentity !==
			files.hash(JSON.stringify({configuration: report.configurations[0], runtimeCatalog: report.runtimeCatalog}))
		)
			throw new Error('Persisted package graph identity is incompatible.');
		const configuration = format.parseConfigurationManifest(
			(await read(report.configurations[0])).toString('utf8'),
		);
		const blockIndex = format.parseBlockIndex(
			(await read(configuration.blockIndex)).toString('utf8'),
			configuration,
		);
		await read(configuration.directionLayout.logicalToUniqueIndex);
		const catalog = format.parseRuntimeCatalog((await read(report.runtimeCatalog)).toString('utf8'));
		if (catalog.configurationIdentity !== configuration.configurationIdentity)
			throw new Error('Persisted catalog refers to a different configuration.');
		const scenes = [];
		for (const entry of catalog.scenes) {
			const scene = format.parseSceneManifest(
				(await read(entry.manifest)).toString('utf8'),
				configuration,
				blockIndex,
			);
			if (
				scene.id !== entry.id ||
				scene.representativeSolarZenithDegrees !== entry.representativeSolarZenithDegrees
			)
				throw new Error('Persisted catalog and scene selection disagree.');
			scenes.push(scene);
		}
		return {report, configuration, blockIndex, catalog, scenes, metadataBytes, metadataArtifactCount};
	}
}
