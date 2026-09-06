import {DistantSunCelestialCacheResource} from './DistantSunCelestialCacheResource.js';
import {DistantSunCelestialGpuBuilder} from './DistantSunCelestialGpuBuilder.js';

/**
 * Transactional controller for one spherical distant-Sun celestial GPU resource.
 *
 * @implements {DistantSunCelestialCacheController}
 */
export class DistantSunCelestialCacheController {
	/** @type {SharedModel} */
	_model;
	/** @type {DistantSunCelestialLogicalCacheSource & DistantSunCelestialCacheModuleContributor} */
	_source;
	/** @type {CacheGpuBackend} */
	_backend;
	/** @type {CacheBuildScheduler | undefined} */
	_scheduler;
	/** @type {DistantSunCelestialGpuBuilder} */
	_builder;
	/** @type {DistantSunCelestialCacheResource | null} */
	_active = null;
	/** @type {string | null} */
	_activeReuseKey = null;
	/** @type {Promise<void>} */
	_tail = Promise.resolve();
	/** @type {AbortController | null} */
	_latestCancellation = null;
	/** @type {number} */
	_generation = 0;
	/** @type {boolean} */
	_disposed = false;

	/**
	 * Creates one attachment-owned controller over a configured source and external backend.
	 *
	 * @param {DistantSunCelestialCacheControllerConfiguration} request - Configured model and construction collaborators.
	 */
	constructor(request) {
		this._model = request.model;
		this._source =
			/** @type {DistantSunCelestialLogicalCacheSource & DistantSunCelestialCacheModuleContributor} */ (
				/** @type {unknown} */ (request.model.lightSource)
			);
		this._backend = request.backend;
		this._scheduler = request.scheduler;
		this._builder = new DistantSunCelestialGpuBuilder({
			model: this._model,
			source: this._source,
			backend: this._backend,
		});
	}

	/** Currently published complete resource, or null before the first successful build. */
	get active() {
		return this._active;
	}

	/**
	 * Called by this controller to create an ordinary cancellation error without requiring a DOM runtime.
	 *
	 * @param {string} message - Caller-facing cancellation diagnostic.
	 * @returns {Error} - Abort-classified error.
	 */
	_createAbortError(message) {
		const error = new Error(message);
		error.name = 'AbortError';
		return error;
	}

	/**
	 * Called by this controller to reject a generation that was cancelled, superseded, or disposed.
	 *
	 * @param {number} generation - Generation expected to remain current.
	 * @param {AbortController} cancellation - Controller-owned cancellation state.
	 * @returns {void} - No return value.
	 * @throws {Error} - When the generation can no longer publish.
	 */
	_requireCurrentGeneration(generation, cancellation) {
		if (this._disposed || cancellation.signal.aborted || generation !== this._generation) {
			throw this._createAbortError('Distant-Sun celestial cache construction was cancelled or superseded.');
		}
	}

	/**
	 * Called by this controller to accept one caller signal at the construction ingress.
	 *
	 * @param {DistantSunCelestialCacheBuildRequest} request - Trusted geometry request and optional signal.
	 * @returns {DistantSunCelestialCacheBuildRequest} - Accepted request.
	 * @throws {Error} - When the request was already aborted.
	 */
	_acceptBuildRequest(request) {
		if (request.signal?.aborted === true) {
			throw this._createAbortError('Distant-Sun celestial cache construction was aborted.');
		}
		return request;
	}

	/**
	 * Called by this controller to link caller cancellation to one owned generation signal.
	 *
	 * @param {AbortSignal | undefined} signal - Optional caller cancellation signal.
	 * @param {AbortController} controller - Controller-owned generation cancellation.
	 * @returns {() => void} - Operation that removes the link.
	 */
	_linkCancellation(signal, controller) {
		if (!signal) {
			return /** Called by link cancellation to remove an absent signal link. */ () => {};
		}
		/** Called by caller cancellation to abort the controller-owned generation. */
		const abort = () => controller.abort();
		signal.addEventListener('abort', abort, {once: true});
		return /** Called by generation cleanup to remove the caller signal link. */ () =>
			signal.removeEventListener('abort', abort);
	}

