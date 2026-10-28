import {Service} from '@polylith/core';
import {registry} from '../../registry.js';
import {createProductionSharedCacheService} from './selection.js';

/** Registry capability for the authenticated immutable distant-Sun package.
 *
 * @implements {import('./shared-cache.js').SharedCacheService}
 */
export class SharedCacheService extends Service {
	/** Creates the package owner in the app registry.
	 *
	 * @param {unknown} [ownerRegistry] - Registry owning this feature.
	 */
	constructor(ownerRegistry = registry) {
		super('shared-cache', ownerRegistry);
		this.implement(['start', 'stop', 'isAvailable', 'resolve', 'resolveAsset']);
		this._package = null;
	}

	/** Call this method to authenticate the selected package during local startup.
	 * Missing or invalid package data is logged and leaves the capability unavailable.
	 *
	 * @returns {Promise<void>} - Authentication completed or its failure recorded.
	 */
	async start() {
		this.stop();
		try {
			this._package = await createProductionSharedCacheService();
		} catch (error) {
			console.error('Flat32 Distant-Sun cache setup failed.', error);
		}
	}

	/** Call this method to release this owner's package reference.
	 *
	 * @returns {void} - Capability unavailable until started again.
	 */
	stop() {
		this._package = null;
	}

	/** Call this method to read whether package authentication succeeded.
	 *
	 * @returns {boolean} - Whether package operations are currently usable.
	 */
	isAvailable() {
		return this._package !== null;
	}

	/** Call this method to resolve one physical solar-zenith input.
	 * Invalid angles throw; unavailable startup throws and the caller must retain its prior state.
	 *
	 * @param {number} degrees - Solar zenith in degrees.
	 * @param {string} assetBaseUrl - App-mount-relative asset URL prefix.
	 * @returns {Flat32DistantSunCacheResolution} - Selected physical cache descriptor.
	 */
	resolve(degrees, assetBaseUrl) {
		if (!this._package) throw new Error('Distant-Sun cache service is unavailable.');
		return this._package.resolve(degrees, assetBaseUrl);
	}

	/** Call this method to read an authenticated complete immutable artifact.
	 * Missing or invalid paths reject; unexpected filesystem errors propagate to the caller.
	 *
	 * @param {string} name - Package-relative artifact identifier.
	 * @returns {Promise<SharedCacheServedArtifact>} - Authenticated complete file bytes.
	 */
	async resolveAsset(name) {
		if (!this._package) throw new Error('Distant-Sun cache service is unavailable.');
		return this._package.resolveAsset(name);
	}
}

new SharedCacheService();
