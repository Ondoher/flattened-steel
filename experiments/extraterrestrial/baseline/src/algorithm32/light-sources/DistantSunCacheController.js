import { CacheGpuExecutor } from '../caches/gpu/CacheGpuExecutor.js';
import { CachePassAssembler } from '../caches/gpu/CachePassAssembler.js';
import { NATIVE_15_SPECTRAL_BASIS } from '../profiles/native-15-profile.js';
import { DistantSunCache } from './DistantSunCache.js';
import { createDistantSunCacheBuildPlan } from './distant-sun-cache-plan.js';
import {
	createDistantSunCacheFingerprint,
} from './distant-sun-cache-fingerprint.js';

/** Own distant-Sun GPU cache construction for exactly one runtime attachment. */
export class DistantSunCacheController {
	/** @type {DistantSunCacheSource} */
	_source;
	/** @type {CacheGpuBackend} */
	_backend;
	/** @type {CacheBuildScheduler | undefined} */
	_scheduler;
	/** @type {CacheGpuExecutor} */
	_executor;
	/** @type {DistantSunCache | null} */
	_active = null;
	/** @type {string | null} */
	_activeFingerprint = null;
	/** @type {Promise<void>} */
	_tail = Promise.resolve();
	/** @type {AbortController | null} */
	_latestCancellation = null;
	_generation = 0;
	_disposed = false;

	/**
	 * Create one ordinary cancellation error without requiring a DOM runtime.
	 *
	 * @param {string} message - Supplies the diagnostic.
	 * @returns {Error} The abort error.
	 */
	_createAbortError(message) {
		const error = new Error(message);
		error.name = 'AbortError';
		return error;
	}

	/**
	 * Accept one supported construction maximum.
	 *
	 * @param {unknown} value - Supplies the requested maximum.
	 * @returns {SupportedCacheScatteringOrder} The accepted maximum.
	 */
	_acceptMaximumScatteringOrder(value) {
		const maximumScatteringOrder = value === undefined ? 4 : value;
		if (maximumScatteringOrder !== 1
			&& maximumScatteringOrder !== 2
			&& maximumScatteringOrder !== 4) {
			throw new RangeError(
				'Distant-Sun GPU maximum scattering order must be one of 1, 2, 4.',
			);
		}
		return maximumScatteringOrder;
	}

	/**
	 * Accept an omitted or executable physical ground boundary.
	 *
	 * @param {unknown} value - Supplies the candidate boundary.
	 * @returns {(GroundBoundary & CacheBuildContributor) | null} The accepted
	 * boundary, or canonical-black omission.
	 */
	_acceptGroundBoundary(value) {
		if (value === undefined || value === null) {
			return null;
		}
		if (typeof value !== 'object'
			|| typeof /** @type {Record<string, unknown>} */ (value)
				.createCacheModule !== 'function'
			|| typeof /** @type {Record<string, unknown>} */ (value)
				.describe !== 'function'
			|| typeof /** @type {Record<string, unknown>} */ (value)
				.evaluateBrdf !== 'function') {
			throw new TypeError(
				'Distant-Sun GPU groundBoundary must implement the physical '
				+ 'boundary and cache-contributor contracts.',
			);
		}
		return /** @type {GroundBoundary & CacheBuildContributor} */ (value);
	}

	/**
	 * Require the selected native basis across every physical cache owner.
	 *
	 * @param {ScatteringCacheBuildRequest} request - Supplies build owners.
	 * @param {DistantSunCacheSource} source - Supplies the configured source.
	 * @returns {void}
	 */
	_acceptSpectralBasis(request, source) {
		const expectedHash = NATIVE_15_SPECTRAL_BASIS.contentHash;
		if (request.spectralBasis.contentHash !== expectedHash
			|| request.atmosphere.spectralBasis.contentHash !== expectedHash
			|| source.configuration.sourceIrradiance.basis.contentHash
				!== expectedHash) {
			throw new RangeError(
				'Distant-Sun GPU cache construction requires the native-15 spectral basis.',
			);
		}
	}

	/**
	 * Accept semantic values at the source-owned construction boundary.
	 *
	 * @param {ScatteringCacheBuildRequest} request - Supplies the request.
	 * @param {DistantSunCacheSource} source - Supplies the configured source.
	 * @returns {ScatteringCacheBuildRequest & Readonly<{
	 *   groundBoundary: (GroundBoundary & CacheBuildContributor) | null,
	 *   maximumScatteringOrder: SupportedCacheScatteringOrder,
	 * }>} The normalized request.
	 */
	_acceptBuildRequest(request, source) {
		if (request.signal?.aborted === true) {
			throw this._createAbortError(
				'Distant-Sun cache construction was aborted.',
			);
		}
		this._acceptSpectralBasis(request, source);
		return {
			...request,
			groundBoundary:
				this._acceptGroundBoundary(
					request.groundBoundary,
				),
			maximumScatteringOrder:
				this._acceptMaximumScatteringOrder(
					request.maximumScatteringOrder,
				),
		};
	}

