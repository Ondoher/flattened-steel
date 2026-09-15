/** Query only numeric-format metadata; no shader, draw or recurrence is executed.
 * @param {WebGL2RenderingContext} gl - Actual target context.
 * @returns {SkyGroundArithmeticPrecision} Explicit storage-conversion prerequisite.
 */
export function queryGroundArithmeticPrecision(gl) {
	const low = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.LOW_FLOAT),
		high = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
	if (!low || !high) throw new Error('Shader numeric-format metadata is unavailable.');
	const evidence = {
		schemaId: 'sky-ground-arithmetic-precision-v1',
		low: {rangeMin: low.rangeMin, rangeMax: low.rangeMax, precision: low.precision},
		high: {rangeMin: high.rangeMin, rangeMax: high.rangeMax, precision: high.precision},
	};
	assertGroundArithmeticPrecision(evidence);
	return evidence;
}
/** Require actual lowp and highp storage able to represent the declared normal operand range to at least one part in2^23.
 * Conversion uncertainty and subnormal flushing remain included by the arithmetic plan's separate absolute allowance.
 * @param {SkyGroundArithmeticPrecision} evidence - Recorded same-context numeric formats.
 * @returns {void} Incompatible formats stop before expensive recurrence work.
 */
export function assertGroundArithmeticPrecision(evidence) {
	if (evidence?.schemaId !== 'sky-ground-arithmetic-precision-v1')
		throw new Error('Ground arithmetic precision schema changed.');
	for (const format of [evidence.low, evidence.high])
		if (
			!format ||
			!Number.isInteger(format.precision) ||
			format.precision < 23 ||
			!Number.isInteger(format.rangeMin) ||
			format.rangeMin < 126 ||
			!Number.isInteger(format.rangeMax) ||
			format.rangeMax < 127
		)
			throw new Error(
				'Ground arithmetic requires advertised binary32-representable LOW_FLOAT and HIGH_FLOAT storage.',
			);
}
