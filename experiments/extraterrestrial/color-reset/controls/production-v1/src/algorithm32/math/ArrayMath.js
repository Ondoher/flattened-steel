/**
 * Called by this module to create a fixed-length numeric array filled with zero.
 *
 * @param {number} length - Supplies the array length.
 * @returns {number[]} - The initialized numeric array.
 */
function zeros(length) {
	return Array.from(
		{length},
		/**
		 * Called by the surrounding operation to handle one callback invocation.
		 * @returns - The callback result returned to its caller.
		 */ () => 0,
	);
}

/**
 * Called by this module to create a fixed-length numeric array filled with one value.
 *
 * @param {number} length - Supplies the array length.
 * @param {number} value - Supplies the fill value.
 * @returns {number[]} - The initialized numeric array.
 */
function fill(length, value) {
	return Array.from(
		{length},
		/**
		 * Called by the surrounding operation to handle one callback invocation.
		 * @returns - The callback result returned to its caller.
		 */ () => value,
	);
}

/**
 * Called by this module to add two numeric arrays element by element.
 *
 * @param {readonly number[]} left - Supplies the first numeric array.
 * @param {readonly number[]} right - Supplies the second numeric array.
 * @returns {number[]} - The element-wise sum.
 */
function add(left, right) {
	return left.map(
		/**
		 * Called by Array.prototype.map to transform one collection value.
		 * @param value - The value accepted by the operation.
		 * @param index - The zero-based index accepted by the operation.
		 * @returns - The callback result returned to its caller.
		 */ (value, index) => value + right[index],
	);
}

/**
 * Called by this module to multiply two numeric arrays element by element.
 *
 * @param {readonly number[]} left - Supplies the first numeric array.
 * @param {readonly number[]} right - Supplies the second numeric array.
 * @returns {number[]} - The element-wise product.
 */
function multiply(left, right) {
	return left.map(
		/**
		 * Called by Array.prototype.map to transform one collection value.
		 * @param value - The value accepted by the operation.
		 * @param index - The zero-based index accepted by the operation.
		 * @returns - The callback result returned to its caller.
		 */ (value, index) => value * right[index],
	);
}

/**
 * Called by this module to multiply two array-like numeric values into binary64 storage using the left operand's length.
 *
 * @param {ArrayLike<number>} left - The left numeric values.
 * @param {ArrayLike<number>} right - The right numeric values.
 * @returns {Float64Array<ArrayBufferLike>} - The element-wise product.
 *
 */
function multiplyToFloat64(left, right) {
	return Float64Array.from(
		left,
		/**
		 * Called by the surrounding operation to handle one callback invocation.
		 * @param value - The value accepted by the operation.
		 * @param index - The zero-based index accepted by the operation.
		 * @returns - The callback result returned to its caller.
		 */ (value, index) => value * right[index],
	);
}

/**
 * Called by this module to compute the arithmetic mean of numeric array values. It returns the value from the first satisfied branch, otherwise the operation's final fallback.
 *
 * @param {readonly number[]} values - Supplies the numeric values.
 * @returns {number} - The arithmetic mean, or zero for an empty array.
 */
function mean(values) {
	if (values.length === 0) {
		return 0;
	}

	return (
		values.reduce(
			/**
			 * Called by Array.prototype.reduce to accumulate one collection value.
			 * @param sum - The sum value accepted by the operation.
			 * @param value - The value accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ (sum, value) => sum + value,
			0,
		) / values.length
	);
}

/**
 * Called by this module to compute the weighted sum of numeric array values.
 *
 * @param {readonly number[]} values - Supplies the numeric values.
 * @param {readonly number[]} weights - Supplies the per-value weights.
 * @returns {number} - The weighted sum.
 */
function weightedSum(values, weights) {
	return values.reduce(
		/**
		 * Called by Array.prototype.reduce to accumulate one collection value.
		 * @param sum - The sum value accepted by the operation.
		 * @param value - The value accepted by the operation.
		 * @param index - The zero-based index accepted by the operation.
		 * @returns - The callback result returned to its caller.
		 */ (sum, value, index) => sum + value * weights[index],
		0,
	);
}

/**
 * Called by this module to map numeric array values into a new array.
 *
 * @param {readonly number[]} values - Supplies the numeric values.
 * @param {NumericArrayMapper} mapper - Supplies the mapping function.
 * @returns {number[]} - The mapped numeric array.
 */
function map(values, mapper) {
	return values.map(mapper);
}

/** General numeric array construction, mapping, and arithmetic operations. */
export default {
	add,
	fill,
	map,
	mean,
	multiply,
	multiplyToFloat64,
	weightedSum,
	zeros,
};
