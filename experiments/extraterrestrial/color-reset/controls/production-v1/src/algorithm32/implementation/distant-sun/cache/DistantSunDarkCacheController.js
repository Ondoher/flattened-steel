import DistantSunDarkCache from './DistantSunDarkCache.js';

/** Own one texture-free dark scattering cache for a renderer attachment. */
export default class DistantSunDarkCacheController {
	/** @type {DistantSunDarkCache | null} */ _active = null;
	/** @type {string} */ _backendId;
	/** @type {boolean} */ _disposed = false;

	/** @param {CacheGpuBackend} backend - Renderer-owned cache backend. */
	constructor(backend) {
		this._backendId = backend.id;
	}

	/** Complete procedural cache currently owned by this attachment. */
	get active() {
		return this._active;
	}

	/** Publish or reuse the one procedural dark cache. */
	async createScatteringCache(request = {}) {
		if (this._disposed) throw new Error('DistantSunDarkCacheController is disposed.');
		if (request.signal?.aborted) {
			const error = new Error('Distant-Sun dark-cache publication was aborted.');
			error.name = 'AbortError';
			throw error;
		}
		this._active ??= new DistantSunDarkCache(this._backendId);
		return this._active;
	}

	/** Release the procedural cache exactly once. */
	dispose() {
		if (this._disposed) return;
		this._active?.dispose();
		this._active = null;
		this._disposed = true;
	}
}
