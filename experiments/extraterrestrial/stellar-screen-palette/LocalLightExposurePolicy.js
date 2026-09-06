/** Photopic luminance at and above which fixed Bruneton remains the exact baseline. */
const PHOTOPIC_BASELINE_LUMINANCE = 5;

/** Published Ward visibility-model offset used by production. */
const WARD_VISIBILITY_OFFSET = 1.219;

/** Published Ward luminance exponent used by production. */
const WARD_LUMINANCE_EXPONENT = 0.4;

/** Published Ward visibility-gain exponent used by production. */
const WARD_GAIN_EXPONENT = 2.5;

/**
 * Contained adaptation of production LocalLightLevelCalculator's exposure-only
 * boundary. It intentionally excludes light measurement, atmosphere, and
 * temporal smoothing.
 */
export class LocalLightExposurePolicy {
	deriveExposureModifier(adaptingLuminanceProxy) {
		if (!adaptingLuminanceProxy || typeof adaptingLuminanceProxy !== 'object') {
			throw new TypeError('adaptingLuminanceProxy is required.');
		}
		if (adaptingLuminanceProxy.units !== 'cd m^-2') {
			throw new TypeError('adaptingLuminanceProxy.units must be "cd m^-2".');
		}
		const luminance = adaptingLuminanceProxy.value;
		if (!Number.isFinite(luminance) || luminance < 0) {
			throw new RangeError('adaptingLuminanceProxy.value must be finite and nonnegative.');
		}
		if (luminance >= PHOTOPIC_BASELINE_LUMINANCE) return 1;
		const baselineVisibility = WARD_VISIBILITY_OFFSET
			+ PHOTOPIC_BASELINE_LUMINANCE ** WARD_LUMINANCE_EXPONENT;
		const localVisibility = WARD_VISIBILITY_OFFSET + luminance ** WARD_LUMINANCE_EXPONENT;
		return (baselineVisibility / localVisibility) ** WARD_GAIN_EXPONENT;
	}

	modifyExposure({baselineExposure, exposureModifier = 1}) {
		if (!Number.isFinite(baselineExposure) || baselineExposure <= 0) {
			throw new RangeError('baselineExposure must be positive and finite.');
		}
		if (!Number.isFinite(exposureModifier) || exposureModifier <= 0) {
			throw new RangeError('exposureModifier must be positive and finite.');
		}
		const effectiveExposure = baselineExposure * exposureModifier;
		if (!Number.isFinite(effectiveExposure) || effectiveExposure <= 0) {
			throw new RangeError('Modified exposure must be positive and finite.');
		}
		return {baselineExposure, exposureModifier, effectiveExposure};
	}
}

export const LOCAL_LIGHT_EXPOSURE_POLICY_CONTRACT = Object.freeze({
	id: 'production-local-light-exposure-policy-contained-adaptation-v1',
	photopicBaselineLuminance: {value: PHOTOPIC_BASELINE_LUMINANCE, units: 'cd m^-2'},
	wardVisibilityOffset: WARD_VISIBILITY_OFFSET,
	wardLuminanceExponent: WARD_LUMINANCE_EXPONENT,
	wardGainExponent: WARD_GAIN_EXPONENT,
	temporalSmoothing: false,
	secondarySources: false,
	application: 'multiply unchanged Bruneton Figure-1 coefficient by one positive achromatic modifier',
});
