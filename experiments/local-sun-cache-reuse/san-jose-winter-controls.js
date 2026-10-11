import {FlatEarthGeometry} from '../../src/algorithm32/implementation/flat-earth/FlatEarthGeometry.js';
import {resolveShellState} from './resolve-shell-state.js';

/** Derive fresh San Jose solstice controls through ordinary production placement.
 * The published-minute solstice basis matches the existing frozen controls;
 * Flat180 is twelve hours after that day's closest approach, possibly next UTC day.
 * @returns {readonly LocalSunCelestialControlState[]} - New independently resolved states; historical controls are never modified.
 */
export function createSanJoseWinterControls() {
	const location = {
		latitude: {value: 37.3382, units: /** @type {const} */ ('degrees')},
		longitude: {value: -121.8863, units: /** @type {const} */ ('degrees')},
	};
	return [0, 180].map((degrees) => {
		const instant = FlatEarthGeometry.resolveObservationInstant({
			dateBasis: '2024-12-21T09:20:00.000Z',
			location,
			kind: 'closest-angle',
			angle: {value: degrees, units: 'degrees'},
		});
		return {id: 'flat-' + degrees, ...resolveShellState({instant, location})};
	});
}
