import {
	FIBONACCI_REFERENCE_SWITCH_DOT,
	SCATTERING_CACHE_BASIS_TOLERANCE,
	SCATTERING_CACHE_X_AXIS,
	SCATTERING_CACHE_Y_AXIS,
	SCATTERING_CACHE_Z_AXIS,
} from './consts.js';

/**
 * Preserve positive zero in descriptor and vector identities.
 *
 * @param {number} value - Supplies one scalar.
 * @returns {number} Return the canonical scalar.
 */
function canonicalZero(value) {
	return value === 0 ? 0 : value;
}

/**
 * Return one three-component dot product in retained operation order.
 *
 * @param {readonly number[]} left - Supplies the first vector.
 * @param {readonly number[]} right - Supplies the second vector.
 * @returns {number} Return the scalar product.
 */
function dot(left, right) {
	return left[0] * right[0] + left[1] * right[1] + left[2] * right[2];
}

/**
 * Subtract one three-component vector from another.
 *
 * @param {readonly number[]} left - Supplies the minuend.
 * @param {readonly number[]} right - Supplies the subtrahend.
 * @returns {UnitVector3} Return the component difference.
 */
function subtract(left, right) {
	return [
		left[0] - right[0],
		left[1] - right[1],
		left[2] - right[2],
	];
}

/**
 * Scale one vector.
 *
 * @param {readonly number[]} vector - Supplies the vector.
 * @param {number} factor - Supplies the scale.
 * @returns {UnitVector3} Return the scaled components.
 */
function scale(vector, factor) {
	return [
		canonicalZero(vector[0] * factor),
		canonicalZero(vector[1] * factor),
		canonicalZero(vector[2] * factor),
	];
}

/**
 * Return one three-component cross product.
 *
 * @param {readonly number[]} left - Supplies the first vector.
 * @param {readonly number[]} right - Supplies the second vector.
 * @returns {UnitVector3} Return the cross product.
 */
function cross(left, right) {
	return [
		left[1] * right[2] - left[2] * right[1],
		left[2] * right[0] - left[0] * right[2],
		left[0] * right[1] - left[1] * right[0],
	];
}

/**
 * Normalize using the retained production Fibonacci operation order.
 *
 * @param {readonly number[]} vector - Supplies a nonzero vector.
 * @returns {UnitVector3} Return the normalized vector.
 */
function normalizeWithSquareRoot(vector) {
	const length = Math.sqrt(dot(vector, vector));
	if (!(length > 0) || !Number.isFinite(length)) {
		throw new TypeError('Cannot normalize a zero or non-finite direction.');
	}

	return scale(vector, 1 / length);
}

/**
 * Normalize using the selected Star W27 operation order.
 *
 * @param {readonly number[]} vector - Supplies a nonzero vector.
 * @returns {UnitVector3} Return the normalized vector.
 */
function normalizeWithHypot(vector) {
	const length = Math.hypot(...vector);
	if (!(length > 0) || !Number.isFinite(length)) {
		throw new TypeError('Cannot normalize a zero or non-finite direction.');
	}

	return [
		canonicalZero(vector[0] / length),
		canonicalZero(vector[1] / length),
		canonicalZero(vector[2] / length),
	];
}

/**
 * Choose the retained X/Y/Z least-aligned fallback, preserving tie order.
 *
 * @param {UnitVector3} direction - Supplies the source axis.
 * @returns {UnitVector3} Return the selected Cartesian axis.
 */
function leastAlignedCartesianAxis(direction) {
	return [
		SCATTERING_CACHE_X_AXIS,
		SCATTERING_CACHE_Y_AXIS,
		SCATTERING_CACHE_Z_AXIS,
	].reduce((selected, candidate) => (
		Math.abs(dot(candidate, direction)) < Math.abs(dot(selected, direction))
			? candidate
			: selected
	));
}

/**
 * Build the source-oriented Fibonacci frame retained by Algorithm32-star.
 *
 * @param {UnitVector3} directionToSource - Supplies the physical +X axis.
 * @returns {ScatteringCacheDirectionFrame} Return the physical basis.
 */
