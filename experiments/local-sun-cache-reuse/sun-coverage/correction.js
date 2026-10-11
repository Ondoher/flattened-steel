/** Derive a contained zero-overlap candidate from authenticated original shader text.
 * @param {SunCoverageDiagnosticInput} original - Frozen original producer/consumer and dimensions.
 * @returns {SunCoverageDiagnosticInput} - Experimental shader inputs; never writes production.
 */
export function correctSunCoverage(original) {
	const producerAnchor = 'float sunCircularDiskPixelCoverage(vec2 pixelCenter, float radiusPixels) {',
		consumerAnchor = 'vec2 relativePixelCenter = screenPixelCenter - uSunScreenCenterPixels;';
	if (original.fragment.split(producerAnchor).length !== 2 || original.consumer.split(consumerAnchor).length !== 2)
		throw new Error('Unrecognized original coverage shader.');
	return {
		...original,
		fragment: original.fragment.replace(
			producerAnchor,
			`${producerAnchor}
	// A disjoint pixel square has exact zero area; do not subtract sector areas.
	vec2 nearestOffset = max(abs(pixelCenter) - vec2(0.5), vec2(0.0));
	if (dot(nearestOffset, nearestOffset) >= radiusPixels * radiusPixels) return 0.0;`,
		),
		consumer: original.consumer.replace(
			consumerAnchor,
			`${consumerAnchor}
	// Linear tile filtering must not illuminate a pixel square outside the disc.
	vec2 nearestOffset = max(abs(relativePixelCenter) - vec2(0.5), vec2(0.0));
	if (dot(nearestOffset, nearestOffset) >= uSunRadiusPixels * uSunRadiusPixels) return 0.0;`,
		),
	};
}
