/** Stable identity of the contained CR6A one-pixel presentation calibration. */
export const CR6A_STELLAR_PRESENTATION_SCALE_ID =
	'stellar-one-pixel-presentation-scale-bracket-v1';

/** Existing accepted one-pixel irradiance-to-boundary-radiance calibration. */
export const CR6A_BASE_BOUNDARY_SCALE = 60999.839486002405;

/** The complete predeclared CR6A bracket, in fixed review order. */
export const CR6A_PRESENTATION_MULTIPLIERS = Object.freeze([1, 2, 4]);

/**
 * Accept one predeclared, wavelength-independent presentation multiplier.
 *
 * @param {number} value
 * @returns {number}
 */
export function acceptCr6aPresentationMultiplier(value) {
	if (!CR6A_PRESENTATION_MULTIPLIERS.includes(value)) {
		throw new RangeError('CR6A presentation multiplier must be exactly 1, 2, or 4.');
	}
	return value;
}

/**
 * Return the algebraically equivalent one-pixel boundary calibration.
 *
 * @param {number} multiplier
 * @returns {number}
 */
export function cr6aEffectiveBoundaryScale(multiplier) {
	return CR6A_BASE_BOUNDARY_SCALE * acceptCr6aPresentationMultiplier(multiplier);
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
export function composeCr6aLinearRgb(
	skyLinearRgb,
	transportedStarLinearRgb,
	multiplier,
) {
	const q = acceptCr6aPresentationMultiplier(multiplier);
	if (skyLinearRgb?.length !== 3 || transportedStarLinearRgb?.length !== 3) {
		throw new RangeError('CR6A composition inputs must each contain exactly three channels.');
	}
	const result = /** @type {[number, number, number]} */ ([0, 0, 0]);
	for (let channel = 0; channel < 3; channel += 1) {
		const sky = Number(skyLinearRgb[channel]);
		const star = Number(transportedStarLinearRgb[channel]);
		if (!Number.isFinite(sky) || !Number.isFinite(star)) {
			throw new TypeError('CR6A composition inputs must be finite.');
		}
		const composed = sky + q * star;
		if (!Number.isFinite(composed)) {
			throw new RangeError('CR6A composed linear RGB must remain finite.');
		}
		result[channel] = composed;
	}
	return result;
}
