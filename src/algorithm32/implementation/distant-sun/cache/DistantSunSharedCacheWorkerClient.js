import {
	DISTANT_SUN_SHARED_CACHE_PACKET_BYTES,
	DISTANT_SUN_SHARED_CACHE_REQUEST_LIMIT,
	DISTANT_SUN_SHARED_CACHE_WORKER_TIMEOUT,
} from './consts.js';

/** Main-thread owner of one persistent module Worker and its serialized transfer queue
 *
 * @implements {DistantSunSharedCachePreparationClient}
 */
export default class DistantSunSharedCacheWorkerClient {
	/** Worker construction options.
	 *
	 * @type {DistantSunSharedCacheWorkerClientDefinition}
	 */
	_definition;
	/** Active Worker instance.
	 *
	 * @type {Worker | undefined}
	 */
	_worker;
	/** Pending serialized jobs.
	 *
	 * @type {DistantSunSharedCacheWorkerJob[]}
	 */
	_queue = [];
	/** Currently executing job.
	 *
	 * @type {DistantSunSharedCacheWorkerJob | undefined}
	 */
	_active;
	/** Active job deadline.
	 *
	 * @type {ReturnType<typeof setTimeout> | undefined}
	 */
	_timer;
	/** Monotonic request sequence. */
	_sequence = 0;
	/** Terminal owner disposal state. */
	_disposed = false;

	/**
	 * Creates one lazily started persistent Worker owner
	 *
	 * @param {DistantSunSharedCacheWorkerClientDefinition} definition - Built Worker URL and constructor capability.
	 */
	constructor(definition) {
		const url = new URL(definition.workerUrl, globalThis.location?.href);
		if (
			!['http:', 'https:'].includes(url.protocol) ||
			url.username ||
			url.password ||
			url.hash ||
			(globalThis.location && url.origin !== location.origin)
		)
			throw new TypeError('Shared-cache Worker URL must be same-origin HTTP.');
		this._definition = {...definition, workerUrl: url.href};
	}

	/**
	 * Called to clear one job's subscriber listener
	 *
	 * @param {DistantSunSharedCacheWorkerJob} job - Settled job.
	 * @returns {void}
	 */
	_cleanup(job) {
		job.signal.removeEventListener('abort', job.cancel);
	}

	/**
	 * Called when a Worker becomes unusable to reject all work and release its buffers
	 *
	 * @param {unknown} error - Terminal failure.
	 * @returns {void}
	 */
	_fail(error) {
		clearTimeout(this._timer);
		this._worker?.terminate();
		this._worker = undefined;
		const jobs = [...(this._active ? [this._active] : []), ...this._queue];
		this._active = undefined;
		this._queue = [];
		for (const job of jobs) {
			this._cleanup(job);
			job.reject(error);
		}
	}

	/**
	 * Called to accept exactly one terminal Worker response and continue the serialized queue
	 *
	 * @param {MessageEvent<DistantSunSharedCacheWorkerResponse>} event - Worker response.
	 * @returns {void}
	 */
	_receive(event) {
		const job = this._active;
		if (!job || event.data?.requestId !== job.requestId) {
			this._fail(new Error('Shared-cache Worker response identity is invalid.'));
			return;
		}
		clearTimeout(this._timer);
		this._active = undefined;
		this._cleanup(job);
		if (job.signal.aborted) job.reject(job.signal.reason);
		else {
			const result = event.data.result;
			if (event.data.error) job.reject(new Error(event.data.error));
			else if (
				!(result?.packet?.values instanceof Float32Array) ||
				result.packet.values.byteLength !== DISTANT_SUN_SHARED_CACHE_PACKET_BYTES
			)
				job.reject(new Error('Shared-cache Worker packet shape is invalid.'));
			else job.resolve(result);
		}
		this._pump();
	}

	/** Called to dispatch one queued job while preserving exclusive transferable ownership. @returns {void} */
	_pump() {
		if (this._active || this._disposed || !this._queue.length) return;
		const job = this._queue.shift();
		this._active = job;
		try {
			if (!this._worker) {
				this._worker =
					this._definition.createWorker?.(this._definition.workerUrl) ??
					new Worker(this._definition.workerUrl, {type: 'module'});
				this._worker.onmessage = (event) => this._receive(event);
				this._worker.onerror = (event) => {
					event.preventDefault();
					this._fail(new Error('Shared-cache Worker execution failed.'));
				};
				this._worker.onmessageerror = () => this._fail(new Error('Shared-cache Worker transfer failed.'));
			}
			this._timer = setTimeout(
				() => this._fail(new Error('Shared-cache Worker deadline exceeded.')),
				DISTANT_SUN_SHARED_CACHE_WORKER_TIMEOUT,
			);
			const request = job.request;
			this._worker.postMessage({kind: 'prepare', requestId: job.requestId, request}, [
				request.encoded,
				request.logicalToUniqueIndex.buffer,
			]);
			job.request = undefined;
		} catch (error) {
			this._fail(error);
		}
	}

	/**
	 * Call this method to prepare a packet off the main thread. Cancellation stops delivery immediately;
	 * an active canceled computation settles before another block starts. Invalid, excess, or failed work rejects
	 *
	 * @param {DistantSunSharedCachePreparationRequest} request - Exclusively owned transfer buffers
	 *
	 * @param {AbortSignal} signal - Subscriber-accounted cancellation.
	 * @returns {Promise<DistantSunSharedCachePreparationResult>} - Complete authenticated packet.
	 */
	prepare(request, signal) {
		if (this._disposed || signal.aborted)
			return Promise.reject(signal.reason ?? new Error('Shared-cache Worker is disposed.'));
		if (this._queue.length + Number(Boolean(this._active)) >= DISTANT_SUN_SHARED_CACHE_REQUEST_LIMIT)
			return Promise.reject(new RangeError('Shared-cache Worker queue is full.'));
		return new Promise((resolve, reject) => {
			const job = {
				requestId: ++this._sequence,
				request,
				signal,
				resolve,
				reject,
				cancel: () => {
					this._cleanup(job);
					if (this._active === job) this._worker?.postMessage({kind: 'cancel', requestId: job.requestId});
					else {
						this._queue = this._queue.filter((queued) => queued !== job);
						reject(signal.reason);
					}
				},
			};
			signal.addEventListener('abort', job.cancel, {once: true});
			this._queue.push(job);
			this._pump();
		});
	}

	/** Call this method to reject all pending requests and terminate the owned Worker. @returns {void} */
	dispose() {
		this._disposed = true;
		this._fail(new Error('Shared-cache Worker is disposed.'));
	}
}
