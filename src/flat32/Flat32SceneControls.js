import DistanceMath from '../algorithm32/math/DistanceMath.js';
import {ATMOSPHERE_OBSERVER_HEIGHT} from './consts.js';

/** Canonical sky, physical observer height and illustrative Sun presentation controls. */
export const Flat32SceneControls = {
	/** Call this method to resolve current controls, including existing boolean shader callers.
	 * Invalid render modes, legacy booleans, Sun fractions or unsupported heights throw; correct the input before scene preparation.
	 *
	 * @param {Flat32SceneControlConfiguration} [configuration] - Explicit choices; omission retains Full, 5 m and both Sun fractions at one.
	 * @returns {Flat32SceneControlSelection} - Canonical sky, Sun choices and a fresh unit-bearing height.
	 */
	resolve(configuration = {}) {
		if (
			configuration.atmosphereShaderEnabled !== undefined &&
			typeof configuration.atmosphereShaderEnabled !== 'boolean'
		)
			throw new TypeError('Flat32 atmosphere shader selection must be boolean.');
		const skyRenderMode =
			configuration.skyRenderMode ?? (configuration.atmosphereShaderEnabled === false ? 'shader-off' : 'full');
		if (!['full', 'no-atmosphere', 'shader-off'].includes(skyRenderMode))
			throw new RangeError('Flat32 sky render mode is unsupported.');
		const height = DistanceMath.toMeters(configuration.observerHeight ?? ATMOSPHERE_OBSERVER_HEIGHT);
		if (![5, 500, 2000].includes(height))
			throw new RangeError('Flat32 observer height must be 5 m, 500 m or 2 km.');
		return {
			skyRenderMode,
			observerHeight: DistanceMath.inMeters(height),
			...this.resolveSunPresentation(configuration),
		};
	},
	/** Call this method to accept independent No-atmosphere Sun presentation controls.
	 * Nonfinite or out-of-range scales throw RangeError before mutation; supply 0-1 fractions.
	 * @param {Flat32SunPresentationConfiguration} [configuration] - Omitted fractions retain ordinary brightness.
	 * @returns {Flat32SunPresentationSelection} - Complete validated illumination and disc fractions.
	 */
	resolveSunPresentation(configuration = {}) {
		const sunIlluminationScale =
			configuration.sunIlluminationScale === undefined ? 1 : configuration.sunIlluminationScale;
		const sunDiscBrightnessScale =
			configuration.sunDiscBrightnessScale === undefined ? 1 : configuration.sunDiscBrightnessScale;
		for (const scale of [sunIlluminationScale, sunDiscBrightnessScale]) {
			if (!Number.isFinite(scale) || scale < 0 || scale > 1)
				throw new RangeError('Flat32 Sun presentation scales must be finite values from 0 to 1.');
		}
		return {sunIlluminationScale, sunDiscBrightnessScale};
	},
};