function createFibonacciFrame(directionToSource) {
	const xAxis = directionToSource;
	const reference = Math.abs(
		dot(xAxis, SCATTERING_CACHE_Z_AXIS),
	) < FIBONACCI_REFERENCE_SWITCH_DOT
		? SCATTERING_CACHE_Z_AXIS
		: SCATTERING_CACHE_Y_AXIS;
	const zAxis = normalizeWithSquareRoot(subtract(
		reference,
		scale(xAxis, dot(reference, xAxis)),
	));
	const yAxis = normalizeWithSquareRoot(cross(zAxis, xAxis));

	return { xAxis, yAxis, zAxis };
}

/**
 * Build the source-aligned W27 frame retained by Algorithm32-star.
 *
 * @param {UnitVector3} directionToSource - Supplies the physical +X axis.
 * @returns {ScatteringCacheDirectionFrame} Return the physical basis.
 */
function createW27Frame(directionToSource) {
	const xAxis = directionToSource;
	let zAxis = subtract(
		SCATTERING_CACHE_Z_AXIS,
		scale(
			xAxis,
			dot(SCATTERING_CACHE_Z_AXIS, xAxis),
		),
	);
	if (Math.hypot(...zAxis)
		<= SCATTERING_CACHE_BASIS_TOLERANCE) {
		const fallback = leastAlignedCartesianAxis(xAxis);
		zAxis = subtract(fallback, scale(xAxis, dot(fallback, xAxis)));
	}
	zAxis = normalizeWithHypot(zAxis);
	const yAxis = normalizeWithHypot(cross(zAxis, xAxis));

	return { xAxis, yAxis, zAxis };
}

/**
 * Express one trusted source-local direction through an accepted frame.
 *
 * @param {UnitVector3} cacheDirection - Supplies accepted source-local data.
 * @param {ScatteringCacheDirectionFrame} frame - Supplies the executable frame.
 * @param {"fibonacci" | "w27"} normalization - Selects retained normalization order.
 * @returns {UnitVector3} Return the physical direction.
 */
function physicalDirectionInFrame(cacheDirection, frame, normalization) {
	const physical = /** @type {UnitVector3} */ ([
		canonicalZero(
			frame.xAxis[0] * cacheDirection[0]
			+ frame.yAxis[0] * cacheDirection[1]
			+ frame.zAxis[0] * cacheDirection[2],
		),
		canonicalZero(
			frame.xAxis[1] * cacheDirection[0]
			+ frame.yAxis[1] * cacheDirection[1]
			+ frame.zAxis[1] * cacheDirection[2],
		),
		canonicalZero(
			frame.xAxis[2] * cacheDirection[0]
			+ frame.yAxis[2] * cacheDirection[1]
			+ frame.zAxis[2] * cacheDirection[2],
		),
	]);

	return normalization === 'w27'
		? normalizeWithHypot(physical)
		: normalizeWithSquareRoot(physical);
}

/**
 * Express accepted Fibonacci-34 executable data without reading descriptor
 * metadata back into construction logic.
 *
 * @param {UnitVector3} cacheDirection - Supplies the accepted local direction.
 * @param {UnitVector3} directionToSource - Supplies the accepted source axis.
 * @returns {UnitVector3} Return the physical direction.
 */
export function physicalFibonacciDirection(cacheDirection, directionToSource) {
	return physicalDirectionInFrame(
		cacheDirection,
		createFibonacciFrame(directionToSource),
		'fibonacci',
	);
}

/**
 * Express accepted W27 executable data without reading descriptor metadata
 * back into construction logic.
 *
 * @param {UnitVector3} cacheDirection - Supplies the accepted local direction.
 * @param {UnitVector3} directionToSource - Supplies the accepted source axis.
 * @returns {UnitVector3} Return the physical direction.
 */
export function physicalW27Direction(cacheDirection, directionToSource) {
	return physicalDirectionInFrame(
		cacheDirection,
		createW27Frame(directionToSource),
		'w27',
	);
}

/**
 * Express an accepted physical direction in the executable W27 frame without
 * reading descriptor metadata back into construction logic.
 *
 * @param {UnitVector3} physicalDirection - Supplies the accepted physical direction.
 * @param {UnitVector3} directionToSource - Supplies the accepted source axis.
 * @returns {UnitVector3} Return the W27-local direction.
 */
export function localW27Direction(physicalDirection, directionToSource) {
	const frame = createW27Frame(directionToSource);
	return [
		dot(physicalDirection, frame.xAxis),
		dot(physicalDirection, frame.yAxis),
		dot(physicalDirection, frame.zAxis),
	];
}
