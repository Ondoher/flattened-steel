import {SphericalEarthGeometry} from '../../../algorithm32/implementation/spherical-earth/SphericalEarthGeometry.js';
import {DEFAULT_NATIVE_PRODUCTION_PROFILE} from '../../../algorithm32/profiles/native-15/native-15-profile.js';

/**
 * Geometric solar events for the selected device-local calendar date and requested Globe elevation.
 */
export class SphericalSolarEvents {
	/**
	 * Shared apparent Sun radius used by both rendering and event selection, in radians.
	 */
	static angularRadiusRadians = 0.004675;

	/**
	 * Call this method to find visible upper-limb horizon crossings and upper meridian passage.
	 * Missing events remain null, including polar day or night. No atmospheric refraction is added.
	 *
	 * @param {SphericalSolarEventRequest} request - Exact date bounds, location and elevation.
	 * @returns {SphericalSolarEventTimes} - Shared-clock instants within the selected calendar date.
	 */
	static calculate(request) {
		let physical = DEFAULT_NATIVE_PRODUCTION_PROFILE.physical.geometry;
		let geometry = new SphericalEarthGeometry({
			bottomRadius: physical.bottomRadius,
			topRadius: physical.topRadius,
			observerHeight: {value: request.observerHeightMeters, units: 'meters'},
			observerUpDirection: [0, 0, 1],
			sceneFrame: {kind: 'observer-local'},
		});
		let sample = (timestamp) =>
			geometry.resolveDistantSunSceneState({
				instant: new Date(timestamp).toISOString(),
				location: {
					latitude: {value: request.latitude, units: 'degrees'},
					longitude: {value: request.longitude, units: 'degrees'},
				},
			}).directionToSourceModel;
		let meridian = (timestamp) => -sample(timestamp)[0];
		let latitude = (request.latitude * Math.PI) / 180;
		let points = [request.dayStart];
		for (let time = request.dayStart + 1800000; time < request.dayEnd; time += 1800000) {
			points.push(time);
		}
		points.push(request.dayEnd);
		let extrema = [];
		/** @type {SphericalSolarEventTimes} */
		let events = {sunrise: null, 'solar-noon': null, sunset: null};
		for (let index = 1; index < points.length; index++) {
			let start = points[index - 1],
				end = points[index];
			let a = meridian(start),
				b = meridian(end);
			if (a === 0 || a * b < 0) {
				let time = this._crossing(meridian, start, end);
				extrema.push(time);
				let direction = sample(time);
				let noonSide = direction[2] * Math.cos(latitude) - direction[1] * Math.sin(latitude);
				if (noonSide > 0 && time < request.dayEnd) {
					events['solar-noon'] = time;
				}
			}
		}
		// Include meridian extrema so even a brief polar sunrise/sunset pair is bracketed.
		points = [...new Set([...points, ...extrema])].sort((a, b) => a - b);
		let dip = Math.acos(physical.bottomRadius.value / (physical.bottomRadius.value + request.observerHeightMeters));
		let horizon = (timestamp) => sample(timestamp)[2] + Math.sin(dip + this.angularRadiusRadians);
		for (let index = 1; index < points.length; index++) {
			let start = points[index - 1],
				end = points[index];
			let a = horizon(start),
				b = horizon(end);
			if ((a < 0 && b >= 0) || (a > 0 && b <= 0)) {
				let time = this._crossing(horizon, start, end);
				if (time < request.dayEnd) {
					let kind = a < b ? 'sunrise' : 'sunset';
					events[kind] = time;
				}
			}
		}
		return events;
	}

	/**
	 * Called by event selection to refine a bracketed crossing to one millisecond.
	 *
	 * @param {(timestamp: number) => number} value - Signed geometric event function.
	 * @param {number} start - Lower timestamp bound in milliseconds.
	 * @param {number} end - Upper timestamp bound in milliseconds.
	 * @returns {number} - Crossing instant in epoch milliseconds.
	 */
	static _crossing(value, start, end) {
		let a = value(start);
		if (a === 0) {
			return start;
		}
		while (end - start > 1) {
			let middle = Math.floor((start + end) / 2);
			let b = value(middle);
			if (a * b <= 0) {
				end = middle;
			} else {
				start = middle;
				a = b;
			}
		}
		return end;
	}
}
