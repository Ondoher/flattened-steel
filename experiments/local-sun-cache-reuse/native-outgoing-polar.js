/** Build nested outgoing-polar interpolation support independently of incoming quadrature.
 * @param {number} count - Power-of-two interval count from eight through 128.
 * @param {LocalSunNativeOutgoingPower} [power=2] - Squared control or fourth-power horizon refinement.
 * @returns {number[]} - Increasing polar cosines including the horizon and both poles.
 */
export function nativeNestedOutgoingPolarSupport(count, power = 2) {
	if (!Number.isSafeInteger(count) || count < 8 || count > 128 || (count & (count - 1)) !== 0)
		throw new Error('Nested outgoing support requires eight through 128 power-of-two intervals.');
	if (power !== 2 && power !== 4) throw new Error('Nested outgoing support requires squared or fourth-power sine.');
	const half = count / 2;
	const positive = Array.from({length: half + 1}, (_, k) =>
		k === 0 ? 0 : k === half ? 1 : Math.sin(Math.PI * k / (2 * half)) ** power);
	return [...positive.slice(1).reverse().map(value => -value), ...positive];
}