	/**
	 * Called by this controller to execute, reuse, or atomically publish one current generation.
	 * Execution failure preserves the previous resource; cancellation after execution disposes staging before rejecting.
	 *
	 * @param {number} generation - Current generation number.
	 * @param {DistantSunCelestialCacheBuildRequest} request - Accepted geometry request.
	 * @param {AbortController} cancellation - Controller-owned cancellation state.
	 * @returns {Promise<DistantSunCelestialCacheResource>} - Reused or newly published complete resource.
	 */
	async _executeGeneration(generation, request, cancellation) {
		this._requireCurrentGeneration(generation, cancellation);
		const plan = this.createBuildPlan(request);
		const reuseKey = plan.identity.contentHash;
		this._requireCurrentGeneration(generation, cancellation);

		if (this._active !== null && this._activeReuseKey === reuseKey) {
			return this._active;
		}

		const result = await this._builder.execute(plan, {
			scheduler: this._scheduler,
			signal: cancellation.signal,
		});
		try {
			this._requireCurrentGeneration(generation, cancellation);
		} catch (error) {
			result.artifact.dispose();
			throw error;
		}

		const next = new DistantSunCelestialCacheResource({plan, artifact: result.artifact});
		const previous = this._active;
		this._active = next;
		this._activeReuseKey = reuseKey;
		previous?.dispose();
		return next;
	}

	/**
	 * Call this method to derive the complete trusted one-field GPU plan without executing it.
	 *
	 * @param {DistantSunCelestialCachePlanRequest} request - Geometry placement and query facts.
	 * @returns {DistantSunCelestialCachePlan} - Complete distant-Sun execution plan.
	 */
	createBuildPlan(request) {
		if (this._disposed) {
			throw new Error('DistantSunCelestialCacheController is disposed.');
		}
		return this._builder.createBuildPlan(request);
	}

	/**
	 * Call this method to serialize construction, supersede older work, and publish only a complete resource.
	 * Failure or cancellation rejects without replacing the last valid resource.
	 *
	 * @param {DistantSunCelestialCacheBuildRequest} request - Trusted geometry facts and optional cancellation signal.
	 * @returns {Promise<DistantSunCelestialCacheResource>} - Completely constructed or exactly reused resource.
	 */
	build(request) {
		if (this._disposed) {
			return Promise.reject(new Error('DistantSunCelestialCacheController is disposed.'));
		}

		let accepted;
		try {
			accepted = this._acceptBuildRequest(request);
		} catch (error) {
			return Promise.reject(error);
		}

		const generation = this._generation + 1;
		this._generation = generation;
		this._latestCancellation?.abort();
		const cancellation = new AbortController();
		this._latestCancellation = cancellation;
		const unlinkCancellation = this._linkCancellation(accepted.signal, cancellation);
		const operation = this._tail.then(
			/** Called by serialized construction to execute the current generation. */ () =>
				this._executeGeneration(generation, accepted, cancellation),
		);
		this._tail = operation.then(
			/** Called by serialized construction to release a successful predecessor. */ () => {},
			/** Called by serialized construction to release a failed predecessor. */ () => {},
		);

		return operation.finally(
			/** Called by generation settlement to unlink cancellation state. */ () => {
				unlinkCancellation();
				if (this._latestCancellation === cancellation) {
					this._latestCancellation = null;
				}
			},
		);
	}

	/**
	 * Call this method to cancel staging and release the active resource without disposing the external backend.
	 *
	 * @returns {void} - No return value.
	 */
	dispose() {
		if (this._disposed) {
			return;
		}
		this._disposed = true;
		this._generation += 1;
		this._latestCancellation?.abort();
		this._latestCancellation = null;
		this._active?.dispose();
		this._active = null;
		this._activeReuseKey = null;
	}
}
