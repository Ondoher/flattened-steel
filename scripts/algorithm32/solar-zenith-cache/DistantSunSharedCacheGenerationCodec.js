import {constants, zstdCompressSync, zstdDecompressSync} from 'node:zlib';

/** Selected reversible byte-lane transform and pinned offline Zstandard encoder. */
export default class DistantSunSharedCacheGenerationCodec {
	/**
	 * Transposes the four byte lanes without interpreting or rounding Float32 values.
	 *
	 * @param {Uint8Array} source - Complete aligned scalar bytes.
	 * @param {boolean} inverse - Whether to restore scalar-major bytes.
	 * @returns {Buffer} - Transposed exact bytes.
	 */
	_transform(source, inverse) {
		const result = Buffer.allocUnsafe(source.byteLength);
		const count = source.byteLength / 4;
		for (let lane = 0; lane < 4; lane += 1)
			for (let scalar = 0; scalar < count; scalar += 1) {
				if (inverse) result[scalar * 4 + lane] = source[lane * count + scalar];
				else result[lane * count + scalar] = source[scalar * 4 + lane];
			}
		return result;
	}

	/**
	 * Call this method to decode a complete frame under an exact output allocation ceiling. Reject malformed framing, incompatible lengths, or decompression failure; the caller must discard the block.
	 *
	 * @param {Uint8Array} encoded - One authenticated encoded block.
	 * @param {number} expectedBytes - Exact decoded byte length.
	 * @returns {Buffer} - Exact restored Float32 bytes.
	 */
	decode(encoded, expectedBytes) {
		if (
			!Number.isInteger(expectedBytes) ||
			expectedBytes < 4 ||
			expectedBytes > 16 * 1024 * 1024 ||
			expectedBytes % 4 !== 0
		)
			throw new Error('Decoded allocation is incompatible.');
		if (
			encoded.byteLength < 4 ||
			new DataView(encoded.buffer, encoded.byteOffset, encoded.byteLength).getUint32(0, true) !== 0xfd2fb528
		)
			throw new Error('Encoded block is not a Zstandard frame.');
		const shuffled = zstdDecompressSync(encoded, {maxOutputLength: expectedBytes});
		if (shuffled.byteLength !== expectedBytes) throw new Error('Decoded block length differs from its identity.');
		return this._transform(shuffled, true);
	}
	/**
	 * Call this method to encode one bounded block and require an exact decode round trip. Reject invalid bounds or a failed round trip; the caller must discard the candidate.
	 *
	 * @param {Uint8Array} decoded - Wavelength-major little-endian Float32 block bytes.
	 * @returns {Buffer} - Complete Zstandard level-6 frame.
	 */
	encode(decoded) {
		if (decoded.byteLength === 0 || decoded.byteLength > 16 * 1024 * 1024 || decoded.byteLength % 4 !== 0)
			throw new Error('Shared block exceeds the codec allocation contract.');
		const shuffled = this._transform(decoded, false);
		const encoded = zstdCompressSync(shuffled, {params: {[constants.ZSTD_c_compressionLevel]: 6}});
		const roundTrip = this.decode(encoded, decoded.byteLength);
		if (!roundTrip.equals(Buffer.from(decoded.buffer, decoded.byteOffset, decoded.byteLength)))
			throw new Error('Shared block failed its exact codec round trip.');
		return encoded;
	}
}
