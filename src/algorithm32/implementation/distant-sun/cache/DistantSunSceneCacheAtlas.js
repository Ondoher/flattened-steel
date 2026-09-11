/** Packs exact receiver-local W27 rows into the production RGBA texture layout. */
export default class DistantSunSceneCacheAtlas {
	/**
	 * @param {Float32Array} values - Channel-major, row-major unique direction values.
	 * @param {Uint16Array} directions - Logical W27 direction to unique direction map.
	 * @param {number} rowCount - Number of retained receiver-local rows.
	 * @param {number} channelCount - Explicit spectral channel count.
	 * @returns {Float32Array} - Layer-major RGBA atlas, including zero padding channels.
	 */
	static pack(values, directions, rowCount, channelCount) {
		if (
			!Number.isInteger(rowCount) ||
			rowCount < 1 ||
			!Number.isInteger(channelCount) ||
			channelCount < 1 ||
			channelCount > 64 ||
			directions.length !== 4374 ||
			values.length !== channelCount * rowCount * 4058 ||
			directions.some((value) => value >= 4058)
		) {
			throw new RangeError('Receiver-local atlas input dimensions are incompatible.');
		}
		const width = Math.ceil(channelCount / 4) * 162;
		const packed = new Float32Array(rowCount * 27 * width * 4);
		for (let channel = 0; channel < channelCount; channel += 1) {
			for (let row = 0; row < rowCount; row += 1) {
				for (let logical = 0; logical < 4374; logical += 1) {
					const value = values[(channel * rowCount + row) * 4058 + directions[logical]];
					if (!Number.isFinite(value) || value < 0)
						throw new RangeError('Receiver-local atlas radiance must be finite and nonnegative.');
					const face = Math.floor(logical / 729);
					const v = Math.floor((logical % 729) / 27);
					const u = logical % 27;
					const x = Math.floor(channel / 4) * 162 + face * 27 + u;
					packed[((row * 27 + v) * width + x) * 4 + (channel % 4)] = value;
				}
			}
		}
		return packed;
	}
}
