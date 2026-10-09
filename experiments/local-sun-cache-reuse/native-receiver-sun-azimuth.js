import {gaussRule} from './native-grid-reference.js';
import {CANONICAL_ATMOSPHERE_CONSTANTS as atmosphere} from '../../src/algorithm32/implementation/canonical-atmosphere/consts.js';

/** Replace a uniform azimuth product with positive Sun-aligned half-circle Gaussian samples.
 * Both half circles are evaluated, without assuming equal radiance or dropping
 * samples. Alignment follows source geometry, never measured candidate values.
 * @param {readonly LocalSunNativeReceiverTap[]} taps - Positive polar-product samples.
 * @param {number} azimuthCount - Actual azimuth count, 4/8/16/32/64.
 * @param {number} origin - Physical horizontal direction towards the finite source, radians.
 * @param {number} [sourceCosine] - Optional exact vertical source-direction cosine. A phase-derived tan-half-angle map concentrates quadrature around forward scattering, normalizing only known constant angular mass.
 * @returns {LocalSunNativeReceiverTap[]} - Same actual sample count and analytic cosine mass.
 */
export function nativeReceiverSunAzimuth(taps, azimuthCount, origin, sourceCosine) {
	if (
		![4, 8, 16, 32, 64].includes(azimuthCount) ||
		!Number.isFinite(origin) ||
		!taps.length ||
		taps.length % azimuthCount !== 0
	)
		throw new Error('Complete positive product and finite source azimuth required.');
	if (sourceCosine !== undefined && (!Number.isFinite(sourceCosine) || Math.abs(sourceCosine) > 1))
		throw new Error('A physical source-direction cosine is required.');
	const rule = gaussRule(azimuthCount / 2),
		result = [];
	for (let i = 0; i < taps.length; i += azimuthCount) {
		const pole = taps[i],
			mu = pole.direction[2],
			radius = Math.sqrt(1 - mu * mu);
		if (
			taps
				.slice(i, i + azimuthCount)
				.some((tap) => tap.direction[2] !== mu || tap.weight !== pole.weight || tap.weight <= 0)
		)
			throw new Error('Unequal polar group cannot be transformed as an azimuth product.');
		const g = atmosphere.miePhaseFunctionG;
		const a = sourceCosine === undefined ? 1 : 1 + g * g - 2 * g * mu * sourceCosine;
		const b = sourceCosine === undefined ? 0 : 2 * g * radius * Math.sqrt(1 - sourceCosine * sourceCosine);
		const scale = Math.sqrt((a - b) / (a + b));
		if (!(scale > 0 && scale <= 1)) throw new Error('Invalid positive phase-derived angular scale.');
		const mapped = rule.map((node) => {
			const tangent = Math.tan(((node.node + 1) * Math.PI) / 4);
			return {
				angle: 2 * Math.atan(scale * tangent),
				mass: (node.weight * scale * (1 + tangent * tangent)) / (1 + scale * scale * tangent * tangent),
			};
		});
		const mass = mapped.reduce((sum, node) => sum + node.mass, 0);
		for (const node of mapped)
			for (const sign of [-1, 1]) {
				const phi = origin + sign * node.angle;
				result.push({
					direction: [radius * Math.cos(phi), radius * Math.sin(phi), mu],
					weight: (pole.weight * azimuthCount * node.mass) / (2 * mass),
				});
			}
	}
	const originalMass = taps.reduce((sum, tap) => sum + tap.weight, 0),
		actualMass = result.reduce((sum, tap) => sum + tap.weight, 0);
	if (
		result.length !== taps.length ||
		Math.abs(actualMass - originalMass) > 1e-12 ||
		result.some((tap) => tap.weight <= 0 || Math.abs(Math.hypot(...tap.direction) - 1) > 1e-12)
	)
		throw new Error('Gaussian azimuth inventory, mass or unit directions failed.');
	return result;
}