	/**
	 * Link caller cancellation to one controller-owned generation signal.
	 *
	 * @param {AbortSignal | undefined} signal - Supplies caller cancellation.
	 * @param {AbortController} controller - Supplies owned cancellation.
	 * @returns {() => void} The unlink operation.
	 */
	_linkCancellation(signal, controller) {
		if (!signal) {
			return () => {};
		}
		const abort = () => controller.abort();
		signal.addEventListener('abort', abort, { once: true });
		return () => signal.removeEventListener('abort', abort);
	}

	/**
	 * Create one per-runtime distant-Sun cache controller.
	 *
	 * @param {Readonly<{
	 *   source: DistantSunCacheSource,
	 *   backend: CacheGpuBackend,
	 *   scheduler?: CacheBuildScheduler,
	 * }>} request - Supplies the source and externally owned GPU backend.
	 */
	constructor(request) {
		this._source = request.source;
		this._backend = request.backend;
		this._scheduler = request.scheduler;
		this._executor = new CacheGpuExecutor({
			backend: this._backend,
			assembler: new CachePassAssembler(),
		});
	}

	/** @returns {DistantSunCache | null} The atomically published active cache. */
	get active() {
		return this._active;
	}

	/** Require one generation to remain the live controller request. */
	_requireCurrentGeneration(generation, cancellation) {
		if (this._disposed
			|| cancellation.signal.aborted
			|| generation !== this._generation) {
			throw this._createAbortError(
				'Distant-Sun cache construction was cancelled or superseded.',
			);
		}
	}

	/** Build, reuse, or atomically publish one accepted generation. */
	async _executeGeneration(generation, request, cancellation) {
		this._requireCurrentGeneration(generation, cancellation);
		const plan = createDistantSunCacheBuildPlan({
			source: this._source,
			atmosphere: request.atmosphere,
			geometry: request.geometry,
			groundBoundary: request.groundBoundary,
			maximumScatteringOrder: request.maximumScatteringOrder,
		});
		const fingerprint = createDistantSunCacheFingerprint(
			plan,
			this._backend.capabilities,
		);
		this._requireCurrentGeneration(generation, cancellation);

		if (this._active !== null
			&& this._activeFingerprint === fingerprint) {
			return this._active;
		}

		const artifact = await this._executor.execute(plan, {
			scheduler: this._scheduler,
			signal: cancellation.signal,
		});
		try {
			this._requireCurrentGeneration(generation, cancellation);
		} catch (error) {
			artifact.dispose();
			throw error;
		}

		const cache = new DistantSunCache(artifact);
		const previous = this._active;
		this._active = cache;
		this._activeFingerprint = fingerprint;
		previous?.dispose();
		return cache;
	}

	/**
	 * Construct or reuse one complete cumulative scattering cache.
	 *
	 * Newer calls supersede older generations. Execution remains serialized so
	 * the controller-owned executor never runs two staging graphs concurrently.
	 *
	 * @param {ScatteringCacheBuildRequest} request - Supplies accepted physical
	 * owners and the requested maximum scattering order.
	 * @returns {Promise<DistantSunCache>} The cache that became active.
	 */
	createScatteringCache(request) {
		if (this._disposed) {
			return Promise.reject(new Error('DistantSunCacheController is disposed.'));
		}

		let accepted;
		try {
			accepted = this._acceptBuildRequest(
				request,
				this._source,
			);
		} catch (error) {
			return Promise.reject(error);
		}

		const generation = this._generation + 1;
		this._generation = generation;
		this._latestCancellation?.abort();
		const cancellation = new AbortController();
		this._latestCancellation = cancellation;
		const unlinkCancellation = this._linkCancellation(
			accepted.signal,
			cancellation,
		);
		const predecessor = this._tail;
		const operation = predecessor.then(() => this._executeGeneration(
			generation,
			accepted,
			cancellation,
		));
		this._tail = operation.then(() => {}, () => {});

		return operation.finally(() => {
			unlinkCancellation();
			if (this._latestCancellation === cancellation) {
				this._latestCancellation = null;
			}
		});
	}

	/** Cancel staging and release the active cache without owning the backend. */
	dispose() {
		if (this._disposed) {
			return;
		}
		this._disposed = true;
		this._generation += 1;
		this._latestCancellation?.abort();
		this._latestCancellation = null;
		this._executor.dispose();
		this._active?.dispose();
		this._active = null;
		this._activeFingerprint = null;
	}
}

export default DistantSunCacheController;
