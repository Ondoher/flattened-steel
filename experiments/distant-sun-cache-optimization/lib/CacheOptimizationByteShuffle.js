/** Reversible byte-lane transform for little-endian Float32 payload bytes. */
export default class CacheOptimizationByteShuffle {
	/**
	 * Call this method to group equal-position bytes from each four-byte value into four lanes.
	 * Rejects non-byte and non-Float32-aligned input; callers must correct the input rather than continuing.
	 *
	 * @param {Uint8Array} source - Float32-aligned source bytes.
	 * @returns {Buffer} - Shuffled bytes.
	 */
	static shuffle(source) {
		if (!(source instanceof Uint8Array) || source.byteLength % 4 !== 0) {
			throw new TypeError('Byte shuffle source must be Float32-aligned bytes.');
		}
		const output = Buffer.allocUnsafe(source.byteLength);
		const valueCount = source.byteLength / 4;
		for (let valueIndex = 0; valueIndex < valueCount; valueIndex += 1) {
			const sourceOffset = valueIndex * 4;
			for (let lane = 0; lane < 4; lane += 1) output[lane * valueCount + valueIndex] = source[sourceOffset + lane];
		}
		return output;
	}

	/**
	 * Call this method to restore interleaved four-byte values from byte lanes.
	 * Rejects non-byte and non-Float32-aligned input; callers must reject the encoded artifact.
	 *
	 * @param {Uint8Array} source - Shuffled Float32-aligned bytes.
	 * @returns {Buffer} - Original byte order.
	 */
	static inverse(source) {
		if (!(source instanceof Uint8Array) || source.byteLength % 4 !== 0) {
			throw new TypeError('Inverse byte shuffle source must be Float32-aligned bytes.');
		}
		const output = Buffer.allocUnsafe(source.byteLength);
		const valueCount = source.byteLength / 4;
		for (let valueIndex = 0; valueIndex < valueCount; valueIndex += 1) {
			const targetOffset = valueIndex * 4;
			for (let lane = 0; lane < 4; lane += 1) output[targetOffset + lane] = source[lane * valueCount + valueIndex];
		}
		return output;
	}
}
