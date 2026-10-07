import DistantSunSharedCachePackage from '../algorithm32/implementation/distant-sun/cache/DistantSunSharedCachePackage.js';
import DistantSunSharedCacheTransport from '../algorithm32/implementation/distant-sun/cache/DistantSunSharedCacheTransport.js';
import DistantSunSharedCacheWorkerClient from '../algorithm32/implementation/distant-sun/cache/DistantSunSharedCacheWorkerClient.js';
import {DISTANT_SUN_SHARED_CACHE_PACKET_BYTES} from '../algorithm32/implementation/distant-sun/cache/consts.js';

/** Application-owned authenticated package reuse and sole persistent Worker transport. */
export default class SharedDistantCacheAssets {
	/**
	 * Admit a server-selected transition qualification only on its measured runtime target and complete byte budget.
	 * @param {DistantSunSharedCacheMemoryQualification | undefined} value - Server-selected qualification.
	 * @param {string} renderer - Unmasked WebGL renderer string.
	 * @returns {DistantSunSharedCacheMemoryQualification | undefined} - Admitted runtime policy.
	 */
	_admitTransitionQualification(value, renderer) {
		const target = value?.targetId?.match(/^(.+) \/ Chrome ([1-9][0-9]*) \/ ANGLE (D3D11)$/u);
		const browser = navigator.userAgent.match(/Chrome\/([1-9][0-9]*)\./u);
		if (
			!target ||
			!browser ||
			!/^sha256:[a-f0-9]{64}$/u.test(value.evidenceId) ||
			!Number.isSafeInteger(value.maximumBytes) ||
			value.maximumBytes < 48 * DISTANT_SUN_SHARED_CACHE_PACKET_BYTES ||
			browser[1] !== target[2] ||
			!renderer.includes(`${target[1]} (`) ||
			!/Direct3D11.*D3D11/u.test(renderer)
		)
			return undefined;
		return value;
	}

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
		const transitionQualification = this._admitTransitionQualification(asset.transitionQualification, renderer);
		return {
			package: this._package,
			transport,
			sceneOrdinal: ordinal,
			maximumGpuBytes: transitionQualification?.maximumBytes ?? 24 * DISTANT_SUN_SHARED_CACHE_PACKET_BYTES,
			transitionQualification,
			solarInterpolation: asset.solarInterpolation,
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
