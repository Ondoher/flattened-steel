import {ZSTDDecoder} from 'three/examples/jsm/libs/zstddec.module.js';
import {
	DISTANT_SUN_SHARED_CACHE_MAXIMUM_DECODED_BLOCK_BYTES,
	DISTANT_SUN_SHARED_CACHE_MAXIMUM_ENCODED_BYTES,
} from './consts.js';

/** Bounded single-frame Zstandard decoder with native detection and a persistent WASM fallback. */
export default class DistantSunSharedCacheDecoder {
	/** Decoder-only fallback instance retained across serialized requests. */
	_fallback = new ZSTDDecoder();
	/** Memoized fallback initialization.
	 *
	 * @type {Promise<void> | undefined}
	 */
	_initialization;
	/** Most recently selected decoder implementation.
	 *
	 * @type {DistantSunSharedCacheDecoderKind}
	 */
	kind = 'wasm';

	/**
	 * Called before decoding to reject unsupported frames and excessive decoder windows.
	 * Frame parsing follows the Zstandard format's header and block lengths; no entropy decoding occurs here.
	 *
	 * @param {Uint8Array} encoded - Complete frame
	 *
	 * @param {number} expectedBytes - Authenticated output size.
	 * @returns {void}
	 */
	_requireFrame(encoded, expectedBytes) {
		if (
			!(encoded instanceof Uint8Array) ||
			encoded.byteLength < 8 ||
			encoded.byteLength > DISTANT_SUN_SHARED_CACHE_MAXIMUM_ENCODED_BYTES ||
			!Number.isSafeInteger(expectedBytes) ||
			expectedBytes < 4 ||
			expectedBytes % 4 ||
			expectedBytes > DISTANT_SUN_SHARED_CACHE_MAXIMUM_DECODED_BLOCK_BYTES
		) {
			throw new RangeError('Shared-cache compressed frame or decoded bound is invalid.');
		}
		const view = new DataView(encoded.buffer, encoded.byteOffset, encoded.byteLength);
		if (view.getUint32(0, true) !== 0xfd2fb528) throw new RangeError('Shared-cache Zstandard magic is invalid.');
		const descriptor = encoded[4];
		if (descriptor & 0x1b)
			throw new RangeError('Shared-cache Zstandard dictionaries or reserved flags are unsupported.');
		const singleSegment = Boolean(descriptor & 0x20);
		let offset = 5;
		if (!singleSegment) {
			const windowDescriptor = encoded[offset++];
			const windowBase = 2 ** (10 + (windowDescriptor >> 3));
			const windowBytes = windowBase + (windowBase / 8) * (windowDescriptor & 7);
			if (windowBytes > DISTANT_SUN_SHARED_CACHE_MAXIMUM_DECODED_BLOCK_BYTES)
				throw new RangeError('Shared-cache Zstandard window exceeds its bound.');
		}
		const sizeFlag = descriptor >> 6;
		const sizeBytes = sizeFlag === 0 ? Number(singleSegment) : 2 ** sizeFlag;
		if (offset + sizeBytes > encoded.byteLength)
			throw new RangeError('Shared-cache Zstandard header is truncated.');
		if (sizeBytes) {
			let contentBytes = 0n;
			for (let byteIndex = 0; byteIndex < sizeBytes; byteIndex += 1)
				contentBytes |= BigInt(encoded[offset++]) << BigInt(byteIndex * 8);
			if (sizeBytes === 2) contentBytes += 256n;
			if (contentBytes !== BigInt(expectedBytes))
				throw new RangeError('Shared-cache Zstandard content size is incompatible.');
		}
		let lastBlock = false;
		while (!lastBlock) {
			if (offset + 3 > encoded.byteLength)
				throw new RangeError('Shared-cache Zstandard block header is truncated.');
			const header = encoded[offset] | (encoded[offset + 1] << 8) | (encoded[offset + 2] << 16);
			offset += 3;
			lastBlock = Boolean(header & 1);
			const blockType = (header >> 1) & 3;
			const blockBytes = header >> 3;
			if (blockType === 3 || blockBytes > 131072)
				throw new RangeError('Shared-cache Zstandard block is invalid.');
			offset += blockType === 1 ? 1 : blockBytes;
			if (offset > encoded.byteLength) throw new RangeError('Shared-cache Zstandard block is truncated.');
		}
		if (descriptor & 4) offset += 4;
		if (offset !== encoded.byteLength)
			throw new RangeError('Shared-cache Zstandard frame has trailing or missing bytes.');
	}

	/**
	 * Called to detect actual native construction support without assuming a browser version.
	 *
	 * @returns {TransformStream<Uint8Array, Uint8Array> | undefined} - Native decoder, when supported.
	 */
	_nativeStream() {
		try {
			const NativeStream = /** @type {DistantSunSharedCacheNativeStreamConstructor} */ (
				/** @type {unknown} */ (globalThis.DecompressionStream)
			);
			return new NativeStream('zstd');
		} catch {
			return undefined;
		}
	}

	/**
	 * Call this method to decode one bounded frame. Invalid data, cancellation, or unavailable decoders reject.
	 * Callers serialize requests and authenticate the returned unshuffled bytes before publication.
	 *
	 * @param {Uint8Array} encoded - Complete authenticated Zstandard frame
	 *
	 * @param {number} expectedBytes - Exact shuffled output byte count
	 *
	 * @param {AbortSignal} signal - Request cancellation.
	 * @returns {Promise<Uint8Array>} - Exact shuffled Float32 byte lanes.
	 */
	async decode(encoded, expectedBytes, signal) {
		signal.throwIfAborted();
		this._requireFrame(encoded, expectedBytes);
		const native = this._nativeStream();
		if (!native) {
			this.kind = 'wasm';
			this._initialization ??= this._fallback.init();
			await this._initialization;
			signal.throwIfAborted();
			const decoded = this._fallback.decode(encoded, expectedBytes);
			if (decoded.byteLength !== expectedBytes)
				throw new RangeError('Shared-cache WASM decoded length is incompatible.');
			return decoded;
		}
		this.kind = 'native';
		const reader = new Blob([new Uint8Array(encoded)]).stream().pipeThrough(native).getReader();
		const cancel = () => {
			void reader.cancel(signal.reason).catch(() => {});
		};
		signal.addEventListener('abort', cancel, {once: true});
		try {
			const output = new Uint8Array(expectedBytes);
			let offset = 0;
			while (true) {
				const {done, value} = await reader.read();
				signal.throwIfAborted();
				if (done) break;
				if (offset + value.byteLength > expectedBytes)
					throw new RangeError('Shared-cache native output exceeds its bound.');
				output.set(value, offset);
				offset += value.byteLength;
			}
			if (offset !== expectedBytes) throw new RangeError('Shared-cache native decoded length is incompatible.');
			return output;
		} finally {
			signal.removeEventListener('abort', cancel);
			await reader.cancel().catch(() => {});
			reader.releaseLock();
		}
	}
}
