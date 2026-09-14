/** Shape-preserving Hermite interpolation on the uniform solar-angle domain.
 * Interior tangents use the harmonic mean of adjacent secants. The normalized
 * Hermite basis is H00=2t^3-3t^2+1, H10=t^3-2t^2+t, H01=-2t^3+3t^2,
 * H11=t^3-t^2; slopes are expressed per solar-grid interval.
 */
export const DistantSunSolarInterpolation = {
	/** Compute a shared interior tangent without multiplying small spectral secants.
	 * @param {number} before - Previous interval difference, in the sampled quantity's units.
	 * @param {number} after - Next interval difference in the same units.
	 * @returns {number} - Harmonic tangent, or zero at an extremum.
	 */
	slope(before, after) {
		if (before === 0 || after === 0 || Math.sign(before) !== Math.sign(after)) return 0;
		const smaller = Math.min(Math.abs(before), Math.abs(after));
		const larger = Math.max(Math.abs(before), Math.abs(after));
		return Math.sign(before) * ((2 * smaller) / (1 + smaller / larger));
	},

	/** Evaluate an accepted four-sample stencil, preserving exact endpoint values.
	 * Undefined outer samples are allowed only at caller-established physical endpoints.
	 * @param {number | undefined} previous - Sample before the interval, or physical lower endpoint.
	 * @param {number} lower - Lower endpoint sample.
	 * @param {number} upper - Upper endpoint sample.
	 * @param {number | undefined} next - Sample after the interval, or physical upper endpoint.
	 * @param {number} fraction - Accepted normalized interval coordinate in [0,1].
	 * @returns {number} - Monotone interpolated sample with unchanged units.
	 */
	sample(previous, lower, upper, next, fraction) {
		if (fraction === 0) return lower;
		if (fraction === 1) return upper;
		const secant = upper - lower;
		const lowerSlope = previous === undefined ? secant : this.slope(lower - previous, secant);
		const upperSlope = next === undefined ? secant : this.slope(secant, next - upper);
		const squared = fraction * fraction;
		const cubed = squared * fraction;
		return (
			(2 * cubed - 3 * squared + 1) * lower +
			(cubed - 2 * squared + fraction) * lowerSlope +
			(-2 * cubed + 3 * squared) * upper +
			(cubed - squared) * upperSlope
		);
	},

	/** Emit the same scalar tangent and four-channel Hermite operation for GPU consumers.
	 * @returns {string} - GLSL functions; callers own stencil availability and domain endpoints.
	 */
	createShaderSource() {
		return `float distantSolarSlope(float before, float after) {
	if (before == 0.0 || after == 0.0 || sign(before) != sign(after)) return 0.0;
	float smaller = min(abs(before), abs(after));
	float larger = max(abs(before), abs(after));
	return sign(before) * (2.0 * smaller / (1.0 + smaller / larger));
}
vec4 distantSolarHermite(vec4 previous, vec4 lower, vec4 upper, vec4 next, float fraction, bool first, bool last) {
	if (fraction == 0.0) return lower;
	if (fraction == 1.0) return upper;
	vec4 secant = upper - lower;
	vec4 lowerSlope, upperSlope;
	for (int component = 0; component < 4; component += 1) {
		lowerSlope[component] = first ? secant[component] : distantSolarSlope(lower[component] - previous[component], secant[component]);
		upperSlope[component] = last ? secant[component] : distantSolarSlope(secant[component], next[component] - upper[component]);
	}
	float squared = fraction * fraction;
	float cubed = squared * fraction;
	return (2.0*cubed - 3.0*squared + 1.0)*lower + (cubed - 2.0*squared + fraction)*lowerSlope
		+ (-2.0*cubed + 3.0*squared)*upper + (cubed - squared)*upperSlope;
}
`;
	},
};
