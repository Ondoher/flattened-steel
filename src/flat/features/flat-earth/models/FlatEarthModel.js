import {Service} from '@polylith/core';
import DistanceMath from '../../../../algorithm32/math/DistanceMath.js';

/**
 * Owns the feature's independently scoped camera settings and maps shared configuration into engine observations.
 *
 * @implements {FlatEarthModelService}
 */
export class FlatEarthModel extends Service {
	/**
	 * Registers the feature's scoped canonical camera capability.
	 *
	 * @param {unknown} registry - Optional isolated application registry.
	 */
	constructor(registry) {
		super('flat-earth-model', registry);
		this.implement([
			'start',
			'stop',
			'open',
			'close',
			'getCamera',
			'setOrientation',
			'setFieldOfView',
			'resolveHeight',
			'acceptHeight',
			'getObservation',
		]);
	}

	/**
	 * Call this method to initialize this application's view records before readiness.
	 */
	start() {
		/** @type {Map<string, FlatEarthCameraValues>} */
		this.cameras = new Map();
	}

	/**
	 * Call this method to release all camera records when the application stops.
	 */
	stop() {
		this.cameras?.clear();
	}

	/**
	 * Call this method to initialize independent camera defaults for a newly mounted view.
	 *
	 * @param {string} viewId - Exact mounted view identity.
	 */
	open(viewId) {
		this.cameras.set(viewId, {observerHeightMeters: 5, fieldOfViewDegrees: 50, orientation: [0, 0, 0, 1]});
	}

	/**
	 * Call this method to release only the camera record belonging to the closed view.
	 *
	 * @param {string} viewId - Exact released view identity.
	 */
	close(viewId) {
		this.cameras.delete(viewId);
	}

	/**
	 * Called by scoped operations to require an owned camera record.
	 *
	 * @param {string} viewId - Exact mounted view identity.
	 * @param {string} viewId - Exact mounted view identity.
	 * @returns {FlatEarthCameraValues} - Canonical camera record.
	 * @throws {Error} - The view has been released or never mounted.
	 */
	_camera(viewId) {
		let camera = this.cameras.get(viewId);
		if (!camera) {
			throw new Error(`Unknown Flat Earth view: ${viewId}`);
		}
		return camera;
	}

	/**
	 * Call this method to read independent camera values for presentation.
	 *
	 * @param {string} viewId - Exact mounted view identity.
	 * @returns {FlatEarthCameraValues} - Accepted height, framing and orientation.
	 */
	getCamera(viewId) {
		let camera = this._camera(viewId);
		return {...camera, orientation: [...camera.orientation]};
	}

	/**
	 * Call this method to retain the accepted rendered camera orientation across scene updates and retry.
	 *
	 * @param {string} viewId - Exact mounted view identity.
	 * @param {FlatEarthCameraOrientation} orientation - Renderer-produced unit quaternion.
	 */
	setOrientation(viewId, orientation) {
		this._camera(viewId).orientation = [...orientation];
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

new FlatEarthModel();
