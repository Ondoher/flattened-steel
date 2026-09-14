/** Binary64 geometry adapted from production DistantSunBrunetonView and
 * CubedSphereDirectionDomain; preserves their operation and face order.
 */

/** @param {readonly number[]} left - First vector.
 * @param {readonly number[]} right - Second vector.
 * @returns {number} Dot product. */
export function dot(left, right) {
	return left[0] * right[0] + left[1] * right[1] + left[2] * right[2];
}

/** @param {readonly number[]} value - Nonzero vector.
 * @returns {SkyVector3} Normalized vector. */
export function unit(value) {
	const length = Math.hypot(...value);
	if (!(length > 0) || !Number.isFinite(length)) throw new RangeError('A finite nonzero vector is required.');
	return [value[0] / length, value[1] / length, value[2] / length];
}

/** @param {readonly number[]} left - First vector.
 * @param {readonly number[]} right - Second vector.
 * @returns {SkyVector3} Cross product. */
export function cross(left, right) {
	return [
		left[1] * right[2] - left[2] * right[1],
		left[2] * right[0] - left[0] * right[2],
		left[0] * right[1] - left[1] * right[0],
	];
}

/** @param {number} value - Candidate.
 * @param {number} lower - Lower bound.
 * @param {number} upper - Upper bound.
 * @returns {number} Clamped value. */
export function clamp(value, lower, upper) {
	return Math.max(lower, Math.min(upper, value));
}

/** @param {SkyVector3} point - Physical position.
 * @returns {readonly SkyVector3[]} Tangent, across, up basis in the canonical world with Sun along +Z. */
export function sourceFrame(point) {
	const up = unit(point),
		cosine = clamp(up[2], -1, 1);
	let horizontal = [0, 0, 1].map((value, axis) => value - cosine * up[axis]);
	if (Math.hypot(...horizontal) <= 1e-12) {
		const reference = [
			[1, 0, 0],
			[0, 1, 0],
			[0, 0, 1],
		].reduce((best, candidate) => (Math.abs(dot(candidate, up)) < Math.abs(dot(best, up)) ? candidate : best));
		horizontal = reference.map((value, axis) => value - dot(reference, up) * up[axis]);
	}
	const tangent = unit(horizontal);
	return [tangent, unit(cross(up, tangent)), up];
}

/** @param {SkyVector3} point - Physical position.
 * @param {SkyVector3} direction - World direction.
 * @returns {SkyVector3} Receiver-local outgoing direction. */
export function localDirection(point, direction) {
	const axes = sourceFrame(point),
		value = unit(direction);
	return [dot(value, axes[0]), dot(value, axes[1]), dot(value, axes[2])];
}

/** @param {readonly number[]} nodes - Strictly increasing nodes.
 * @param {number} value - Physical coordinate.
 * @returns {SkyLinearStencil} Production clamped linear stencil. */
export function linearStencil(nodes, value) {
	if (!Number.isFinite(value)) throw new RangeError('Interpolation coordinate must be finite.');
	if (value <= nodes[0]) return {indices: [0], weights: [1]};
	if (value >= nodes.at(-1)) return {indices: [nodes.length - 1], weights: [1]};
	let upper = 1;
	while (nodes[upper] < value) upper++;
	const lower = upper - 1,
		fraction = (value - nodes[lower]) / (nodes[upper] - nodes[lower]);
	return {indices: [lower, upper], weights: [1 - fraction, fraction]};
}

/** @readonly @type {readonly SkyCubeFace[]} */
export const CUBE_FACES = [
	{normal: [1, 0, 0], uAxis: [0, 1, 0], vAxis: [0, 0, 1]},
	{normal: [-1, 0, 0], uAxis: [0, -1, 0], vAxis: [0, 0, 1]},
	{normal: [0, 1, 0], uAxis: [-1, 0, 0], vAxis: [0, 0, 1]},
	{normal: [0, -1, 0], uAxis: [1, 0, 0], vAxis: [0, 0, 1]},
	{normal: [0, 0, 1], uAxis: [1, 0, 0], vAxis: [0, 1, 0]},
	{normal: [0, 0, -1], uAxis: [-1, 0, 0], vAxis: [0, 1, 0]},
];

/** @param {number} width - Odd face width within the flattened hardware limit.
 * @returns {SkyOutgoingDomain} Generic production-convention outgoing domain. */
