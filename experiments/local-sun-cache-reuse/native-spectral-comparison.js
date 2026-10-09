/** Track channelwise frozen absolute-plus-relative limits without averaging failures.
 * @param {ArrayLike<number>} actual - Candidate channels.
 * @param {ArrayLike<number>} expected - Reference channels.
 * @param {number} absolute - Quantity absolute bound.
 * @param {number} relative - Frozen relative bound.
 * @returns {LocalSunRotationResidual} - Complete scalar count and worst residual.
 */
export function residual(actual, expected, absolute, relative) {
	if (actual.length !== expected.length) throw new Error('Comparison shape mismatch.');
	let maximumAbsolute = 0,
		maximumRatio = 0,
		failures = 0,
		nonfinite = 0,
		negative = 0,
		worstIndex = 0;
	for (let i = 0; i < actual.length; i++) {
		if (!Number.isFinite(actual[i]) || !Number.isFinite(expected[i])) {
			nonfinite++;
			failures++;
			continue;
		}
		if (actual[i] < -absolute || expected[i] < -absolute) negative++;
		const error = Math.abs(actual[i] - expected[i]),
			ratio = error / (absolute + relative * Math.abs(expected[i]));
		if (ratio > maximumRatio) {
			maximumRatio = ratio;
			worstIndex = i;
		}
		maximumAbsolute = Math.max(maximumAbsolute, error);
		if (ratio > 1) failures++;
	}
	return {count: actual.length, maximumAbsolute, maximumRatio, failures, nonfinite, negative, worstIndex};
}
