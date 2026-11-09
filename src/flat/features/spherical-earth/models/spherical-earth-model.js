import {Service} from '@polylith/core';
import DistanceMath from '../../../../algorithm32/math/DistanceMath.js';
import {SphericalSolarEvents} from '../solar-events.js';

/**
 * Owns the feature's independently scoped camera settings and maps shared configuration into engine observations.
 *
 * @implements {SphericalEarthModelService}
 */
export class SphericalEarthModel extends Service {
	/**
	 * Registers the feature's scoped canonical camera capability.
	 *
	 * @param {unknown} registry - Optional isolated application registry.
	 */
	constructor(registry) {
		super('spherical-earth-model', registry);
		this.implement([
			'start',
			'stop',
			'open',
			'close',
			'getCamera',
			'getShaderOptions',
			'setSkyRenderMode',
			'setOrientation',
			'toggleCompass',
			'setFieldOfView',
			'resolveHeight',
			'acceptHeight',
			'getObservation',
			'getSolarEvents',
		]);
	}

	/**
	 * Call this method to initialize this application's view records before readiness.
	 */
	start() {
		/** @type {Map<string, SphericalEarthCameraValues>} */
		this.cameras = new Map();
		/** @type {Map<string, SphericalEarthSkyRenderMode>} */
		this.skyModes = new Map();
		/** @type {Map<string, SphericalSolarEventCacheEntry>} */
		this.solarEvents = new Map();
	}

	/**
	 * Call this method to release all camera records when the application stops.
	 */
	stop() {
		this.cameras?.clear();
		this.skyModes?.clear();
		this.solarEvents?.clear();
	}

	/**
	 * Call this method to initialize independent camera defaults for a newly mounted view.
	 *
	 * @param {string} viewId - Exact mounted view identity.
	 */
	open(viewId) {
		this.cameras.set(viewId, {
			observerHeightMeters: 5,
			fieldOfViewDegrees: 50,
			orientation: [0, 0, 0, 1],
			compassVisible: false,
		});
		this.skyModes.set(viewId, 'full');
	}

	/**
	 * Call this method to release only the camera record belonging to the closed view.
	 *
	 * @param {string} viewId - Exact released view identity.
	 */
	close(viewId) {
		this.cameras.delete(viewId);
		this.skyModes.delete(viewId);
		this.solarEvents.delete(viewId);
	}

	/**
	 * Call this method to obtain date/location/elevation events without recalculating them for camera movement.
	 *
	 * @param {string} viewId - Exact mounted view identity.
	 * @param {ApplicationConfiguration} configuration - Accepted shared date and location.
	 * @param {number} observerHeightMeters - Latest requested view elevation in meters.
	 * @returns {SphericalSolarEventTimes} - Available event instants, or null entries before a location is selected.
	 */
	getSolarEvents(viewId, configuration, observerHeightMeters) {
		if (!configuration.location || configuration.timestamp == null) {
			return {sunrise: null, 'solar-noon': null, sunset: null};
		}
		let date = new Date(configuration.timestamp);
		date.setHours(0, 0, 0, 0);
		let dayStart = date.getTime();
		date.setDate(date.getDate() + 1);
		let request = {
			dayStart,
			dayEnd: date.getTime(),
			latitude: configuration.location.latitude,
			longitude: configuration.location.longitude,
			observerHeightMeters,
		};
		let cached = this.solarEvents.get(viewId);
		if (!cached || Object.keys(request).some((key) => request[key] !== cached[key])) {
			cached = {...request, events: SphericalSolarEvents.calculate(request)};
			this.solarEvents.set(viewId, cached);
		}
		return {...cached.events};
	}

	/**
	 * Call this method to project one view's selected mode, Sun presentation and neutral ground-fill policy.
	 *
	 * @param {string} viewId - Exact mounted view identity.
	 * @returns {SphericalEarthShaderOptions} - Derived composition switches, Sun multipliers and ambient reference.
	 */
	getShaderOptions(viewId) {
		this._camera(viewId);
		let mode = this.skyModes.get(viewId);
		return {
			mode,
			atmosphereEnabled: mode === 'full',
			sunIlluminationScale: mode === 'full' ? 1 : 0,
			sunDiscBrightnessScale: 1,
			ambientLightIntensity: mode === 'full' ? 0 : mode === 'shader-off' ? 1 : 0.03,
		};
	}