export function createOutgoingDomain(width) {
	if (![27, 39, 51].includes(width)) throw new RangeError('Outgoing width must be 27, 39 or 51.');
	const cellWidth = width - 1,
		faceCount = width * width,
		count = 6 * faceCount;
	const canonical = (/** @type {SkyVector3} */ vector) =>
		/** @type {SkyVector3} */ ([
			vector[0] === 0 ? 0 : vector[0],
			vector[1] === 0 ? 0 : vector[1],
			vector[2] === 0 ? 0 : vector[2],
		]);
	const unitVectors = Array.from({length: count}, (_unused, index) => {
		const faceIndex = Math.floor(index / faceCount),
			local = index - faceIndex * faceCount,
			v = Math.floor(local / width),
			u = local - v * width,
			face = CUBE_FACES[faceIndex];
		const cube = [0, 1, 2].map(
			(axis) =>
				face.normal[axis] * cellWidth +
				face.uAxis[axis] * (2 * u - cellWidth) +
				face.vAxis[axis] * (2 * v - cellWidth),
		);
		return canonical(unit(canonical(unit(cube))));
	});
	const center = (width - 1) / 2;
	return {
		id: `sky-accuracy-dials-cubed-sphere-w${width}-v1`,
		faceWidth: width,
		directionCount: count,
		unitVectors,
		positiveFaceCenterIndices: {
			positiveX: center * width + center,
			positiveY: 2 * faceCount + center * width + center,
			positiveZ: 4 * faceCount + center * width + center,
		},
	};
}

/** @param {SkyVector3} direction - Unit receiver-local direction.
 * @param {number} width - Face width.
 * @returns {SkyLinearStencil} Production-order bilinear taps. */
export function outgoingStencil(direction, width) {
	if (
		![27, 39, 51].includes(width) ||
		!Number.isFinite(Math.hypot(...direction)) ||
		Math.abs(Math.hypot(...direction) - 1) > 1e-6
	)
		throw new RangeError('Outgoing lookup requires a supported width and finite unit vector.');
	let faceIndex = 0,
		projection = -Infinity;
	for (const [index, face] of CUBE_FACES.entries())
		if (dot(direction, face.normal) > projection) {
			faceIndex = index;
			projection = dot(direction, face.normal);
		}
	const face = CUBE_FACES[faceIndex],
		cells = width - 1;
	const coordinates = [face.uAxis, face.vAxis].map((axis) =>
		clamp((clamp(dot(direction, axis) / projection, -1, 1) + 1) * 0.5 * cells, 0, cells),
	);
	const locations = coordinates.map((value) => {
		const nearest = Math.round(value);
		if (Math.abs(value - nearest) <= 1e-10) return {lower: nearest, upper: nearest, fraction: 0};
		const lower = Math.floor(value);
		return {lower, upper: Math.min(lower + 1, width - 1), fraction: value - lower};
	});
	const [u, v] = locations;
	const taps = new Map();
	const add = (/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ weight) => {
		if (weight > 0) {
			const index = faceIndex * width * width + y * width + x;
			taps.set(index, (taps.get(index) ?? 0) + weight);
		}
	};
	add(u.lower, v.lower, (1 - u.fraction) * (1 - v.fraction));
	add(u.upper, v.lower, u.fraction * (1 - v.fraction));
	add(u.lower, v.upper, (1 - u.fraction) * v.fraction);
	add(u.upper, v.upper, u.fraction * v.fraction);
	const indices = [...taps.keys()],
		weights = [...taps.values()],
		total = weights.reduce((sum, weight) => sum + weight, 0);
	if (!(total > 0)) throw new RangeError('Outgoing interpolation has no positive support.');
	return {indices, weights: weights.map((weight) => weight / total)};
}

/** @param {SkyOutgoingDomain} outgoing - Explicit logical vectors.
 * @returns {Uint32Array} Canonical first-logical representative for each Float32 seam direction. */
export function canonicalDirections(outgoing) {
	const first = new Map();
	return Uint32Array.from(outgoing.unitVectors, (vector, index) => {
		const key = vector.map(Math.fround).join(',');
		if (!first.has(key)) first.set(key, index);
		return first.get(key);
	});
}

/** Production harmonic interior tangent; arguments are consecutive secants.
 * @param {number} before - Previous secant.
 * @param {number} after - Following secant.
 * @returns {number} Harmonic slope or zero at an extremum.
 */
function slope(before, after) {
	if (before === 0 || after === 0 || Math.sign(before) !== Math.sign(after)) return 0;
	const smaller = Math.min(Math.abs(before), Math.abs(after)),
		larger = Math.max(Math.abs(before), Math.abs(after));
	return Math.sign(before) * ((2 * smaller) / (1 + smaller / larger));
}

/** Exact operation order of production DistantSunSolarInterpolation.sample.
 * @param {number|undefined} previous - Optional outer lower value.
 * @param {number} lower - Lower knot.
 * @param {number} upper - Upper knot.
 * @param {number|undefined} next - Optional outer upper value.
 * @param {number} fraction - Interval coordinate.
 * @returns {number} Shape-preserving interpolated value.
 */
export function solarCubic(previous, lower, upper, next, fraction) {
	if (fraction === 0) return lower;
	if (fraction === 1) return upper;
	const secant = upper - lower,
		lowerSlope = previous === undefined ? secant : slope(lower - previous, secant),
		upperSlope = next === undefined ? secant : slope(secant, next - upper),
		squared = fraction * fraction,
		cubed = squared * fraction;
	return (
		(2 * cubed - 3 * squared + 1) * lower +
		(cubed - 2 * squared + fraction) * lowerSlope +
		(-2 * cubed + 3 * squared) * upper +
		(cubed - squared) * upperSlope
	);
}
