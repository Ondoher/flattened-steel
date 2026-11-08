import {Service} from '@polylith/core';
import {SphericalEarthGeometry} from '../../../../algorithm32/implementation/spherical-earth/SphericalEarthGeometry.js';
import {DEFAULT_NATIVE_PRODUCTION_PROFILE} from '../../../../algorithm32/profiles/native-15/native-15-profile.js';
import AngleMath from '../../../../algorithm32/math/AngleMath.js';

/**
 * Per-view state and physical observation derivation for the spherical page.
 *
 * @implements {SphericalEarthModelService}
 */
export class SphericalEarthModel extends Service {
	/**
	 * Creates the registered model-service.
	 *
	 * @param {unknown} registry - Owning application registry.
	 */
	constructor(registry) {
		super('spherical-earth-model', registry);
		this.states = new Map();
		this.implement(['get', 'set', 'remove', 'getSolarZenith']);
	}

	/**
	 * Call this method to read a defensive view state.
	 *
	 * @param {string} viewId - Owning view.
	 * @returns {SphericalEarthPageState} - Current state or the unselected-location state.
	 */
	get(viewId) {
		return {...(this.states.get(viewId) ?? {status: 'missing-location', preparation: null})};
	}

	/**
	 * Call this method to accept one view's current state.
	 *
	 * @param {string} viewId - Owning view.
	 * @param {SphericalEarthPageState} state - Complete presentation facts.
	 */
	set(viewId, state) {
		this.states.set(viewId, {...state});
	}

	/**
	 * Call this method to release a closed view's state.
	 *
	 * @param {string} viewId - Retired view.
	 */
	remove(viewId) {
		this.states.delete(viewId);
	}

	/**
	 * Call this method to derive the spherical cache angle from shared accepted coordinates and time.
	 *
	 * @param {ApplicationConfiguration} configuration - Shared accepted values.
	 * @returns {number|null} - Solar zenith in degrees, or null until location/time exist.
	 */
	getSolarZenith({location, timestamp}) {
		if (!location || timestamp == null) {
			return null;
		}
		let physical = DEFAULT_NATIVE_PRODUCTION_PROFILE.physical.geometry;
		let geometry = new SphericalEarthGeometry({
			bottomRadius: physical.bottomRadius,
			topRadius: physical.topRadius,
			observerHeight: {value: 5, units: 'meters'},
			observerUpDirection: [0, 0, 1],
			sceneFrame: {kind: 'observer-local'},
		});
		let state = geometry.resolveDistantSunSceneState({
			instant: new Date(timestamp).toISOString(),
			location: {
				latitude: {value: location.latitude, units: 'degrees'},
				longitude: {value: location.longitude, units: 'degrees'},
			},
		});
		return AngleMath.toDegrees(state.observerSolarZenith);
	}
}

new SphericalEarthModel();
