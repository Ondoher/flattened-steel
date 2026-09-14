/** Dedicated horizon gate for broad color-response excursions missed by cache-peak ranking. */
export class StrobingHorizonMeasurement {
	/** Measure the largest wrong-direction brightness excursion, independent of cache events.
	 * @param {StrobingPixelFrame[]} pixels @param {StrobingMeasuredSceneFrame[]} scene
	 * @returns {StrobingHorizonResult} */
	static evaluate(pixels, scene) {
		if (pixels.length !== scene.length || pixels.some((frame, index) => frame.frameIndex !== index))
			throw new Error('Horizon pixels must match every ordered scene frame.');
		const windows = [];
		/** @type {readonly [string, number, number, number][]} */
		const intervals = [
			['sunrise', 10, 14, 1],
			['sunset', 46, 50, -1],
		];
		for (const [name, lower, upper, sign] of intervals) {
			const crossing = scene.filter((frame) => frame.animationSeconds >= lower && frame.animationSeconds < upper);
			const indices = scene
				.map((frame, index) => ({frame, index}))
				.filter(
					({frame}) =>
						frame.animationSeconds >= lower &&
						frame.animationSeconds < upper &&
						frame.solarZenithDegrees >= 89.5 &&
						frame.solarZenithDegrees <= 91.5,
				)
				.map(({index}) => index);
			if (indices.length === 0) continue;
			if (
				indices.length < 30 ||
				!crossing.some((frame) => frame.solarZenithDegrees < 89.5) ||
				!crossing.some((frame) => frame.solarZenithDegrees > 91.5)
			)
				throw new Error('Horizon gate needs the complete 89.5-91.5 degree interval.');
			/** @type {StrobingHorizonResult['windows'][number]['regions']} */
			const regions = {};
			for (const region of ['upper', 'horizon', 'lower', 'full']) {
				let best = -Infinity,
					excursion = 0,
					maximumOpposingStep = 0;
				let previous;
				for (const index of indices) {
					const value = sign * pixels[index].regions[region].meanLuma;
					if (!Number.isFinite(value)) throw new Error('Horizon luminance must be finite.');
					best = Math.max(best, value);
					excursion = Math.max(excursion, best - value);
					if (previous !== undefined) maximumOpposingStep = Math.max(maximumOpposingStep, previous - value);
					previous = value;
				}
				regions[region] = {excursion, maximumOpposingStep};
			}
			windows.push({name, frameCount: indices.length, regions, pass: regions.upper.excursion <= 1});
		}
		if (!windows.length) throw new Error('No qualifying horizon interval.');
		return {pass: windows.every((window) => window.pass), maximumUpperExcursion: 1, windows};
	}
}
