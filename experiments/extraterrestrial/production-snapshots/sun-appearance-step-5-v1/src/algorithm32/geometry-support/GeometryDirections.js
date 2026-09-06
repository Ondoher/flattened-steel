import VectorMath from '../math/VectorMath.js';

/**
 * Called by this module to accept one finite three-component direction tuple.
 *
 * @param {unknown} value - The candidate value.
 * @param {string} label - The diagnostic label.
 * @returns {readonly [number, number, number]} - The accepted vector tuple.
 * @throws {TypeError} - When an accepted value does not satisfy the required type or shape.
 */
function directionTuple(value, label) {
	if (Array.isArray(value) && value.length === 3 && value.every(Number.isFinite)) {
		return [value[0], value[1], value[2]];
	}

	throw new TypeError(`${label} must be a finite three-component vector.`);
}

/**
 * Called by this module to normalize a finite non-zero direction at an ingress.
 *
 * @param {unknown} direction - The direction candidate.
 * @param {string} label - The diagnostic label.
 * @returns {UnitVector3} - The normalized direction.
 * @throws {RangeError} - When an accepted value is outside the supported range.
 */
function normalizeDirection(direction, label) {
	const vector = directionTuple(direction, label);

	if (VectorMath.length(vector) <= Number.EPSILON) {
		throw new RangeError(`${label} must be non-zero.`);
	}

	const normalized = VectorMath.normalize(vector);
	return /** @type {UnitVector3} */ [normalized[0], normalized[1], normalized[2]];
}

/**
 * Called by this module to normalize an accepted non-zero direction without repeating its static shape contract.
 *
 * @param {UnitVector3} direction - The accepted direction.
 * @param {string} label - The numerical-degeneracy label.
 * @returns {UnitVector3} - The normalized direction.
 * @throws {RangeError} - When an accepted value is outside the supported range.
 */
function normalizeTrustedDirection(direction, label) {
	if (VectorMath.length(direction) <= Number.EPSILON) {
		throw new RangeError(`${label} must be non-zero.`);
	}

	const normalized = VectorMath.normalize(direction);
	return /** @type {UnitVector3} */ [normalized[0], normalized[1], normalized[2]];
}

/**
 * Called by this module to read a Three-style vector at a renderer ingress.
 *
 * @param {unknown} value - The Three-vector candidate.
 * @param {string} label - The diagnostic label.
 * @returns {readonly [number, number, number]} - The accepted vector tuple.
 * @throws {TypeError} - When an accepted value does not satisfy the required type or shape.
 */
function threeVectorTuple(value, label) {
	const candidate = /** @type {{ x?: unknown, y?: unknown, z?: unknown }} */ (value);

	if (
		typeof candidate?.x === 'number' &&
		Number.isFinite(candidate.x) &&
		typeof candidate.y === 'number' &&
		Number.isFinite(candidate.y) &&
		typeof candidate.z === 'number' &&
		Number.isFinite(candidate.z)
	) {
		return [candidate.x, candidate.y, candidate.z];
	}

	throw new TypeError(`${label} must be a Three-style vector.`);
}

/** Geometry-neutral direction and Three-vector conversion operations. */
export const GeometryDirections = {
	directionTuple,
	normalizeDirection,
	normalizeTrustedDirection,
	threeVectorTuple,
};
