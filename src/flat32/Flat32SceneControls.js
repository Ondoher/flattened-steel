import DistanceMath from '../algorithm32/math/DistanceMath.js';
import {ATMOSPHERE_OBSERVER_HEIGHT, CAMERA_FIELD_OF_VIEW_DEGREES} from './consts.js';

/** Canonical sky, observer height, camera framing and illustrative Sun presentation controls. */
export const Flat32SceneControls = {
	/** Call this method to resolve current controls, including existing boolean shader callers.
	 * Invalid render modes, legacy booleans, FOV, Sun fractions or unsupported heights throw; correct the input before scene preparation.
	 *
	 * @param {Flat32SceneControlConfiguration} [configuration] - Explicit choices; omission retains Full, 5 m, 50-degree vertical FOV and both Sun fractions at one.
	 * @returns {Flat32SceneControlSelection} - Canonical sky, framing, Sun choices and a fresh unit-bearing height.
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
		if (![5, 100, 500, 2000, 10000, 40000].includes(height))
			throw new RangeError('Flat32 observer height must be 5 m, 100 m, 500 m, 2 km, 10 km or 40 km.');
		return {
			skyRenderMode,
			observerHeight: DistanceMath.inMeters(height),
			cameraFieldOfViewDegrees: this.resolveFieldOfView(
				configuration.cameraFieldOfViewDegrees === undefined
					? CAMERA_FIELD_OF_VIEW_DEGREES
					: configuration.cameraFieldOfViewDegrees,
			),
			...this.resolveSunPresentation(configuration),
		};
	},
	/** Accept a vertical perspective field of view, in degrees.
	 * @param {number} degrees - Finite angle strictly between zero and 180.
	 * @returns {number} - Accepted angle, without clamping.
	 * @throws {RangeError} - Invalid or panoramic angles require a different input or projection.
	 */
	resolveFieldOfView(degrees) {
		if (!Number.isFinite(degrees) || degrees <= 0 || degrees >= 180)
			throw new RangeError('Vertical perspective FOV must be greater than 0° and less than 180°.');
		return degrees;
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
