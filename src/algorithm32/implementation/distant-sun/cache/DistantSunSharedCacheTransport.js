import DistantSunSharedCacheRetention from './DistantSunSharedCacheRetention.js';
import {
	DISTANT_SUN_SHARED_CACHE_MAXIMUM_ENCODED_BYTES,
	DISTANT_SUN_SHARED_CACHE_PIN_BYTES,
	DISTANT_SUN_SHARED_CACHE_REQUEST_LIMIT,
} from './consts.js';

/** Process-wide complete-artifact scheduler, subscriber accounting, and packet retention owner. */
export default class DistantSunSharedCacheTransport {
	/** Single process-wide transport owner.
	 *
	 * @type {DistantSunSharedCacheTransport | undefined}
	 */
	static current;
	/** Persistent asynchronous packet preparation capability.
	 *
	 * @type {DistantSunSharedCachePreparationClient}
	 */
	_preparer;
	/** Complete-file network capability.
	 *
	 * @type {typeof fetch}
	 */
	_fetch;
	/** Bounded retained packet owner.
	 *
	 * @type {DistantSunSharedCacheRetention}
	 */
	_retention;
	/** Encoded-artifact coalescing map.
	 *
	 * @type {Map<string, DistantSunSharedCacheTransportJob>}
	 */
	_inflight = new Map();
	/** Queued complete-artifact preparations.
	 *
	 * @type {DistantSunSharedCacheTransportJob[]}
	 */
	_queue = [];
	/** Number of active network-to-packet jobs. */
	_active = 0;
	/** Terminal owner disposal state. */
	_disposed = false;
	/** Aggregate bounded counters and last-stage timings. */
	_counters = {
		requests: 0,
		coalesced: 0,
		reused: 0,
		completed: 0,
		canceled: 0,
		failed: 0,
		peakActive: 0,
		lastQueueMilliseconds: 0,
		lastFetchMilliseconds: 0,
	};
	/** Last complete preparation timings without per-request history.
	 *
	 * @type {DistantSunSharedCachePreparationTimings | undefined}
	 */
	_lastPreparation;

	/**
	 * Creates the sole process-wide transport. A second live owner is rejected; callers reuse current
	 *
	 * @param {DistantSunSharedCacheTransportDefinition} definition - Preparation/network capabilities and pin budget.
	 */
	constructor(definition) {
		if (DistantSunSharedCacheTransport.current)
			throw new Error('Reuse the live process-wide shared-cache transport.');
		if (!definition.preparer?.prepare || !definition.preparer?.dispose)
			throw new TypeError('Shared-cache preparation capability is required.');
		this._retention = new DistantSunSharedCacheRetention(
			definition.maximumPinnedBytes ?? DISTANT_SUN_SHARED_CACHE_PIN_BYTES,
		);
		this._preparer = definition.preparer;
		this._fetch = definition.fetch ?? globalThis.fetch.bind(globalThis);
		DistantSunSharedCacheTransport.current = this;
	}

	/**
	 * Called to read one complete immutable file into its exact declared allocation
	 *
	 * @param {DistantSunSharedCacheTransportJob} job - Subscriber-accounted artifact job.
	 * @returns {Promise<ArrayBuffer>} - Complete bounded encoded file.
	 */
	async _read(job) {
		const response = await this._fetch(job.request.url, {
			signal: job.cancellation.signal,
			redirect: 'error',
			credentials: 'same-origin',
		});
		if (!response.ok || !response.body)
			throw new Error(`Shared-cache artifact request failed (${response.status}).`);
		const expectedBytes = job.request.block.encoded.byteLength;
		const declaredLength = response.headers.get('content-length');
		if (declaredLength !== null && Number(declaredLength) !== expectedBytes) {
			await response.body.cancel();
			throw new RangeError('Shared-cache encoded response length is incompatible.');
		}
		const bytes = new Uint8Array(expectedBytes);
		const reader = response.body.getReader();
		try {
			let offset = 0;
			while (true) {
				const {done, value} = await reader.read();
				job.cancellation.signal.throwIfAborted();
				if (done) break;
				if (offset + value.byteLength > expectedBytes)
					throw new RangeError('Shared-cache encoded response exceeds its bound.');
				bytes.set(value, offset);
				offset += value.byteLength;
			}
			if (offset !== expectedBytes) throw new RangeError('Shared-cache encoded response is truncated.');
			return bytes.buffer;
		} finally {
			await reader.cancel().catch(() => {});
			reader.releaseLock();
		}
	}

