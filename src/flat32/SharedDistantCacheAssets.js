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
	 * @param {number | null} ordinal - Representative catalog scene, or darkness.
	 * @param {AbortSignal} signal - Application preparation cancellation.
	 * @param {WebGLRenderingContext | WebGL2RenderingContext} [context] - Actual rendering target, required for larger allocations.
	 * @returns {Promise<DistantSunSharedCacheSelection>} - Authenticated package, transport, and explicit memory policy.
	 */
	async select(asset, ordinal, signal, context) {
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
		const extension = context?.getExtension('WEBGL_debug_renderer_info');
		const renderer = extension ? String(context.getParameter(extension.UNMASKED_RENDERER_WEBGL)) : '';
		const qualified =
			asset.packageSetIdentity === '7e80317f53c79d0d5a30ebc006630213a2e758008c62a3abb14d2534a8cc2b99' &&
			asset.transitionQualification?.evidenceId ===
				'sha256:4544d8f0f881d9f32208adab945858b614cef22ee80b2ded0eb078ec4f2e5dce' &&
			asset.transitionQualification.targetId === 'NVIDIA GeForce RTX 2060 / Chrome 153 / ANGLE D3D11' &&
			/NVIDIA GeForce RTX 2060 \(/u.test(renderer) &&
			/Direct3D11.*D3D11/u.test(renderer) &&
			/Chrome\/153\./u.test(navigator.userAgent);
		const transitionQualification = qualified ? asset.transitionQualification : undefined;
		return {
			package: this._package,
			transport,
			sceneOrdinal: ordinal,
			maximumGpuBytes: transitionQualification
				? 48 * DISTANT_SUN_SHARED_CACHE_PACKET_BYTES
				: 24 * DISTANT_SUN_SHARED_CACHE_PACKET_BYTES,
			transitionQualification,
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
