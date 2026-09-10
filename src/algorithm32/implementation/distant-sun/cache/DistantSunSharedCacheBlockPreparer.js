import DistantSunSharedCacheDecoder from './DistantSunSharedCacheDecoder.js';
import DistantSunSharedCachePacketLayout from './DistantSunSharedCachePacketLayout.js';
import {
	DISTANT_SUN_SHARED_CACHE_LOGICAL_DIRECTION_COUNT,
	DISTANT_SUN_SHARED_CACHE_MAXIMUM_ENCODED_BYTES,
	DISTANT_SUN_SHARED_CACHE_ROW_BYTE_LENGTH,
	DISTANT_SUN_SHARED_CACHE_SHUFFLE_ID,
} from './consts.js';

/** Worker-owned authentication, inverse shuffle, and exact spectral packet preparation. */
export default class DistantSunSharedCacheBlockPreparer {
	/** Persistent bounded decoder. */
	_decoder = new DistantSunSharedCacheDecoder();
	/** Executable canonical packet mapping. */
	_layout = new DistantSunSharedCachePacketLayout();

	/**
	 * Called to authenticate exact artifact bytes.
	 *
	 * @param {Uint8Array} bytes - Complete artifact
	 *
	 * @param {string} expected - Lowercase SHA-256 identity.
	 * @returns {Promise<void>}
	 */
	async _authenticate(bytes, expected) {
		if (!/^[a-f0-9]{64}$/.test(expected)) throw new TypeError('Shared-cache hash identity is malformed.');
		const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', /** @type {ArrayBuffer} */ (bytes.buffer)));
		const actual = Array.from(digest, (value) => value.toString(16).padStart(2, '0')).join('');
		if (actual !== expected) throw new Error('Shared-cache artifact authentication failed.');
	}

	/**
	 * Call this method to authenticate and expand one transferred encoded block.
	 * Malformed input, corrupt identities, incompatible spectra, or cancellation reject without returning a packet.
	 *
	 * @param {DistantSunSharedCachePreparationRequest} request - Independently identified bytes and canonical direction map
	 *
	 * @param {AbortSignal} signal - Preparation cancellation.
	 * @returns {Promise<DistantSunSharedCachePreparationResult>} - Packet and bounded stage timings.
	 */
	async prepare(request, signal) {
		signal.throwIfAborted();
		const {block, encoded, logicalToUniqueIndex, logicalToUniqueIndexSha256} = request;
		if (
			!(encoded instanceof ArrayBuffer) ||
			!(logicalToUniqueIndex instanceof Uint16Array) ||
			logicalToUniqueIndex.byteOffset !== 0 ||
			logicalToUniqueIndex.byteLength !== logicalToUniqueIndex.buffer.byteLength ||
			logicalToUniqueIndex.length !== DISTANT_SUN_SHARED_CACHE_LOGICAL_DIRECTION_COUNT ||
			!block ||
			typeof block.id !== 'string' ||
			!block.id ||
			!Number.isInteger(block.rowCount) ||
			block.rowCount < 1 ||
			block.rowCount > 64 ||
			block.decoded?.byteLength !== block.rowCount * DISTANT_SUN_SHARED_CACHE_ROW_BYTE_LENGTH ||
			block.encoded?.byteLength !== encoded.byteLength ||
			encoded.byteLength > DISTANT_SUN_SHARED_CACHE_MAXIMUM_ENCODED_BYTES ||
			block.shuffle !== DISTANT_SUN_SHARED_CACHE_SHUFFLE_ID
		)
			throw new TypeError('Shared-cache preparation request is incompatible.');
		const started = performance.now();
		const encodedBytes = new Uint8Array(encoded);
		await this._authenticate(encodedBytes, block.encoded.sha256);
		await this._authenticate(new Uint8Array(logicalToUniqueIndex.buffer), logicalToUniqueIndexSha256);
		signal.throwIfAborted();
		const authenticated = performance.now();
		const shuffled = await this._decoder.decode(encodedBytes, block.decoded.byteLength, signal);
		const decodedAt = performance.now();
		const decoded = new Uint8Array(shuffled.byteLength);
		const valueCount = decoded.byteLength / 4;
		for (let valueIndex = 0; valueIndex < valueCount; valueIndex += 1) {
			for (let lane = 0; lane < 4; lane += 1)
				decoded[valueIndex * 4 + lane] = shuffled[lane * valueCount + valueIndex];
		}
		await this._authenticate(decoded, block.decoded.sha256);
		signal.throwIfAborted();
		const values = new Float32Array(decoded.buffer);
		for (const value of values)
			if (!Number.isFinite(value) || value < 0)
				throw new RangeError('Shared-cache spectra must be finite and nonnegative.');
		const packetStarted = performance.now();
		const packet = this._layout.pack({
			logicalBlockId: block.id,
			decodedSha256: block.decoded.sha256,
			logicalToUniqueIndexSha256,
			blockRowCount: block.rowCount,
			decodedValues: values,
			logicalToUniqueIndex,
		});
		signal.throwIfAborted();
		return {
			packet,
			timings: {
				authenticationMilliseconds: authenticated - started,
				decodeMilliseconds: decodedAt - authenticated,
				inverseAndValidationMilliseconds: packetStarted - decodedAt,
				packetMilliseconds: performance.now() - packetStarted,
				decoder: this._decoder.kind,
			},
		};
	}
}
