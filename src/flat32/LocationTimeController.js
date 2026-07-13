import {FlatEarthGeometry} from '../algorithm32/implementation/index.js';
import AngleMath from '../algorithm32/math/AngleMath.js';
import {FLAT32_GLOBE_TIME_PRESETS, FLAT32_LOCATION_PRESETS, FLAT32_TIME_PRESETS} from './consts.js';

/** Own Flat32's legacy location and flat-time source controls. */
export class LocationTimeController {
	/** Return the selected location preset. */
	_currentLocation(state) {
		return FLAT32_LOCATION_PRESETS[state.locationIndex];
	}

	/** Return the selected flat-time preset. */
	_currentTime(state) {
		return FLAT32_TIME_PRESETS[state.flatTimeIndex];
	}

	_currentGlobeTime(state) {
		return FLAT32_GLOBE_TIME_PRESETS[state.globeTimeIndex];
	}

	/** Format the selected globe preset and any retained manual offset. */
	_globeTimeLabel(state) {
		const preset = this._currentGlobeTime(state);

		if (state.globeHourOffset === 0) {
			return preset.label;
		}

		const offsetMinutes = Math.round(state.globeHourOffset * 60);
		const absoluteMinutes = Math.abs(offsetMinutes);
		const hours = Math.trunc(absoluteMinutes / 60);
		const minutes = absoluteMinutes % 60;
		const offsetText = [hours > 0 ? `${hours}h` : '', minutes > 0 ? `${minutes}m` : ''].filter(Boolean).join(' ');

		return `${preset.label} ${state.globeHourOffset > 0 ? '+' : '-'}${offsetText}`;
	}

	/** Resolve the retained old-app sunrise, solar-noon, and sunset presets. */
	_resolveGlobeTime(location, state) {
		const preset = this._currentGlobeTime(state);
		const locationAngles = {
			latitude: AngleMath.inDegrees(location.latitude),
			longitude: AngleMath.inDegrees(location.longitude),
		};
		const solarNoonIso = FlatEarthGeometry.resolveObservationInstant({
			dateBasis: location.dateBasis,
			location: locationAngles,
			kind: 'solar-noon',
		});

		if (preset.kind === 'solar-noon-offset') {
			return new Date(
				new Date(solarNoonIso).getTime() + (preset.offsetHours ?? 0) * 60 * 60 * 1000,
			).toISOString();
		}

		return FlatEarthGeometry.resolveObservationInstant({
			dateBasis: location.dateBasis,
			location: locationAngles,
			kind: preset.kind === 'sunrise' ? 'sunrise' : 'sunset',
		});
	}

	/** Resolve the current selection and its executable source state. */
	_resolveState(state) {
		const location = this._currentLocation(state);
		const flatTime = this._currentTime(state);
		const timeIso =
			state.timeBasis === 'flat'
				? FlatEarthGeometry.resolveObservationInstant({
						dateBasis: location.dateBasis,
						location: {
							latitude: AngleMath.inDegrees(location.latitude),
							longitude: AngleMath.inDegrees(location.longitude),
						},
						kind: 'closest-angle',
						angle: AngleMath.inDegrees(flatTime.offsetDegrees),
					})
				: new Date(
						new Date(this._resolveGlobeTime(location, state)).getTime() +
							state.globeHourOffset * 60 * 60 * 1000,
					).toISOString();

		return {
			locationIndex: state.locationIndex,
			flatTimeIndex: state.flatTimeIndex,
			globeTimeIndex: state.globeTimeIndex,
			globeHourOffset: state.globeHourOffset,
			locationLabel: location.label,
			timeLabel: state.timeBasis === 'flat' ? flatTime.label : this._globeTimeLabel(state),
			timeBasis: state.timeBasis,
			observation: {
				instant: timeIso,
				location: {
					latitude: AngleMath.inDegrees(location.latitude),
					longitude: AngleMath.inDegrees(location.longitude),
				},
			},
		};
	}

	/** Advance to the next legacy location preset. */
	nextLocation(state) {
		return this._resolveState({
			...state,
			locationIndex: (state.locationIndex + 1) % FLAT32_LOCATION_PRESETS.length,
		});
	}

	/** Select one legacy flat-time preset. */
	selectTime(state, index) {
		if (!Number.isInteger(index) || index < 0 || index >= FLAT32_TIME_PRESETS.length) {
			throw new RangeError('Flat32 time preset index is unsupported.');
		}
		return this._resolveState({
			...state,
			timeBasis: 'flat',
			flatTimeIndex: index,
		});
	}

	toggleTimeBasis(state) {
		return this._resolveState({
			...state,
			timeBasis: state.timeBasis === 'flat' ? 'globe' : 'flat',
		});
	}

	selectGlobeTime(state, index) {
		if (!Number.isInteger(index) || index < 0 || index >= FLAT32_GLOBE_TIME_PRESETS.length) {
			throw new RangeError('Flat32 globe time preset index is unsupported.');
		}
		return this._resolveState({
			...state,
			timeBasis: 'globe',
			globeTimeIndex: index,
			globeHourOffset: 0,
		});
	}

	/** Adjust the retained globe-time offset in whole hours. */
	adjustGlobeHourOffset(state, deltaHours) {
		if (!Number.isFinite(deltaHours) || deltaHours === 0) {
			return this._resolveState(state);
		}
		return this._resolveState({
			...state,
			timeBasis: 'globe',
			globeHourOffset: state.globeHourOffset + deltaHours,
		});
	}

	/** Adjust the retained globe-time offset in whole minutes. */
	adjustGlobeMinuteOffset(state, deltaMinutes) {
		if (!Number.isFinite(deltaMinutes) || deltaMinutes === 0) {
			return this._resolveState(state);
		}
		return this._resolveState({
			...state,
			timeBasis: 'globe',
			globeHourOffset: state.globeHourOffset + deltaMinutes / 60,
		});
	}

	/** Return the initial selection. */
	start() {
		return this._resolveState({
			locationIndex: 1,
			flatTimeIndex: 0,
			timeBasis: 'flat',
			globeTimeIndex: 1,
			globeHourOffset: 0,
		});
	}
}