	/**
	 * Called to expose a borrowed packet under an independently releasable pin
	 *
	 * @param {string} key - Encoded artifact identity
	 *
	 * @param {symbol} token - Reserved pin token
	 *
	 * @param {string} logicalBlockId - Request-owned logical block identity.
	 * @returns {DistantSunSharedCachePacketLease} - Pin-owning packet lease.
	 */
	_lease(key, token, logicalBlockId) {
		let released = false;
		return {
			packet: {...this._retention.get(key), logicalBlockId},
			repin: (pin) => {
				if (released || this._disposed) throw new Error('Shared-cache lease is no longer live.');
				this._retention.repin(key, token, pin);
			},
			release: () => {
				if (!released) {
					released = true;
					this._retention.release(key, token);
				}
			},
		};
	}

	/**
	 * Called to execute one complete preparation while preserving all subscriber boundaries
	 *
	 * @param {DistantSunSharedCacheTransportJob} job - Active coalesced job.
	 * @returns {Promise<void>}
	 */
	async _run(job) {
		this._counters.lastQueueMilliseconds = performance.now() - job.queuedAt;
		try {
			const started = performance.now();
			const encoded = await this._read(job);
			this._counters.lastFetchMilliseconds = performance.now() - started;
			job.cancellation.signal.throwIfAborted();
			const result = await this._preparer.prepare(
				{
					encoded,
					block: job.request.block,
					logicalToUniqueIndex: new Uint16Array(job.request.logicalToUniqueIndex),
					logicalToUniqueIndexSha256: job.request.logicalToUniqueIndexSha256,
				},
				job.cancellation.signal,
			);
			job.cancellation.signal.throwIfAborted();
			this._retention.publish(job.key, result.packet);
			this._lastPreparation = result.timings;
			this._counters.completed += 1;
			for (const subscriber of job.subscribers) {
				subscriber.signal.removeEventListener('abort', subscriber.cancel);
				subscriber.resolve(this._lease(job.key, subscriber.token, subscriber.logicalBlockId));
			}
		} catch (error) {
			if (!job.cancellation.signal.aborted) this._counters.failed += 1;
			for (const subscriber of job.subscribers) {
				subscriber.signal.removeEventListener('abort', subscriber.cancel);
				this._retention.release(job.key, subscriber.token);
				subscriber.reject(error);
			}
		} finally {
			job.subscribers.clear();
			if (this._inflight.get(job.key) === job) this._inflight.delete(job.key);
			this._active -= 1;
			this._pump();
		}
	}

	/** Called to admit no more than four complete artifact jobs at once. @returns {void} */
	_pump() {
		while (!this._disposed && this._active < DISTANT_SUN_SHARED_CACHE_REQUEST_LIMIT && this._queue.length) {
			const job = this._queue.shift();
			if (!job.subscribers.size) continue;
			this._active += 1;
			this._counters.peakActive = Math.max(this._active, this._counters.peakActive);
			void this._run(job);
		}
	}

