/** Pinned source/encoded temporal detector, preserving publication attribution and the 1.5 curvature threshold. */
export const TheHoursTemporalMeasurement = {
	/**
	 * Call this method to evaluate all four regions against distinct physical cache publications.
	 * Missing stable intervals or unaligned traces throw; callers must retain the rejected proof.
	 *
	 * @param {readonly TheHoursPixelFrame[]} pixels - Ordered source or decoded measurements.
	 * @param {readonly TheHoursMeasuredSceneFrame[]} scene - Matching physical publication trace.
	 * @returns {TheHoursTemporalResult} - Complete regional detector result with raw strongest extrema.
	 */
	evaluate(pixels, scene) {
		if (pixels.length !== scene.length) throw new Error('Scene and pixel traces do not align.');
		const boundaries = scene.flatMap((frame, index) =>
			index > 0 &&
			(frame.sharedScene ?? frame.cacheIdentity) !==
				(scene[index - 1].sharedScene ?? scene[index - 1].cacheIdentity)
				? [index]
				: [],
		);
		/** @type {TheHoursTemporalResult} */ const result = {boundaries, regions: {}, pass: true};
		for (const name of ['full', 'upper', 'horizon', 'lower']) {
			const events = pixels.slice(1, -1).map((frame, offset) => {
				const index = offset + 1;
				const incoming = frame.regions[name].meanLuma - pixels[index - 1].regions[name].meanLuma;
				const outgoing = pixels[index + 1].regions[name].meanLuma - frame.regions[name].meanLuma;
				return {
					index,
					luma: frame.regions[name].meanLuma,
					incoming,
					outgoing,
					reversal: incoming * outgoing < 0,
					curvature: Math.abs(outgoing - incoming),
					cacheAdjacent: boundaries.includes(index) || boundaries.includes(index + 1),
					rgbCurvature: pixels[index + 1].regions[name].previousFrameRgbCurvature,
				};
			});
			const adjacent = events.filter((event) => event.cacheAdjacent),
				stable = events.filter((event) => !event.cacheAdjacent);
			if (!adjacent.length || !stable.length)
				throw new Error('Control lacks cache boundaries or stable intervals.');
			const boundaryMean = adjacent.reduce((sum, event) => sum + event.curvature, 0) / adjacent.length;
			const stableMean = stable.reduce((sum, event) => sum + event.curvature, 0) / stable.length;
			const ratio = stableMean === 0 ? (boundaryMean === 0 ? 1 : Number.MAX_VALUE) : boundaryMean / stableMean;
			const strongest = [...events]
				.sort((a, b) => b.curvature - a.curvature)
				.slice(0, Math.min(40, Math.ceil(events.length / 10)));
			const reversingBoundaryPeaks = strongest.filter((event) => event.cacheAdjacent && event.reversal).length;
			// One publication can produce extrema on both sides of a single pulse.
			// Recurrence counts distinct physical publications, retaining every raw extremum.
			const reversingPublications = [
				...new Set(
					strongest
						.filter((event) => event.cacheAdjacent && event.reversal)
						.flatMap((event) =>
							boundaries.filter((boundary) => boundary === event.index || boundary === event.index + 1),
						),
				),
			];
			result.regions[name] = {
				boundaryMean,
				stableMean,
				ratio,
				strongest,
				reversingBoundaryPeaks,
				reversingPublications,
				boundaryFraction: adjacent.length / events.length,
				pass: ratio <= 1.5 && reversingPublications.length <= 1,
			};
			result.pass &&= result.regions[name].pass;
		}
		return result;
	},
};
