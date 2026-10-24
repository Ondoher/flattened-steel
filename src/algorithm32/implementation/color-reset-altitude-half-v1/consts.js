/** Versioned display response promoted from the completed twilight exposure study. */
export const COLOR_RESET_ALTITUDE_HALF_V1_ID = 'color-reset-altitude-half-v1';
/** Separate display-control binding; never a physical receiver measurement. */
export const DISPLAY_ADAPTATION_ILLUMINANCE_VALUE_KEY = 'color.displayAdaptationIlluminance.value';
/** Shader input for the CPU-prepared display-control illuminance. */
export const DISPLAY_ADAPTATION_ILLUMINANCE_UNIFORM = 'uColorResetDisplayAdaptationIlluminanceLux';

/** Fixed accepted altitude-half parameters; physical optics remain unchanged.
 * @type {ColorResetAltitudeHalfResponse}
 */
export const COLOR_RESET_ALTITUDE_HALF_RESPONSE = {
	heightStart: {value: 10000, units: 'meters'},
	heightEnd: {value: 40000, units: 'meters'},
	lift: {value: 11.031121053719228, units: 'lux'},
	activation: {value: 0.00007870837738151098, units: 'lux'},
	taperStart: {value: 88.28045178070643, units: 'lux'},
	taperEnd: {value: 385, units: 'lux'},
};
