import DistantSunSharedCachePackage from '../algorithm32/implementation/distant-sun/cache/DistantSunSharedCachePackage.js';
import {DistantSunSharedCacheOwnership} from '../algorithm32/implementation/distant-sun/cache/DistantSunSharedCacheOwnership.js';
import DistantSunSharedCacheWorkerClient from '../algorithm32/implementation/distant-sun/cache/DistantSunSharedCacheWorkerClient.js';

/**
 * Application-owned authenticated package reuse and sole persistent Worker transport.
 */
export default class SharedDistantCacheAssets {
	/**
	 * Authenticated selected package.
	 *
	 * @type {DistantSunSharedCachePackage | undefined}
	 */
	_package;
	/**
	 * Trusted package-root identity.
	 */
	_identity = '';
	/**
	 * Independently releasable application transport lifetime.
	 *
	 * @type {DistantSunSharedCacheTransportBorrow | undefined}
	 */
	_transportBorrow;
	/**
	 * Terminal state.
	 */
	_disposed = false;

	/**
	 * Call this method to authenticate a selected package and obtain one renderer-independent runtime selection.
	 *
	 * @param {Flat32SharedCacheAssetSelection} asset - Validated server selection.
	 * @param {number | null} ordinal - Representative catalog scene, or darkness.
	 * @param {AbortSignal} signal - Application preparation cancellation.
	 * @param {WebGLRenderingContext | WebGL2RenderingContext} [_context] - Existing caller's rendering target; allocation checks belong to the backend.
	 * @returns {Promise<DistantSunSharedCacheSelection>} - Authenticated package and transport without a device qualification gate.
	 */
	async select(asset, ordinal, signal, _context) {
		if (this._disposed) {
			throw new Error('Shared-cache asset owner is disposed.');
		}
		signal.throwIfAborted();
		if (!this._package || this._identity !== asset.report.sha256) {
			const candidate = await DistantSunSharedCachePackage.load({
				rootUrl: new URL(asset.rootUrl, location.href).href,
				report: asset.report,
				signal,
			});
			signal.throwIfAborted();
			if (this._disposed) {
				throw new Error('Shared-cache asset owner was disposed during loading.');
			}
			this._package = candidate;
			this._identity = asset.report.sha256;
		}
		if (!this._transportBorrow) {
			this._transportBorrow = DistantSunSharedCacheOwnership.acquire(() => ({
				preparer: new DistantSunSharedCacheWorkerClient({
					workerUrl: new URL('shared-cache-worker.js', location.href).href,
				}),
			}));
		}
		let transport = this._transportBorrow.transport;
		return {
			package: this._package,
			transport,
			sceneOrdinal: ordinal,
			solarInterpolation: asset.solarInterpolation,
			scatteringAccuracy: asset.scatteringAccuracy,
		};
	}

	/**
	 * Call this method to release this application's Worker and retained host pins after runtimes dispose.
	 *
	 * @returns {void}
	 */
	dispose() {
		if (this._disposed) {
			return;
		}
		this._disposed = true;
		this._transportBorrow?.release();
		this._transportBorrow = undefined;
		this._package = undefined;
	}
}