	/**
	 * Call this method to subscribe to one authenticated packet under an explicit pin.
	 * Invalid input, exhausted admission, cancellation, or failed authentication reject. A canceled subscriber
	 * does not cancel another subscriber; the final cancellation aborts underlying work and prevents stale delivery
	 *
	 * @param {DistantSunSharedCacheBlockRequest} request - Complete artifact identity, layout, cancellation, and pin owner.
	 * @returns {Promise<DistantSunSharedCachePacketLease>} - Complete pinned packet with borrowed array ownership.
	 */
	async request(request) {
		if (this._disposed) throw new Error('Shared-cache transport is disposed.');
		request.signal.throwIfAborted();
		const url = new URL(request.url);
		const block = request.block;
		if (
			!['https:', 'http:'].includes(url.protocol) ||
			(globalThis.location && url.origin !== globalThis.location.origin) ||
			url.username ||
			url.password ||
			url.hash ||
			!block ||
			!/^[a-f0-9]{64}$/.test(block.encoded?.sha256) ||
			!Number.isSafeInteger(block.encoded.byteLength) ||
			block.encoded.byteLength < 8 ||
			block.encoded.byteLength > DISTANT_SUN_SHARED_CACHE_MAXIMUM_ENCODED_BYTES ||
			!(request.logicalToUniqueIndex instanceof Uint16Array)
		)
			throw new TypeError('Shared-cache artifact request is invalid.');
		const key = block.encoded.sha256;
		const signature = `${block.decoded.sha256}:${block.rowCount}:${block.decoded.byteLength}:${block.encoded.byteLength}:${request.logicalToUniqueIndexSha256}`;
		const token = this._retention.reserve(key, request.pin, signature);
		this._counters.requests += 1;
		if (this._retention.get(key)) {
			this._counters.reused += 1;
			return this._lease(key, token, block.id);
		}
		let job = this._inflight.get(key);
		if (job) this._counters.coalesced += 1;
		else {
			job = {
				key,
				request: {
					...request,
					block: structuredClone(block),
					logicalToUniqueIndex: new Uint16Array(request.logicalToUniqueIndex),
				},
				cancellation: new AbortController(),
				subscribers: new Set(),
				queuedAt: performance.now(),
			};
			this._inflight.set(key, job);
			this._queue.push(job);
		}
		return new Promise((resolve, reject) => {
			const subscriber = {
				signal: request.signal,
				logicalBlockId: block.id,
				token,
				resolve,
				reject,
				cancel: () => {
					request.signal.removeEventListener('abort', subscriber.cancel);
					job.subscribers.delete(subscriber);
					this._retention.release(key, token);
					this._counters.canceled += 1;
					reject(request.signal.reason);
					if (!job.subscribers.size) {
						job.cancellation.abort();
						if (this._inflight.get(key) === job) this._inflight.delete(key);
						this._queue = this._queue.filter((queued) => queued !== job);
					}
				},
			};
			request.signal.addEventListener('abort', subscriber.cancel, {once: true});
			job.subscribers.add(subscriber);
			this._pump();
		});
	}

	/** Call this method to inspect bounded counters, last-stage timings, queueing, and pins. @returns {DistantSunSharedCacheTransportDiagnostics} - Aggregate diagnostics. */
	diagnostics() {
		return {
			...this._counters,
			active: this._active,
			queued: this._queue.length,
			inflight: this._inflight.size,
			lastPreparation: this._lastPreparation && {...this._lastPreparation},
			retention: this._retention.diagnostics(),
		};
	}

	/** Call this method to reject subscriptions, release pins, and terminate the owned Worker. @returns {void} */
	dispose() {
		if (this._disposed) return;
		this._disposed = true;
		for (const job of this._inflight.values()) {
			job.cancellation.abort();
			for (const subscriber of job.subscribers) {
				subscriber.signal.removeEventListener('abort', subscriber.cancel);
				subscriber.reject(new Error('Shared-cache transport is disposed.'));
			}
			job.subscribers.clear();
		}
		this._queue = [];
		this._inflight.clear();
		this._retention.dispose();
		this._preparer.dispose();
		if (DistantSunSharedCacheTransport.current === this) DistantSunSharedCacheTransport.current = undefined;
	}
}
