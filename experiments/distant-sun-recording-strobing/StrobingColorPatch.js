/** Contained color-response ablations applied only to the frozen browser bundle. */
export class StrobingColorPatch {
	/** @param {string} source @param {StrobingColorResponse} response
	 * @returns {StrobingColorPatchResult} */
	static apply(source, response) {
		if (response === 'original-p9') return {source, description: 'Unchanged production Color Reset p9.'};
		const changes =
			response === 'monotone-p2'
				? [['sunsetRolloffPower: 9,', 'sunsetRolloffPower: 2,']]
				: response === 'no-sunset-boost'
					? [['sunsetAmplitude: 3.5,', 'sunsetAmplitude: 0,']]
					: [];
		if (changes.length !== 1) throw new Error('Unknown contained color response.');
		for (const [before, after] of changes) {
			if (source.split(before).length !== 2) throw new Error('Color-response anchor must occur exactly once.');
			source = source.replace(before, after);
		}
		return {
			source,
			description: JSON.stringify({
				response,
				changes,
				scope: 'Shared CPU and generated GLSL color constants; no temporal filtering.',
			}),
		};
	}
}
