/** Stable production identity of the separately selectable slope-078/p2 response. */
export const COLOR_RESET_SLOPE_078_P2_ID = 'color-reset-slope-078-p2';

/** Fixed response with a positive illuminance-times-gain slope.
 *
 * @type {ColorResetSlope078Curve}
 */
export const COLOR_RESET_SLOPE_078_P2_CURVE = {
	sunsetAmplitude: 3.5,
	sunsetTransitionIlluminanceLux: 980,
	sunsetRolloffPower: 2,
	adaptationPivotIlluminanceLux: 385,
	adaptationFloorIlluminanceLux: 0.02,
	adaptationSoftnessLogUnits: 0.1,
	adaptationExponent: 0.78,
};
