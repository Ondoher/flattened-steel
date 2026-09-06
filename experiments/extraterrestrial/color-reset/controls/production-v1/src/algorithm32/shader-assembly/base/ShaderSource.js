/**
 * Called by this module to format one finite number for deterministic GLSL source. It returns the value from the first satisfied branch, otherwise the operation's final fallback.
 *
 * @param {number} value - The accepted number.
 * @returns {string} - The GLSL numeric source.
 */
function formatFloat(value) {
	if (Number.isInteger(value)) {
		return value.toFixed(1);
	}

	return Number(value).toPrecision(12);
}

/**
 * Called by this module to format numeric array entries for deterministic GLSL source.
 *
 * @param {readonly number[]} values - The accepted numeric entries.
 * @returns {string} - The comma-separated GLSL numeric source.
 *
 */
function formatFloatArray(values) {
	return values
		.map(
			/**
			 * Called by Array.prototype.map to transform one collection value.
			 * @param value - The value accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ (value) => formatFloat(value),
		)
		.join(', ');
}

/**
 * Called by this module to format one three-component GLSL vector.
 *
 * @param {readonly number[]} values - The vector values.
 * @returns {string} - The formatted GLSL vector source.
 *
 */
function formatVec3(values) {
	return `vec3(${formatFloatArray(values)})`;
}

/** Deterministic GLSL value-source formatting methods. */
export const ShaderSource = {
	formatFloat,
	formatFloatArray,
	formatVec3,
};
