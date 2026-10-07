/// <reference path="./types.d.ts" />

/** A bounded byte-buffering WritableStream adapter for encoded media output. */
export class BoundedChunkSink {
	/** @type {number} */
	#maximumBatchBytes;
	/** @type {AnimationEvidenceBatchPublisher} */
	#publishBatch;
	/** @type {() => void | Promise<void>} */
	#finalize;
	/** @type {Uint8Array[]} */
	#retained = [];
	#retainedBytes = 0;
	#batchIndex = 0;
	#totalByteLength = 0;
	#maximumBufferedBytes = 0;
	#finalized = false;
	/** @type {WritableStream<Uint8Array>} */
	#writable;

	/**
	 * Creates a bounded encoded-chunk sink with caller-owned batch publication and finalization.
	 * @param {AnimationEvidenceChunkSinkConfiguration} configuration Sink configuration.
	 */
	constructor(configuration) {
		if (!configuration || typeof configuration !== 'object')
			throw new TypeError('Chunk-sink configuration is required.');
		if (!Number.isInteger(configuration.maximumBatchBytes) || configuration.maximumBatchBytes <= 0) {
			throw new TypeError('maximumBatchBytes must be a positive integer.');
		}
		this.#maximumBatchBytes = configuration.maximumBatchBytes;
		this.#publishBatch = configuration.publishBatch;
		this.#finalize = configuration.finalize;
		this.#writable = new WritableStream({
			write: (chunk) => this.#write(chunk),
			close: () => this.#close(),
			abort: () => this.#discard(),
		});
	}

	/**
	 * Call this method to obtain the WritableStream accepted by a streaming container muxer.
	 * @returns {WritableStream<Uint8Array>} Bounded writable stream.
	 */
	writable() {
		return this.#writable;
	}

	/**
	 * Call this method to read immutable transport diagnostics.
	 * @returns {AnimationEvidenceChunkSinkDiagnostics} Current transport diagnostics.
	 */
	diagnostics() {
		return {
			batchCount: this.#batchIndex,
			totalByteLength: this.#totalByteLength,
			maximumBufferedBytes: this.#maximumBufferedBytes,
			finalized: this.#finalized,
		};
	}

	/**
	 * Call this method internally to split and retain one incoming chunk within the configured bound.
	 * @param {Uint8Array} chunk Incoming byte chunk.
	 * @returns {Promise<void>} Completion promise.
	 */
	async #write(chunk) {
		if (!(chunk instanceof Uint8Array)) throw new TypeError('Encoded chunks must be Uint8Array values.');
		if (this.#finalized) throw new Error('Cannot write after chunk-sink finalization.');
		let offset = 0;
		while (offset < chunk.byteLength) {
			const available = this.#maximumBatchBytes - this.#retainedBytes;
			const length = Math.min(available, chunk.byteLength - offset);
			const copy = chunk.subarray(offset, offset + length).slice();
			this.#retained.push(copy);
			this.#retainedBytes += copy.byteLength;
			this.#totalByteLength += copy.byteLength;
			offset += length;
			this.#maximumBufferedBytes = Math.max(this.#maximumBufferedBytes, this.#retainedBytes);
			if (this.#retainedBytes === this.#maximumBatchBytes) await this.#flush();
		}
	}

	/**
	 * Call this method internally to publish the retained byte batch.
	 * @returns {Promise<void>} Completion promise.
	 */
	async #flush() {
		if (this.#retainedBytes === 0) return;
		const bytes = new Uint8Array(this.#retainedBytes);
		let offset = 0;
		for (const chunk of this.#retained) {
			bytes.set(chunk, offset);
			offset += chunk.byteLength;
		}
		this.#retained = [];
		this.#retainedBytes = 0;
		await this.#publishBatch(bytes, this.#batchIndex);
		this.#batchIndex += 1;
	}

	/**
	 * Call this method internally when the WritableStream closes successfully.
	 * @returns {Promise<void>} Completion promise.
	 */
	async #close() {
		if (this.#finalized) return;
		await this.#flush();
		await this.#finalize();
		this.#finalized = true;
	}

	/**
	 * Call this method internally to discard buffered bytes after a stream abort.
	 * @returns {void}
	 */
	#discard() {
		this.#retained = [];
		this.#retainedBytes = 0;
	}
}
