import DistantSunSharedCacheBlockPreparer from './DistantSunSharedCacheBlockPreparer.js';

/** Serialized module-Worker endpoint with transferable packet ownership. */
class DistantSunSharedCacheWorker {
	/** Persistent preparation owner. */
	_preparer = new DistantSunSharedCacheBlockPreparer();
	/** Active request cancellation.
	 *
	 * @type {AbortController | undefined}
	 */
	_cancellation;
	/** Active monotonically increasing request identity. */
	_requestId = 0;

	/**
	 * Called to return one response through the Worker transport.
	 *
	 * @param {DistantSunSharedCacheWorkerResponse} response - Terminal result
	 *
	 * @param {Transferable[]} transfer - Exclusively owned output buffers.
	 * @returns {void}
	 */
	_reply(response, transfer = []) {
		const post = /** @type {(value: unknown, transfer: Transferable[]) => void} */ (self.postMessage.bind(self));
		post(response, transfer);
	}

	/**
	 * Call this method to consume a serialized preparation or cancellation message.
	 * Invalid messages and failed preparation produce terminal errors; no partial packet is transferred.
	 *
	 * @param {MessageEvent<DistantSunSharedCacheWorkerMessage>} event - Worker message.
	 * @returns {Promise<void>}
	 */
	async receive(event) {
		const message = event.data;
		if (!message || !Number.isSafeInteger(message.requestId) || message.requestId < 1) return;
		if (message.kind === 'cancel') {
			if (message.requestId === this._requestId) this._cancellation?.abort();
			return;
		}
		if (message.kind !== 'prepare' || this._cancellation) {
			this._reply({
				requestId: message.requestId,
				error: 'Shared-cache Worker received an invalid concurrent request.',
			});
			return;
		}
		this._requestId = message.requestId;
		const cancellation = new AbortController();
		this._cancellation = cancellation;
		try {
			const result = await this._preparer.prepare(message.request, cancellation.signal);
			cancellation.signal.throwIfAborted();
			this._reply({requestId: message.requestId, result}, [result.packet.values.buffer]);
		} catch (error) {
			this._reply({
				requestId: message.requestId,
				error: error instanceof Error ? error.message : 'Shared-cache preparation failed.',
			});
		} finally {
			this._cancellation = undefined;
		}
	}
}

const endpoint = new DistantSunSharedCacheWorker();
self.addEventListener('message', (event) => {
	void endpoint.receive(event);
});
