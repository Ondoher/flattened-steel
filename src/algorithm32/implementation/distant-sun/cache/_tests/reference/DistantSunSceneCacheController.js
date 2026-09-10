import DistantSunSceneCacheAssetLoader from './DistantSunSceneCacheAssetLoader.js';
import {
	DISTANT_SUN_SCENE_CACHE_MAXIMUM_RESIDENT_BYTES,
	DISTANT_SUN_SCENE_CACHE_MAXIMUM_TRANSITION_BYTES,
	DISTANT_SUN_SCENE_CACHE_MAXIMUM_TRANSITION_WITH_STAGING_BYTES,
} from '../../consts.js';

/** Own transactional publication of exact asset-backed distant-Sun scene caches. */
export default class DistantSunSceneCacheController {
	/** @type {CacheGpuBackend} */ _backend;
	/** @type {DistantSunSceneCacheLoaderFactory} */ _loaderFactory;
	/** @type {DistantSunSceneCacheAssetSelection} */ _asset;
	/** @type {import('../../DistantSunSceneCache.js').default | null} */ _active = null;
	/** @type {Promise<void>} */ _tail = Promise.resolve();
	/** @type {AbortController | null} */ _latestCancellation = null;
	/** @type {number} */ _generation = 0;
	/** @type {number} */ _lastTransitionTextureBytes = 0;
	/** @type {number} */ _lastTransitionWithStagingBytes = 0;
	/** @type {boolean} */ _disposed = false;

	/** @param {DistantSunSceneCacheControllerDefinition} definition - Exact asset and renderer backend. */
	constructor(definition) {
		this._backend = definition.backend;
		this._asset = definition.asset;
		this._loaderFactory =
			definition.loaderFactory ??
			((asset) => new DistantSunSceneCacheAssetLoader({backend: this._backend, assetRoot: asset.assetRoot}));
	}

	/** Complete resident cache currently owned by this attachment. */
	get active() {
		return this._active;
	}

	/** Logical bytes governed by the qualified exact-seam publication policy. */
	get resources() {
		const activeBytes = this._active?.resources.residentTextureBytes.value ?? 0;
		return {
			maximumResidentTextureBytes: {
				value: DISTANT_SUN_SCENE_CACHE_MAXIMUM_RESIDENT_BYTES,
				units: 'bytes',
			},
			maximumAtomicTransitionTextureBytes: {
				value: DISTANT_SUN_SCENE_CACHE_MAXIMUM_TRANSITION_BYTES,
				units: 'bytes',
			},
			maximumTransitionWithStagingBytes: {
				value: DISTANT_SUN_SCENE_CACHE_MAXIMUM_TRANSITION_WITH_STAGING_BYTES,
				units: 'bytes',
			},
			activeResidentTextureBytes: {value: activeBytes, units: 'bytes'},
			lastTransitionTextureBytes: {value: this._lastTransitionTextureBytes, units: 'bytes'},
			lastTransitionWithStagingBytes: {
				value: this._lastTransitionWithStagingBytes,
				units: 'bytes',
			},
		};
	}

	/** @param {string} message - Abort diagnostic. @returns {Error} - Abort-classified error. */
	_createAbortError(message) {
		const error = new Error(message);
		error.name = 'AbortError';
		return error;
	}

	/** @param {number} generation - Expected generation. @param {AbortController} cancellation - Owned signal. */
	_requireCurrentGeneration(generation, cancellation) {
		if (this._disposed || cancellation.signal.aborted || generation !== this._generation) {
			throw this._createAbortError('Distant-Sun scene-cache load was cancelled or superseded.');
		}
	}

	/** @param {AbortSignal | undefined} signal - Caller signal. @param {AbortController} cancellation - Owned signal. */
	_linkCancellation(signal, cancellation) {
		if (!signal) return () => {};
		const abort = () => cancellation.abort(signal.reason);
		signal.addEventListener('abort', abort, {once: true});
		return () => signal.removeEventListener('abort', abort);
	}

	/** Load, validate, and atomically publish one exact asset generation. */
	async _executeGeneration(generation, asset, cancellation, forceReload) {
		this._requireCurrentGeneration(generation, cancellation);
		if (!forceReload && this._active?.cacheIdentity === asset.loadRequest.cacheIdentity) return this._active;

		const candidate = await this._loaderFactory(asset).load({
			...asset.loadRequest,
			signal: cancellation.signal,
		});
		try {
			this._requireCurrentGeneration(generation, cancellation);
			const candidateBytes = candidate.resources.residentTextureBytes.value;
			if (candidateBytes > DISTANT_SUN_SCENE_CACHE_MAXIMUM_RESIDENT_BYTES) {
				throw new RangeError('Distant-Sun scene-cache candidate exceeds the qualified resident-byte policy.');
			}
			const previousBytes = this._active?.resources.residentTextureBytes.value ?? 0;
			const transitionBytes = previousBytes + candidateBytes;
			const transitionWithStagingBytes = transitionBytes + candidate.resources.hostStagingBytes.value;
			if (
				transitionBytes > DISTANT_SUN_SCENE_CACHE_MAXIMUM_TRANSITION_BYTES ||
				transitionWithStagingBytes > DISTANT_SUN_SCENE_CACHE_MAXIMUM_TRANSITION_WITH_STAGING_BYTES
			) {
				throw new RangeError('Distant-Sun scene-cache candidate exceeds the qualified transition-byte policy.');
			}
			const previous = this._active;
			this._active = candidate;
			this._asset = asset;
			this._lastTransitionTextureBytes = transitionBytes;
			this._lastTransitionWithStagingBytes = transitionWithStagingBytes;
			previous?.dispose();
			return candidate;
		} catch (error) {
			candidate.dispose();
			throw error;
		}
	}

	/** Serialize one generation, superseding older incomplete work. */
	_publish(asset, request, forceReload) {
		if (this._disposed) return Promise.reject(new Error('DistantSunSceneCacheController is disposed.'));
		if (request.signal?.aborted) {
			return Promise.reject(this._createAbortError('Distant-Sun scene-cache load was aborted.'));
		}
		const generation = ++this._generation;
		this._latestCancellation?.abort();
		const cancellation = new AbortController();
		this._latestCancellation = cancellation;
		const unlink = this._linkCancellation(request.signal, cancellation);
		const operation = this._tail.then(() => this._executeGeneration(generation, asset, cancellation, forceReload));
		this._tail = operation.then(
			() => {},
			() => {},
		);
		return operation.finally(() => {
			unlink();
			if (this._latestCancellation === cancellation) this._latestCancellation = null;
		});
	}

	/** Load or exactly reuse the configured complete scene cache. */
	createScatteringCache(request = {}) {
		return this._publish(this._asset, request, false);
	}

	/** Replace the active scene cache only after another exact asset is completely loaded. */
	replaceSceneCache(asset, request = {}) {
		return this._publish(asset, request, false);
	}

	/** Re-upload the selected exact asset after renderer context restoration. */
	restoreSceneCache(request = {}) {
		return this._publish(this._asset, request, true);
	}

	/** Invalidate renderer-owned resources while their WebGL context is lost, retaining the exact asset selection. */
	handleContextLoss() {
		if (this._disposed) return;
		this._generation += 1;
		this._latestCancellation?.abort();
		this._latestCancellation = null;
		this._active?.dispose();
		this._active = null;
	}

	/** Cancel incomplete loading and release the resident cache exactly once. */
	dispose() {
		if (this._disposed) return;
		this.handleContextLoss();
		this._disposed = true;
	}
}
