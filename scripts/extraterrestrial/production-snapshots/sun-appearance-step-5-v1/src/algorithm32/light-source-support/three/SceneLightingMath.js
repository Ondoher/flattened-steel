import {ValueValidation} from '../../validation/ValueValidation.js';

/**
 * Called by this module to clamp a trusted calculation result to the unit interval.
 *
 * @param {number} value - The calculated value.
 * @returns {number} - The clamped value.
 *
 */
function clamp01(value) {
	return Math.min(1, Math.max(0, value));
}

/**
 * Called by this module to accept optional scene ambient-intensity bounds.
 *
 * @param {unknown} range - The optional requested range.
 * @param {number} defaultMin - The default minimum intensity.
 * @param {number} defaultMax - The default maximum intensity.
 * @returns {LightSourceSceneAmbientIntensityBounds} - The accepted range.
 * @throws {RangeError} - When an accepted value is outside the supported range.
 */
function ambientIntensityRangeOrDefault(range, defaultMin, defaultMax) {
	const candidate = /** @type {{ min?: unknown, max?: unknown }} */ (range === undefined ? {} : range);

	const min = ValueValidation.finiteNumberOrDefault(candidate.min, defaultMin, 'ambientIntensityRange.min');
	const max = ValueValidation.finiteNumberOrDefault(candidate.max, defaultMax, 'ambientIntensityRange.max');

	if (min < 0) {
		throw new RangeError('ambientIntensityRange.min must be non-negative.');
	}
	if (max < min) {
		throw new RangeError('ambientIntensityRange.max must be greater than or equal to min.');
	}

	return {min, max};
}

/**
 * Called by this module to scale a unit percentage into an accepted intensity range.
 *
 * @param {LightSourceSceneAmbientIntensityBounds} range - The minimum and maximum bounds.
 * @param {number} percent - The calculated unit percentage.
 * @returns {number} - The scaled value.
 *
 */
function scaleRange(range, percent) {
	return range.min + (range.max - range.min) * clamp01(percent);
}

/** Scene-light intensity range acceptance and scaling methods. */
export const SceneLightingMath = {
	ambientIntensityRangeOrDefault,
	clamp01,
	scaleRange,
};
