// @ts-expect-error The loopback proof host owns this allowlisted browser URL.
import {ZSTDDecoder} from '/modules/vendor/zstddec.module.js';

let decoder;
const MAXIMUM_DECODED_BLOCK_BYTES = 16 * 1024 * 1024;
const workerPostMessage = /** @type {(message: unknown, transfer: Transferable[]) => void} */ (
	/** @type {unknown} */ (self.postMessage.bind(self))
);

/**
 * Restore the Float32 byte order from the E1 byte-lane arrangement.
 *
 * @param {Uint8Array} source - Shuffled Float32 bytes.
 * @returns {Uint8Array} - Original Float32 byte order.
 */
function inverseShuffle(source) {
	if (source.byteLength % 4 !== 0) throw new TypeError('E2 shuffled block is not Float32-aligned.');
	const output = new Uint8Array(source.byteLength);
	const valueCount = source.byteLength / 4;
	for (let valueIndex = 0; valueIndex < valueCount; valueIndex += 1) {
		const targetOffset = valueIndex * 4;
		for (let lane = 0; lane < 4; lane += 1) output[targetOffset + lane] = source[lane * valueCount + valueIndex];
	}
	return output;
}

/**
 * Decode one bounded E1 block in the persistent Worker.
 * Rejects malformed messages and decode errors; the main-thread owner must reject its transaction.
 *
 * @param {MessageEvent<unknown>} event - Transferred decode request.
 */
self.addEventListener('message', async (event) => {
	const request = event.data;
	try {
		if (!request || typeof request !== 'object' || Array.isArray(request) || JSON.stringify(Object.keys(request).sort()) !== JSON.stringify(['decodedByteLength', 'encoded', 'id', 'requestedAtEpoch'])) {
			throw new TypeError('E2 Worker request shape is invalid.');
		}
		const {id, requestedAtEpoch, encoded, decodedByteLength} = request;
		if (!Number.isSafeInteger(id) || id <= 0 || !Number.isFinite(requestedAtEpoch)) throw new TypeError('E2 Worker request identity is invalid.');
		if (!(encoded instanceof ArrayBuffer) || !Number.isSafeInteger(decodedByteLength) || decodedByteLength <= 0 || decodedByteLength > MAXIMUM_DECODED_BLOCK_BYTES) {
			throw new TypeError('E2 Worker request payload is invalid.');
		}
		const queueMilliseconds = Date.now() - requestedAtEpoch;
		decoder ??= new ZSTDDecoder();
		await decoder.init();
		const decodeStarted = performance.now();
		const shuffled = decoder.decode(new Uint8Array(request.encoded), decodedByteLength);
		const decodeMilliseconds = performance.now() - decodeStarted;
		if (shuffled.byteLength !== decodedByteLength) throw new Error('E2 Zstandard decoded length differs from the bounded block length.');
		const inverseStarted = performance.now();
		const decoded = inverseShuffle(shuffled);
		const inverseShuffleMilliseconds = performance.now() - inverseStarted;
		workerPostMessage(
			{
				id,
				decoded: decoded.buffer,
				queueMilliseconds,
				decodeMilliseconds,
				inverseShuffleMilliseconds,
				workerHeapBytes: Number.isSafeInteger(performance.memory?.usedJSHeapSize) ? performance.memory.usedJSHeapSize : null,
			},
			[decoded.buffer],
		);
	} catch (error) {
		self.postMessage({
			id: request && typeof request === 'object' && Number.isSafeInteger(request.id) ? request.id : -1,
			error: {name: error?.name ?? typeof error, message: error?.message ?? String(error)},
		});
	}
});