	/**
	 * Call this method to select one view's presentation without changing physical cache inputs.
	 *
	 * @param {string} viewId - Exact mounted view identity.
	 * @param {SphericalEarthSkyRenderMode} mode - Supported presentation selection.
	 * @throws {RangeError} - The requested mode is not supported.
	 */
	setSkyRenderMode(viewId, mode) {
		this._camera(viewId);
		if (!['full', 'no-atmosphere', 'shader-off'].includes(mode)) {
			throw new RangeError('Unsupported Spherical Earth sky render mode.');
		}
		this.skyModes.set(viewId, mode);
	}

	/**
	 * Called by scoped operations to require an owned camera record.
	 *
	 * @param {string} viewId - Exact mounted view identity.
	 * @param {string} viewId - Exact mounted view identity.
	 * @returns {SphericalEarthCameraValues} - Canonical camera record.
	 * @throws {Error} - The view has been released or never mounted.
	 */
	_camera(viewId) {
		let camera = this.cameras.get(viewId);
		if (!camera) {
			throw new Error(`Unknown Spherical Earth view: ${viewId}`);
		}
		return camera;
	}

	/**
	 * Call this method to read independent camera values for presentation.
	 *
	 * @param {string} viewId - Exact mounted view identity.
	 * @returns {SphericalEarthCameraValues} - Accepted height, framing and orientation.
	 */
	getCamera(viewId) {
		let camera = this._camera(viewId);
		return {...camera, orientation: [...camera.orientation]};
	}

	/**
	 * Call this method to retain the accepted rendered camera orientation across scene updates and retry.
	 *
	 * @param {string} viewId - Exact mounted view identity.
	 * @param {SphericalEarthCameraOrientation} orientation - Renderer-produced unit quaternion.
	 */
	setOrientation(viewId, orientation) {
		this._camera(viewId).orientation = [...orientation];
	}

	/**
	 * Call this method to toggle only this view's directional ribbon.
	 *
	 * @param {string} viewId - Exact mounted view identity.
	 */
	toggleCompass(viewId) {
		let camera = this._camera(viewId);
		camera.compassVisible = !camera.compassVisible;
	}

	/**
	 * Call this method to accept a perspective FOV without clamping or choosing a different projection.
	 *
	 * @param {string} viewId - Exact mounted view identity.
	 * @param {number} degrees - Vertical field of view in degrees.
	 * @throws {RangeError} - The angle is nonfinite or outside (0, 180).
	 */
	setFieldOfView(viewId, degrees) {
		if (!Number.isFinite(degrees) || degrees <= 0 || degrees >= 180) {
			throw new RangeError('Vertical FOV must be greater than zero and less than 180 degrees.');
		}
		this._camera(viewId).fieldOfViewDegrees = degrees;
	}

	/**
	 * Call this method to normalize an elevation request before preparing its physical scene.
	 *
	 * @param {Distance} height - Requested distance above the flat ground.
	 * @returns {Distance} - Independent nonnegative height in meters; engine geometry validates physical support.
	 * @throws {RangeError} - Height is nonfinite or below ground.
	 */
	resolveHeight(height) {
		let meters = DistanceMath.toMeters(height);
		if (!Number.isFinite(meters) || meters < 0) {
			throw new RangeError('Observer height must be finite and above ground.');
		}
		return {value: meters, units: 'meters'};
	}

	/**
	 * Call this method after complete frame publication to accept the new elevation.
	 *
	 * @param {string} viewId - Exact mounted view identity.
	 * @param {Distance} height - Height belonging to the successfully displayed frame.
	 */
	acceptHeight(viewId, height) {
		this._camera(viewId).observerHeightMeters = this.resolveHeight(height).value;
	}

	/**
	 * Call this method to derive an exact engine observation from shared location and current time.
	 *
	 * @param {ApplicationConfiguration} configuration - Current application configuration snapshot.
	 * @returns {GeometryObservation|null} - Unit-bearing observation, or null until location/time are available.
	 */
	getObservation({location, timestamp}) {
		if (!location || timestamp == null) {
			return null;
		}
		return {
			instant: new Date(timestamp).toISOString(),
			location: {
				latitude: {value: location.latitude, units: 'degrees'},
				longitude: {value: location.longitude, units: 'degrees'},
			},
		};
	}
}

new SphericalEarthModel();
