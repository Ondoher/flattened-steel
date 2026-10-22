import DistanceMath from '../algorithm32/math/DistanceMath.js';
import {ATMOSPHERE_OBSERVER_HEIGHT} from './consts.js';

/** Canonical initial sky selection and physical observer-height acceptance. */
export const Flat32SceneControls = {
	/** Call this method to resolve current controls, including existing boolean shader callers.
	 * Invalid render modes, legacy booleans or unsupported heights throw; correct the input before scene preparation.
	 *
	 * @param {Flat32SceneControlConfiguration} [configuration] - Explicit choices; omission retains Full and 5 m.
	 * @returns {Flat32SceneControlSelection} - Canonical render mode and a fresh unit-bearing height.
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
		return {skyRenderMode, observerHeight: DistanceMath.inMeters(height)};
	},
};
