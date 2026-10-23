/** Baseline p2 response, with parameter authority supplied by authenticated controls. */
export function gainAt(illuminance, curve) {
	const base = 1 + curve.sunsetAmplitude / (1 + (illuminance / curve.sunsetTransitionIlluminanceLux) ** curve.sunsetRolloffPower);
	const x = Math.log(curve.adaptationPivotIlluminanceLux / (illuminance + curve.adaptationFloorIlluminanceLux)) / curve.adaptationSoftnessLogUnits;
	const soft = Math.max(x, 0) + Math.log1p(Math.exp(-Math.abs(x)));
	return base * Math.exp(curve.adaptationExponent * curve.adaptationSoftnessLogUnits * soft);
}

/** Project one finite pre-tone channel into the production exponential display boundary. */
export function encodeChannel(value, gain, k) {
	return Math.round(255 * Math.max(0, Math.min(1, -Math.expm1(-Math.max(0, value * gain) * k))));
}

/** Flip a raw bottom-origin framebuffer into top-origin image/array order. */
export function flipRows(bytes, width, height, bytesPerPixel) {
	const result = Buffer.alloc(bytes.length), stride = width * bytesPerPixel;
	for (let row = 0; row < height; row++) bytes.copy(result, row * stride, (height - row - 1) * stride, (height - row) * stride);
	return result;
}
