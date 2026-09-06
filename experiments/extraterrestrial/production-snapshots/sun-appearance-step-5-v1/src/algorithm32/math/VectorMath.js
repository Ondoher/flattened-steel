import ArrayMath from './ArrayMath.js';

/**
 * Called by this module to create a numeric vector filled with one value.
 *
 * @param {number} length - Supplies the vector length.
 * @param {number} value - Supplies the fill value.
 * @returns {number[]} - The initialized numeric vector.
 */
function filled(length, value) {
	return ArrayMath.fill(length, value);
}

/**
 * Called by this module to create a numeric vector filled with zeroes.
 *
 * @param {number} length - Supplies the vector length.
 * @returns {number[]} - The initialized numeric vector.
 */
function zero(length) {
	return ArrayMath.zeros(length);
}

/**
 * Called by this module to create a numeric vector filled with ones.
 *
 * @param {number} length - Supplies the vector length.
 * @returns {number[]} - The initialized numeric vector.
 */
function ones(length) {
	return filled(length, 1);
}

/**
 * Called by this module to add two numeric vectors.
 *
 * @template {readonly number[]} LeftVector
 * @template {readonly number[]} RightVector
 * @param {LeftVector} left - Supplies the first vector.
 * @param {RightVector} right - Supplies the second vector.
 * @returns {number[]} - The summed vector.
 */
function add(left, right) {
	return ArrayMath.add(left, right);
}

/**
 * Called by this module to subtract one numeric vector from another.
 *
 * @template {readonly number[]} LeftVector
 * @template {readonly number[]} RightVector
 * @param {LeftVector} left - Supplies the vector to subtract from.
 * @param {RightVector} right - Supplies the vector to subtract.
 * @returns {number[]} - The difference vector.
 */
function subtract(left, right) {
	return left.map(
		/**
		 * Called by Array.prototype.map to transform one collection value.
		 * @param value - The value accepted by the operation.
		 * @param index - The zero-based index accepted by the operation.
		 * @returns - The callback result returned to its caller.
		 */ (value, index) => value - right[index],
	);
}

/**
 * Called by this module to scale a numeric vector.
 *
 * @template {readonly number[]} Vector
 * @param {Vector} vector - Supplies the vector to scale.
 * @param {number} scalar - Supplies the scale factor.
 * @returns {number[]} - The scaled vector.
 */
function scale(vector, scalar) {
	return vector.map(
		/**
		 * Called by Array.prototype.map to transform one collection value.
		 * @param value - The value accepted by the operation.
		 * @returns - The callback result returned to its caller.
		 */ (value) => value * scalar,
	);
}

/**
 * Called by this module to add a scaled vector to another vector.
 *
 * @template {readonly number[]} BaseVector
 * @template {readonly number[]} DirectionVector
 * @param {BaseVector} base - Supplies the base vector.
 * @param {DirectionVector} direction - Supplies the vector to scale and add.
 * @param {number} scalar - Supplies the scale factor for the direction vector.
 * @returns {number[]} - The combined vector.
 */
function addScaled(base, direction, scalar) {
	return base.map(
		/**
		 * Called by Array.prototype.map to transform one collection value.
		 * @param value - The value accepted by the operation.
		 * @param index - The zero-based index accepted by the operation.
		 * @returns - The callback result returned to its caller.
		 */ (value, index) => value + direction[index] * scalar,
	);
}

/**
 * Called by this module to compute the dot product of two numeric vectors.
 *
 * @template {readonly number[]} LeftVector
 * @template {readonly number[]} RightVector
 * @param {LeftVector} left - Supplies the first vector.
 * @param {RightVector} right - Supplies the second vector.
 * @returns {number} - The dot product.
 */
function dot(left, right) {
	return left.reduce(
		/**
		 * Called by Array.prototype.reduce to accumulate one collection value.
		 * @param sum - The sum value accepted by the operation.
		 * @param value - The value accepted by the operation.
		 * @param index - The zero-based index accepted by the operation.
		 * @returns - The callback result returned to its caller.
		 */ (sum, value, index) => sum + value * right[index],
		0,
	);
}

/**
 * Called by this module to compute the cross product of two 3D tuples.
 *
 * @param {readonly [number, number, number]} left - Supplies the first 3D
 * tuple.
 * @param {readonly [number, number, number]} right - Supplies the second 3D
 * tuple.
 * @returns {[number, number, number]} - The cross product.
 */
function cross(left, right) {
	return [
		left[1] * right[2] - left[2] * right[1],
		left[2] * right[0] - left[0] * right[2],
		left[0] * right[1] - left[1] * right[0],
	];
}

/**
 * Called by this module to compute the Euclidean norm of a numeric vector.
 *
 * @template {readonly number[]} Vector
 * @param {Vector} vector - Supplies the vector to measure.
 * @returns {number} - The Euclidean norm.
 */
function length(vector) {
	return Math.sqrt(dot(vector, vector));
}

/**
 * Called by this module to compute the Euclidean distance between two numeric vectors.
 *
 * @template {readonly number[]} LeftVector
 * @template {readonly number[]} RightVector
 * @param {LeftVector} left - Supplies the first vector.
 * @param {RightVector} right - Supplies the second vector.
 * @returns {number} - The Euclidean distance between vectors.
 */
function distance(left, right) {
	return length(subtract(left, right));
}

/**
 * Called by this module to normalize a numeric vector. It returns the value from the first satisfied branch, otherwise the operation's final fallback.
 *
 * @template {readonly number[]} Vector
 * @param {Vector} vector - Supplies the vector to normalize.
 * @param {ToleranceOptions} [options] - Supplies call-local zero-length
 * tolerance behavior.
 * @returns {number[]} - The normalized vector, or a zero vector when length is at
 * or below epsilon.
 */
function normalize(vector, options = {}) {
	const epsilon = options.epsilon ?? 0;
	const vectorLength = length(vector);

	if (vectorLength <= epsilon) {
		return vector.map(
			/**
			 * Called by Array.prototype.map to transform one collection value.
			 * @returns - The callback result returned to its caller.
			 */ () => 0,
		);
	}

	return scale(vector, 1 / vectorLength);
}

/**
 * Called by this module to check whether every vector value is finite.
 *
 * @template {readonly number[]} Vector
 * @param {Vector} vector - Supplies the vector to inspect.
 * @returns {boolean} - True when every vector value is finite.
 */
function isFiniteVector(vector) {
	return vector.every(Number.isFinite);
}

/**
 * Called by this module to check whether a vector has unit length within tolerance.
 *
 * @template {readonly number[]} Vector
 * @param {Vector} vector - Supplies the vector to inspect.
 * @param {ToleranceOptions} [options] - Supplies call-local tolerance behavior.
 * @returns {boolean} - True when the vector length is within epsilon of one.
 */
function isNormalized(vector, options = {}) {
	const epsilon = options.epsilon ?? Number.EPSILON;

	return Math.abs(length(vector) - 1) <= epsilon;
}

/** General numeric vector operations. */
export default {
	add,
	addScaled,
	cross,
	distance,
	dot,
	filled,
	isFiniteVector,
	isNormalized,
	length,
	normalize,
	ones,
	scale,
	subtract,
	zero,
};
