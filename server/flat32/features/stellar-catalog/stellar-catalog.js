import {Service} from '@polylith/core';
import {fileURLToPath} from 'node:url';
import {registry} from '../../registry.js';
import {LocalAssetPackage} from '../../common/LocalAssetPackage.js';

/** Registry capability for the local-only stellar catalog package.
 *
 * @implements {import('./stellar-catalog.js').StellarCatalogService}
 */
export class StellarCatalogService extends Service {
	/** Creates this feature's package owner.
	 *
	 * @param {unknown} [ownerRegistry] - Registry owning the feature.
	 */
	constructor(ownerRegistry = registry) {
		super('stellar-catalog', ownerRegistry);
		this.implement(['start', 'stop', 'isAvailable', 'openAsset']);
		this._package = null;
	}

	/** Call this method to load and validate the deployment-selected local package.
	 * Missing or invalid files are logged and leave the feature unavailable.
	 *
	 * @returns {Promise<void>} - Startup completed or its failure recorded.
	 */
	async start() {
		this.stop();
		try {
			let candidate = new LocalAssetPackage(
				process.env.FLAT32_STELLAR_CATALOG_ROOT ??
					fileURLToPath(new URL('../../data/brightest-2000-stellar-package-v1/', import.meta.url)),
			);
			await candidate.load();
			const manifest = /** @type {Flat32StellarManifest} */ (await candidate.readJson('manifest.json'));
			if (
				manifest.schemaId !== 'algorithm32-production-brightest-2000-stellar-package-v1' ||
				manifest.packageId !== 'brightest-2000-stellar-package-v1'
			)
				throw new Error('Stellar catalog package manifest is incompatible.');
			for (let artifact of Object.values(manifest.artifacts ?? {})) {
				if ((await candidate.inspectAsset(artifact.path)).byteLength !== artifact.byteLength)
					throw new Error('Stellar catalog asset length differs from its manifest.');
			}
			this._package = candidate;
		} catch (error) {
			console.error('Flat32 stellar catalog setup failed.', error);
		}
	}

	/** Call this method to release the retained package reader.
	 *
	 * @returns {void} - Capability unavailable until restarted.
	 */
	stop() {
		this._package = null;
	}

	/** Call this method to read whether package startup succeeded.
	 *
	 * @returns {boolean} - Whether asset requests can be served.
	 */
	isAvailable() {
		return this._package !== null;
	}

	/** Call this method to open an ordinary contained package asset.
	 * Unavailability, invalid paths and I/O failures reject; stream read failures are emitted by the returned stream.
	 *
	 * @param {string} relativePath - Package-relative asset path.
	 * @returns {Promise<Flat32ServedStream>} - Readable file and public content facts.
	 */
	async openAsset(relativePath) {
		if (!this._package) throw new Error('Stellar catalog service is unavailable.');
		return this._package.openAsset(relativePath);
	}
}

new StellarCatalogService();
