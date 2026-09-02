/** Stable identity of the contained CR6C one-pixel brightness calibration. */
export const CR6C_ONE_PIXEL_BRIGHTNESS_CALIBRATION_ID =
	'stellar-one-pixel-brightness-calibration-v1';

/** Existing accepted one-pixel irradiance-to-boundary-radiance calibration. */
export const CR6C_BASE_BOUNDARY_SCALE = 60999.839486002405;

/** The complete predeclared CR6C bracket, in fixed review order. */
export const CR6C_BRIGHTNESS_MULTIPLIERS = Object.freeze([1, 16, 32]);

/**
 * Accept one predeclared, wavelength-independent presentation multiplier.
 *
 * @param {number} value
 * @returns {number}
 */
export function acceptCr6cBrightnessMultiplier(value) {
	if (!CR6C_BRIGHTNESS_MULTIPLIERS.includes(value)) {
		throw new RangeError('CR6C brightness multiplier must be exactly 1, 16, or 32.');
	}
	return value;
}

/**
 * Return the algebraically equivalent one-pixel boundary calibration.
 *
 * @param {number} multiplier
 * @returns {number}
 */
export function cr6cEffectiveBoundaryScale(multiplier) {
	return CR6C_BASE_BOUNDARY_SCALE * acceptCr6cBrightnessMultiplier(multiplier);
}

/**
 * Compose one signed projected linear-RGB pixel. This changes point
 * presentation only; source irradiance, transport, projection, and Color are
 * already complete in the two inputs.
 *
 * @param {ArrayLike<number>} skyLinearRgb
 * @param {ArrayLike<number>} transportedStarLinearRgb
 * @param {number} multiplier
 * @returns {[number, number, number]}
 */
export function composeCr6cLinearRgb(
	skyLinearRgb,
	transportedStarLinearRgb,
	multiplier,
) {
	const q = acceptCr6cBrightnessMultiplier(multiplier);
	if (skyLinearRgb?.length !== 3 || transportedStarLinearRgb?.length !== 3) {
		throw new RangeError('CR6C composition inputs must each contain exactly three channels.');
	}
	const result = /** @type {[number, number, number]} */ ([0, 0, 0]);
	for (let channel = 0; channel < 3; channel += 1) {
		const sky = Number(skyLinearRgb[channel]);
		const star = Number(transportedStarLinearRgb[channel]);
		if (!Number.isFinite(sky) || !Number.isFinite(star)) {
			throw new TypeError('CR6C composition inputs must be finite.');
		}
		const composed = sky + q * star;
		if (!Number.isFinite(composed)) {
			throw new RangeError('CR6C composed linear RGB must remain finite.');
		}
		result[channel] = composed;
	}
	return result;
}
