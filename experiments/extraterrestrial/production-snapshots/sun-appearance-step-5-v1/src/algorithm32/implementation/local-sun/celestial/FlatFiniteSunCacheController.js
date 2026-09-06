import {FlatFiniteSunCacheResource} from './FlatFiniteSunCacheResource.js';
import {FlatFiniteSunGpuBuilder} from './FlatFiniteSunGpuBuilder.js';

/** Transactional controller for one Flat finite-Sun celestial GPU resource. */
export class FlatFiniteSunCacheController {
	/** @type {FlatFiniteSunGpuBuilder} */
	_builder;
	/** @type {CacheBuildScheduler | undefined} */
	_scheduler;
	/** @type {FlatFiniteSunCacheResource | null} */
	_active = null;
	/** @type {string | null} */
	_activeReuseKey = null;
	/** @type {boolean} */
	_disposed = false;

	/**
	 * Creates one attachment-owned finite-Sun controller.
	 *
	 * @param {FlatFiniteSunCacheControllerConfiguration} request - Model and external backend.
	 */
	constructor(request) {
		this._scheduler = request.scheduler;
		this._builder = new FlatFiniteSunGpuBuilder(request);
	}

	/** Currently published complete resource. */
	get active() {
		return this._active;
	}

	/**
	 * Call this method to construct, exactly reuse, or replace the finite-Sun field.
	 *
	 * @param {FlatFiniteSunCacheBuildRequest} [request] - Optional cancellation state.
	 * @returns {Promise<FlatFiniteSunCacheResource>} - Complete resource.
	 */
	async build(request = {}) {
		if (this._disposed) throw new Error('FlatFiniteSunCacheController is disposed.');
		if (request.signal?.aborted) {
			const error = new Error('Flat finite-Sun cache construction was aborted.');
			error.name = 'AbortError';
			throw error;
		}
		const plan = this._builder.createBuildPlan();
		if (this._active !== null && this._activeReuseKey === plan.identity.contentHash) {
			return this._active;
		}
		const artifact = await this._builder.execute(plan, {
			scheduler: this._scheduler,
			signal: request.signal,
		});
		if (this._disposed || request.signal?.aborted) {
			artifact.dispose();
			const error = new Error('Flat finite-Sun cache construction was cancelled.');
			error.name = 'AbortError';
			throw error;
		}
		const next = new FlatFiniteSunCacheResource({plan, artifact});
		const previous = this._active;
		this._active = next;
		this._activeReuseKey = plan.identity.contentHash;
		previous?.dispose();
		return next;
	}

	/** Call this method to release the active field without disposing the backend. */
	dispose() {
		if (this._disposed) return;
		this._disposed = true;
		this._active?.dispose();
		this._active = null;
		this._activeReuseKey = null;
	}
}
