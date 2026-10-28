import {Service} from '@polylith/core';
import {fileURLToPath} from 'node:url';
import {registry} from '../../registry.js';
import {LocalAssetPackage} from '../../common/LocalAssetPackage.js';

/** Registry capability for the local-only human-vision filter package.
 *
 * @implements {import('./human-vision.js').HumanVisionService}
 */
export class HumanVisionService extends Service {
	/** Creates this feature's package owner.
	 *
	 * @param {unknown} [ownerRegistry] - Registry owning the feature.
	 */
	constructor(ownerRegistry = registry) {
		super('human-vision', ownerRegistry);
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
				process.env.FLAT32_HUMAN_VISION_FILTER_ROOT ??
					fileURLToPath(new URL('../../data/human-vision-filter-package-v1/', import.meta.url)),
			);
			await candidate.load();
			this._package = candidate;
		} catch (error) {
			console.error('Flat32 human-vision filter setup failed.', error);
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
		if (!this._package) throw new Error('Human-vision filter service is unavailable.');
		return {...(await this._package.openAsset(relativePath)), contentType: 'application/json'};
	}
}

new HumanVisionService();
