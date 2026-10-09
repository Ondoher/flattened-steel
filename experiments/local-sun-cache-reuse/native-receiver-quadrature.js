import {gaussRule} from './native-grid-reference.js';

/** Independent hemisphere product rule with explicit cosine-weighted solid-angle mass.
 * @param {number} polarCount - Independent Gaussian polar resolution, 2/4/8/16/32.
 * @param {number} azimuthCount - Independent periodic midpoint resolution, 16/32/64/128.
 * @param {LocalSunNativeReceiverRule} [rule] - Gaussian control or explicitly identified positive horizon-focused rule.
 * @returns {LocalSunNativeReceiverTap[]} - World-frame directions with positive irradiance weights.
 */
export function nativeReceiverQuadrature(polarCount, azimuthCount, rule = 'gauss') {
	if (
		![2, 4, 8, 16, 32].includes(polarCount) ||
		![16, 32, 64, 128].includes(azimuthCount) ||
		![128, 256, 512, 1024].includes(polarCount * azimuthCount)
	)
		throw new Error('Independent receiver product resolution exceeds the declared direction levels.');
	const taps = [];
	const poles =
		rule === 'gauss' || rule === 'gauss-sinh5' || rule === 'gauss-square'
			? gaussRule(polarCount).map((polar) => {
					const u = (polar.node + 1) / 2;
					return rule === 'gauss'
						? {mu: u, mass: polar.weight / 2}
						: rule === 'gauss-square'
							? {mu: u * u, mass: polar.weight * u}
							: {
									mu: Math.sinh(5 * u) / Math.sinh(5),
									mass: ((polar.weight / 2) * 5 * Math.cosh(5 * u)) / Math.sinh(5),
								};
				})
			: rule === 'trapezoid-sinh5'
				? Array.from({length: polarCount}, (_, index) => {
						const u = (index + 1) / polarCount;
						return {
							mu: Math.sinh(5 * u) / Math.sinh(5),
							mass:
								((5 * Math.cosh(5 * u)) / Math.sinh(5) / polarCount) *
								(index === polarCount - 1 ? 0.5 : 1),
						};
					})
				: null;
	if (!poles) throw new Error('Unknown independent receiver polar rule.');
	const normalization = rule === 'gauss' ? 1 : 0.5 / poles.reduce((sum, pole) => sum + pole.mu * pole.mass, 0);
	for (const polar of poles) {
		const mu = polar.mu,
			radius = Math.sqrt(1 - mu * mu),
			weight = (polar.mass * normalization * mu * 2 * Math.PI) / azimuthCount;
		for (let p = 0; p < azimuthCount; p++) {
			const phi = (2 * Math.PI * (p + 0.5)) / azimuthCount;
			taps.push({direction: [radius * Math.cos(phi), -radius * Math.sin(phi), mu], weight});
		}
	}
	if (Math.abs(taps.reduce((sum, tap) => sum + tap.weight, 0) - Math.PI) > 1e-12)
		throw new Error('Independent cosine-weighted hemisphere mass differs from pi.');
	return taps;
}
