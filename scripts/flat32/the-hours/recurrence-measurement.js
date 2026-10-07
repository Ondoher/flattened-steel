/** Fixed early-publication guard, independent of changes in strongest-event ranking. */
export const TheHoursRecurrenceMeasurement = {
	/** Call this method to retain and assess both original early-ground publication neighborhoods.
	 * Missing exact neighboring source frames throw. The original distinct-publication
	 * allowance remains one; every target is assessed even outside the ranked extrema.
	 *
	 * @param {readonly TheHoursPixelFrame[]} pixels - Complete ordered native or decoded source.
	 * @param {readonly TheHoursMeasuredSceneFrame[]} scene - Matching original choreography positions.
	 * @returns {TheHoursRecurrenceProof} - Exact retained target values and recurrence gate.
	 */
	evaluate(pixels, scene) {
		if (pixels.length !== scene.length)
			throw new Error('Early-publication source and physical traces do not align.');
		const publications = [112, 125].map((originalFrameIndex) => {
			const index = scene.findIndex(
				(frame) => Math.abs(frame.animationSeconds * 30 - originalFrameIndex) < 1e-10,
			);
			if (index < 2 || index + 1 >= pixels.length)
				throw new Error('Early-publication guard lacks the exact original neighbors.');
			const events = [index - 1, index].map((center) => {
				const previous = pixels[center - 1].regions.lower.meanLuma,
					value = pixels[center].regions.lower.meanLuma,
					next = pixels[center + 1].regions.lower.meanLuma;
				const incoming = value - previous,
					outgoing = next - value;
				return {
					originalFrameIndex: Math.round(scene[center].animationSeconds * 30),
					previous,
					value,
					next,
					incoming,
					outgoing,
					curvature: Math.abs(outgoing - incoming),
					reversal: incoming * outgoing < 0,
				};
			});
			return {
				originalFrameIndex,
				publishedScene: scene[index].sharedScene ?? scene[index].cacheIdentity,
				previousScene: scene[index - 1].sharedScene ?? scene[index - 1].cacheIdentity,
				events,
				reversal: events.some((event) => event.reversal),
			};
		});
		const reversingPublications = publications
			.filter((publication) => publication.reversal)
			.map((publication) => publication.originalFrameIndex);
		return {
			publications,
			reversingPublications,
			maximumDistinctPublications: 1,
			pass: reversingPublications.length <= 1,
		};
	},
};
