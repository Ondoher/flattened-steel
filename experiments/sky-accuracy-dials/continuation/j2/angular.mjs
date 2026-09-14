import {sourceFrame, unit, dot} from '../../numerics/math.js';

/** Fixed component-only rules; I8192 never expands GPU profile admission.
 * @readonly @type {readonly SkyJ2Rule[]}
 */
export const localJ2Rules = [
	{id: 'i512-midpoint', muCount: 16, azimuthCount: 32, placement: 'midpoint'},
	{id: 'i2048-midpoint', muCount: 32, azimuthCount: 64, placement: 'midpoint'},
	{id: 'i8192-midpoint', muCount: 64, azimuthCount: 128, placement: 'midpoint'},
	{id: 'i8192-endpoint', muCount: 64, azimuthCount: 128, placement: 'endpoint-aware'},
];

/** Full-interval Gauss roots/weights, with the experiment's Newton arithmetic.
 * @param {number} count - One of the registered component cosine counts.
 * @returns {readonly SkyJ2GaussNode[]} Increasing full [-1,1] rule.
 */
export function componentGauss(count) {
	if (![16, 32, 64].includes(count)) throw new RangeError('Unregistered component cosine count.');
	/** @type {SkyJ2GaussNode[]} */ const result = Array(count);
	for (let root = 0; root < count / 2; root++) {
		let x = Math.cos((Math.PI * (root + 0.75)) / (count + 0.5)),
			derivative = 0,
			converged = false;
		for (let iteration = 0; iteration < 64; iteration++) {
			let p0 = 1,
				p1 = x;
			for (let degree = 2; degree <= count; degree++) {
				const next = ((2 * degree - 1) * x * p1 - (degree - 1) * p0) / degree;
				p0 = p1;
				p1 = next;
			}
			derivative = (count * (x * p1 - p0)) / (x * x - 1);
			const next = x - p1 / derivative;
			if (Math.abs(next - x) <= 4 * Number.EPSILON) {
				x = next;
				converged = true;
				break;
			}
			x = next;
		}
		if (!converged) throw new Error('Component Gaussian root did not converge.');
		let p0 = 1,
			p1 = x;
		for (let degree = 2; degree <= count; degree++) {
			const next = ((2 * degree - 1) * x * p1 - (degree - 1) * p0) / degree;
			p0 = p1;
			p1 = next;
		}
		derivative = (count * (x * p1 - p0)) / (x * x - 1);
		const weight = 2 / ((1 - x * x) * derivative * derivative);
		if (!(weight > 0) || !Number.isFinite(weight)) throw new Error('Invalid component Gaussian weight.');
		result[root] = {node: -x, weight};
		result[count - root - 1] = {node: x, weight};
	}
	return result;
}

/** Unique upper-hemisphere representatives of the full product rule.
 * Every representative retains both mirrored vectors for phase weighting.
 * @param {SkyJ2Rule} rule - Exact registered rule.
 * @returns {readonly SkyJ2Incident[]} Ordered reflection groups; no hemisphere renormalization.
 */
export function incidentGroups(rule) {
	if (!localJ2Rules.some((candidate) => JSON.stringify(candidate) === JSON.stringify(rule)))
		throw new RangeError('Unregistered local J2 angular rule.');
	/** @type {SkyJ2Incident[]} */ const groups = [];
	const step = (2 * Math.PI) / rule.azimuthCount;
	for (const {node, weight} of componentGauss(rule.muCount)) {
		if (node <= 0) continue;
		const radius = Math.sqrt(Math.max(0, 1 - node * node));
		if (rule.placement === 'endpoint-aware') {
			groups.push({direction: [radius, 0, node], mirror: null, weight: weight * step});
			groups.push({direction: [-radius, 0, node], mirror: null, weight: weight * step});
		}
		for (let j = rule.placement === 'midpoint' ? 0 : 1; j < rule.azimuthCount / 2; j++) {
			const angle = (j + (rule.placement === 'midpoint' ? 0.5 : 0)) * step;
			const x = radius * Math.cos(angle),
				y = radius * Math.sin(angle);
			groups.push({direction: [x, y, node], mirror: [x, -y, node], weight: weight * step});
		}
	}
	return groups;
}

/** Rotate a local incident node through the registered source-facing radial frame.
 * @param {SkyVector3} origin - Ground point.
 * @param {SkyVector3} local - Unit local direction.
 * @returns {SkyVector3} Normalized physical incident direction.
 */
export function incidentWorld(origin, local) {
	const frame = sourceFrame(origin);
	return unit(
		[0, 1, 2].map((axis) => frame[0][axis] * local[0] + frame[1][axis] * local[1] + frame[2][axis] * local[2]),
	);
}

/** Stable positive exit for admitted outward surface rays.
 * @param {SkyVector3} origin - Ground position.
 * @param {SkyVector3} direction - Unit outward physical direction.
 * @param {number} topRadius - Atmosphere radius in metres.
 * @returns {number} Positive path length in metres.
 */
export function outwardLength(origin, direction, topRadius) {
	const radius = Math.hypot(...origin),
		projection = dot(origin, direction);
	const delta = (topRadius - radius) * (topRadius + radius);
	return delta / (Math.sqrt(projection * projection + delta) + projection);
}
