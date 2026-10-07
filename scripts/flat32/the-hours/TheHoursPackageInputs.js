import {readFile} from 'node:fs/promises';
import DistantSunSharedCacheFormat from '../../../src/algorithm32/implementation/distant-sun/cache/DistantSunSharedCacheFormat.js';
import DistantSunSharedCacheSupport from '../../../src/algorithm32/implementation/distant-sun/cache/DistantSunSharedCacheSupport.js';

/** Read-only complete Native15 package authentication and cubic inventory proof.
 * @implements {TheHoursInputArtifacts}
 */
export class TheHoursPackageInputs {
	/**
	 * Creates a parent evidence reader with an exact pinned package report.
	 *
	 * @param {TheHoursPackageInputConfiguration} configuration - Run, parent package and trusted report identity.
	 */
	constructor(configuration) {
		this._run = configuration.run;
		this._root = configuration.packageRoot;
		this._report = configuration.report;
		this._allowed = new Map();
	}

	/**
	 * Called by metadata loading to authenticate one bounded package artifact.
	 *
	 * @param {DistantSunSharedCacheFileIdentity} identity - Package-relative pinned identity.
	 * @returns {Promise<string>} - Authenticated serialized JSON.
	 */
	async _json(identity) {
		this._allowed.set(identity.path, identity);
		return JSON.stringify(await this._run.parentJson({...identity, path: `${this._root}/${identity.path}`}));
	}

	/**
	 * Call this method to authenticate every metadata and encoded-block artifact across all 109 scenes.
	 * Every production parser and complete cubic support constructor must accept the graph.
	 * No new cache is generated and no parent artifact is changed.
	 *
	 * @returns {Promise<TheHoursPackageProof>} - Complete authenticated scene/stencil and byte identities.
	 */
	async authenticate() {
		const format = new DistantSunSharedCacheFormat();
		const report = format.parsePackageSetReport(await this._json(this._report));
		if (report.configurations.length !== 1) throw new Error('The Hours requires one exact native configuration.');
		const configuration = format.parseConfigurationManifest(await this._json(report.configurations[0]));
		const blockIndex = format.parseBlockIndex(await this._json(configuration.blockIndex), configuration);
		const catalog = format.parseRuntimeCatalog(await this._json(report.runtimeCatalog));
		const direction = configuration.directionLayout.logicalToUniqueIndex;
		this._allowed.set(direction.path, direction);
		await this._run.authenticate({...direction, path: `${this._root}/${direction.path}`});
		const scenes = [];
		for (const entry of catalog.scenes)
			scenes.push(format.parseSceneManifest(await this._json(entry.manifest), configuration, blockIndex));
		if (
			scenes.length !== 109 ||
			scenes.some((scene, ordinal) => scene.representativeSolarZenithDegrees !== ordinal) ||
			configuration.spectralLayout.channelCount !== 15 ||
			configuration.coordinateDomains.altitude.count !== 48
		) {
			throw new Error('The Hours package must retain complete Native48/Native15 scene ordinals 0–108.');
		}
		const support = new DistantSunSharedCacheSupport({scenes, blockIndex});
		const stencilInventory = scenes.map((scene, ordinal) => ({
			ordinal,
			sceneId: scene.id,
			requiredBlockIds: support.getRequiredBlocks(ordinal),
		}));
		if (stencilInventory.some((scene) => scene.requiredBlockIds.length > 24))
			throw new Error('Cubic scene inventory exceeds the admitted atlas capacity.');
		for (const [index, block] of blockIndex.blocks.entries()) {
			this._allowed.set(block.encoded.path, block.encoded);
			await this._run.authenticate({...block.encoded, path: `${this._root}/${block.encoded.path}`});
			if (index % 10 === 0 || index === blockIndex.blocks.length - 1)
				await this._run.progress({
					phase: 'authenticate-blocks',
					completed: index + 1,
					total: blockIndex.blocks.length,
				});
		}
		return {
			packageSetIdentity: report.packageSetIdentity,
			report: this._report,
			configurationIdentity: configuration.configurationIdentity,
			sceneCount: scenes.length,
			encodedBlocks: blockIndex.blocks.length,
			authenticatedArtifacts: [...this._allowed.values()],
			stencilInventory,
			maximumCubicBlocks: Math.max(...stencilInventory.map((scene) => scene.requiredBlockIds.length)),
			preservedDerivation: report.derivation,
		};
	}

	/**
	 * Call this method to resolve only an already-authenticated package artifact for loopback delivery.
	 *
	 * @param {string} relative - Exact allowlisted package path.
	 * @returns {Promise<string>} - Checked read-only parent path.
	 */
	path(relative) {
		if (!this._allowed.has(relative))
			throw new Error('The Hours server requested an unauthenticated package path.');
		return this._run.parentPath(`${this._root}/${relative}`);
	}
}
