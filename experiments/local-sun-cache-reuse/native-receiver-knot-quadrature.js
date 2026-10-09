import {gaussRule} from './native-grid-reference.js';

/** Integrate across independently constructed polar interpolation boundaries.
 * @param {number} polarCount - Actual positive polar directions, 32/64/128, or 8/16/32/64 with an explicitly bounded horizon tail.
 * @param {number} azimuthCount - Actual periodic midpoint directions; the total remains 256/512/1024.
 * @param {readonly number[]} support - Frozen independent 32-node sphere rule; never candidate nodes or values.
 * @param {boolean} [horizonTail] - Integrate above the first positive independent knot; callers must retain the positive omitted-region envelope, without mass renormalization.
 * @returns {LocalSunNativeReceiverTap[]} - Positive cosine-weighted directions, at most 1,024 actual integrations.
 */
export function nativeReceiverKnotQuadrature(polarCount, azimuthCount, support, horizonTail = false) {
	if (
		!(horizonTail ? [8, 16, 32, 64] : [32, 64, 128]).includes(polarCount) ||
		!(horizonTail ? [4, 8, 16, 32, 64] : [8, 16, 32]).includes(azimuthCount) ||
		![256, 512, 1024].includes(polarCount * azimuthCount) ||
		support.length !== 32 ||
		support.some((mu, i) => !Number.isFinite(mu) || Math.abs(mu) >= 1 || (i > 0 && mu <= support[i - 1]))
	)
		throw new Error('Bounded composite receiver rule requires frozen independent 32-node polar support.');
	const knots = [...(horizonTail ? [] : [0]), ...support.filter((mu) => mu > 0), 1];
	if (knots.length !== (horizonTail ? 17 : 18))
		throw new Error('Independent hemisphere support must have sixteen positive interior knots.');
	// The eight-tap control merges each adjacent pair of independent intervals.
	// Sixteen taps restore every knot; thirty-two then use two-point Gaussian
	// quadrature in every interval. All three levels fit phi=32 at 256/512/1024
	// real directions, sharing their finest state with the azimuth refinement.
	const integrationKnots = horizonTail && polarCount === 8 ? knots.filter((_, i) => i % 2 === 0) : knots;
	const intervals = integrationKnots
		.slice(0, -1)
		.map((low, i) => ({
			low,
			high: integrationKnots[i + 1],
			index: i,
			cosineMass: (integrationKnots[i + 1] ** 2 - low ** 2) / 2,
		}));
	// Seventeen intervals need thirty-four two-node taps. The two intervals
	// with the smallest analytic cosine mass use one midpoint instead. Double
	// every interval's Gaussian order for each refinement: 32/64/128 real taps.
	const singles = new Set(
		[...intervals]
			.sort((a, b) => a.cosineMass - b.cosineMass)
			.slice(0, 2)
			.map((value) => value.index),
	);
	const multiplier = horizonTail && polarCount === 8 ? 1 : polarCount / (horizonTail ? 16 : 32),
		taps = [];
	for (const interval of intervals) {
		const count = (horizonTail || singles.has(interval.index) ? 1 : 2) * multiplier;
		const rule = count === 1 ? [{node: 0, weight: 2}] : gaussRule(count);
		for (const node of rule) {
			const mu = (interval.low + interval.high + (interval.high - interval.low) * node.node) / 2;
			const radius = Math.sqrt(1 - mu * mu),
				weight = (((node.weight * (interval.high - interval.low)) / 2) * mu * 2 * Math.PI) / azimuthCount;
			for (let p = 0; p < azimuthCount; p++) {
				const phi = (2 * Math.PI * (p + 0.5)) / azimuthCount;
				taps.push({direction: [radius * Math.cos(phi), -radius * Math.sin(phi), mu], weight});
			}
		}
	}
	if (
		taps.length !== polarCount * azimuthCount ||
		Math.abs(taps.reduce((sum, tap) => sum + tap.weight, 0) - Math.PI * (1 - (horizonTail ? knots[0] ** 2 : 0))) >
			1e-12 ||
		taps.some((tap) => tap.weight <= 0)
	)
		throw new Error('Composite receiver quadrature inventory or analytic mass failed.');
	return taps;
}
