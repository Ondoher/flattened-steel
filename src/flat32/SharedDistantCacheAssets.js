import DistantSunSharedCachePackage from '../algorithm32/implementation/distant-sun/cache/DistantSunSharedCachePackage.js';
import DistantSunSharedCacheTransport from '../algorithm32/implementation/distant-sun/cache/DistantSunSharedCacheTransport.js';
import DistantSunSharedCacheWorkerClient from '../algorithm32/implementation/distant-sun/cache/DistantSunSharedCacheWorkerClient.js';
import {DISTANT_SUN_SHARED_CACHE_PACKET_BYTES} from '../algorithm32/implementation/distant-sun/cache/consts.js';

/** Application-owned authenticated package reuse and sole persistent Worker transport. */
export default class SharedDistantCacheAssets {
	/** Authenticated selected package. @type {DistantSunSharedCachePackage | undefined} */
	_package;
	/** Trusted package-root identity. */
	_identity = '';
	/** Transport created by this application, absent when borrowing the existing process owner. @type {DistantSunSharedCacheTransport | undefined} */
	_ownedTransport;
	/** Terminal state. */
	_disposed = false;

	/** Call this method to authenticate a selected package and obtain one renderer-independent runtime selection.
	 * @param {Flat32SharedCacheAssetSelection} asset - Validated server selection.
	 * @param {number} ordinal - Representative catalog scene.
	 * @param {AbortSignal} signal - Application preparation cancellation.
	 * @returns {Promise<DistantSunSharedCacheSelection>} - Authenticated package, transport, and explicit memory policy.
	 */
	async select(asset, ordinal, signal) {
		if (this._disposed) throw new Error('Shared-cache asset owner is disposed.');
		signal.throwIfAborted();
		if (!this._package || this._identity !== asset.report.sha256) {
			const candidate = await DistantSunSharedCachePackage.load({
				rootUrl: new URL(asset.rootUrl, location.href).href,
				report: asset.report,
				signal,
			});
			signal.throwIfAborted();
			if (this._disposed) throw new Error('Shared-cache asset owner was disposed during loading.');
			this._package = candidate;
			this._identity = asset.report.sha256;
		}
		let transport = DistantSunSharedCacheTransport.current;
		if (!transport) {
			transport = new DistantSunSharedCacheTransport({
				preparer: new DistantSunSharedCacheWorkerClient({
					workerUrl: new URL('shared-cache-worker.js', location.href).href,
				}),
			});
			this._ownedTransport = transport;
		}
		return {
			package: this._package,
			transport,
			sceneOrdinal: ordinal,
			maximumGpuBytes: asset.transitionQualification
				? 48 * DISTANT_SUN_SHARED_CACHE_PACKET_BYTES
				: 24 * DISTANT_SUN_SHARED_CACHE_PACKET_BYTES,
			transitionQualification: asset.transitionQualification,
		};
	}

	/** Call this method to release this application's Worker and retained host pins after runtimes dispose.
	 * @returns {void}
	 */
	dispose() {
		if (this._disposed) return;
		this._disposed = true;
		this._ownedTransport?.dispose();
		this._package = undefined;
	}
}
