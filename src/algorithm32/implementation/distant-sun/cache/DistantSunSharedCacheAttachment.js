import DistantSunSharedCache from './DistantSunSharedCache.js';
import DistantSunSharedCacheController from './DistantSunSharedCacheController.js';

/** Stable renderer attachment joining cache construction to predictive scene publication.
 *
 * @implements {CacheController}
 * @implements {DistantSunSharedScenePublication}
 */
export default class DistantSunSharedCacheAttachment {
	/** Borrowed renderer capability. @type {CachePacketAtlasBackend} */
	_backend;
	/** Predictive residency owner. @type {DistantSunSharedCacheController} */
	_controller;
	/** Initial selected scene ordinal, or null for darkness. @type {number | null} */
	_initialScene;
	/** Stable shader-facing cache facade. @type {DistantSunSharedCache | null} */
	_active = null;
	/** Terminal state. */
	_disposed = false;

	/** Creates one renderer-owned shared-cache attachment.
	 *
	 * @param {CachePacketAtlasBackend} backend - Renderer capability.
	 * @param {DistantSunSharedCacheSelection} selection - Authenticated package, transport, and admitted memory policy.
	 */
	constructor(backend, selection) {
		this._backend = backend;
		this._initialScene = selection.sceneOrdinal;
		this._controller = new DistantSunSharedCacheController({...selection, backend});
	}

	/** Stable cache installed in the renderer attachment. @returns {DistantSunSharedCache | null} - Current facade. */
	get active() {
		return this._active;
	}

	/** Call this method to preload the initial predictive window and install its stable cache facade.
	 *
	 * @param {ScatteringCacheBuildRequest} request - Initial setup cancellation.
	 * @returns {Promise<DistantSunSharedCache>} - Stable shader-facing resource.
	 */
	async createScatteringCache(request = {}) {
		if (this._disposed) throw new Error('Shared-cache attachment is disposed.');
		if (this._active) return this._active;
		const candidate = await this.prepareScene(this._initialScene, {}, request.signal);
		if (!candidate) throw new Error('Shared-cache initial window could not be prepared.');
		this.publishPrepared(candidate.snapshot.generation);
		return this._active;
	}

	/** Call this method to prepare one complete candidate while the previous scene remains visible.
	 *
	 * @param {number | null} sceneOrdinal - Cache scene or explicit darkness.
	 * @param {DistantSunSharedCacheSceneRequest} options - Route and velocity hints.
	 * @param {AbortSignal} [signal] - Caller cancellation.
	 * @returns {Promise<DistantSunSharedCacheFrame | undefined>} - Borrowed complete candidate for lighting preparation.
	 */
	async prepareScene(sceneOrdinal, options = {}, signal) {
		if (this._disposed) throw new Error('Shared-cache attachment is disposed.');
		signal?.throwIfAborted();
		const cancel = () => this._controller.cancelPreparation();
		signal?.addEventListener('abort', cancel, {once: true});
		try {
			const ready = await this._controller.requestScene(sceneOrdinal, options);
			signal?.throwIfAborted();
			return ready ? this._controller.getPreparedFrame() : undefined;
		} finally {
			signal?.removeEventListener('abort', cancel);
		}
	}

	/** Call this method at one frame boundary after all matching lighting preparation succeeds.
	 *
	 * @param {number} generation - Exact prepared candidate generation.
	 * @returns {DistantSunSharedCacheFrame} - Atomically published frame.
	 */
	publishPrepared(generation) {
		const candidate = this._controller.getPreparedFrame();
		if (
			!candidate ||
			candidate.snapshot.generation !== generation ||
			(candidate.atlas && !candidate.atlas.isCurrent())
		)
			throw new Error('Shared-cache prepared publication was superseded or lost.');
		const frame = this._controller.publishFrame();
		if (!frame || frame.snapshot.generation !== generation)
			throw new Error('Shared-cache publication did not complete.');
		if (this._active) this._active.publish(frame);
		else this._active = new DistantSunSharedCache(this._backend, frame);
		return frame;
	}

	/** Call this method to set a declared preparation route.
	 *
	 * @param {readonly number[]} route - Ordered scene selections.
	 * @returns {void}
	 */
	setRoute(route) {
		this._controller.setRoute(route);
	}

	/** Call this method to inspect bounded residency and preparation diagnostics.
	 *
	 * @returns {DistantSunSharedCacheControllerDiagnostics} - Current diagnostics.
	 */
	diagnostics() {
		return this._controller.diagnostics();
	}

	/** Call this method to cancel unpublished preparation without touching the current frame.
	 *
	 * @returns {void}
	 */
	cancelPreparation() {
		this._controller.cancelPreparation();
	}

	/** Call this method to release the attachment and its GPU resources once.
	 *
	 * @returns {void}
	 */
	dispose() {
		if (this._disposed) return;
		this._disposed = true;
		this._controller.dispose();
		this._active?.dispose();
		this._active = null;
	}
}
