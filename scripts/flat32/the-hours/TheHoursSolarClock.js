import {LocationTimeController} from '../../../src/flat32/LocationTimeController.js';

/** Original authenticated astronomical clock and complete production observation owner. */
export class TheHoursSolarClock {
	/**
	 * Creates an exact clock from the authenticated original choreography.
	 *
	 * @param {TheHoursOriginalTrace} original - Retained source trace and solved event tangents.
	 */
	constructor(original) {
		if (original.frames.length !== 1800 || original.solar.timeline.length !== 9) {
			throw new Error('The Hours requires the complete original 1800-frame clock.');
		}
		this._original = original;
		const locations = new LocationTimeController();
		let seed = locations.start();
		for (let count = 0; seed.locationLabel !== 'San Jose' && count < 3; count += 1)
			seed = locations.nextLocation(seed);
		this._seed = {...locations.selectGlobeTime(seed, 1), modeKind: 'spherical-distant'};
	}

	/**
	 * Called by sample preparation to evaluate the original shape-preserving astronomical clock.
	 *
	 * @param {number} seconds - Time within the original sixty-second score.
	 * @returns {string} - Millisecond-rounded original UTC observation.
	 */
	_instantAt(seconds) {
		const timeline = this._original.solar.timeline;
		if (seconds === 60) return new Date(timeline.at(-1).milliseconds).toISOString();
		const index = Math.min(
			timeline.length - 2,
			Math.max(0, timeline.findIndex((key) => key.seconds > seconds) - 1),
		);
		const first = timeline[index],
			last = timeline[index + 1];
		const interval = last.seconds - first.seconds;
		const fraction = (seconds - first.seconds) / interval;
		const square = fraction * fraction,
			cube = square * fraction;
		const milliseconds =
			(2 * cube - 3 * square + 1) * first.milliseconds +
			(cube - 2 * square + fraction) * interval * first.slope +
			(-2 * cube + 3 * square) * last.milliseconds +
			(cube - square) * interval * last.slope;
		return new Date(Math.round(milliseconds)).toISOString();
	}

	/**
	 * Call this method to resolve an exact production observation and verify every retained frame instant.
	 * Invalid score positions or disagreement with the immutable original throw.
	 *
	 * @param {number} seconds - Original score position in seconds.
	 * @returns {Flat32ApplicationState} - Independent exact production state.
	 */
	stateAt(seconds) {
		if (!Number.isFinite(seconds) || seconds < 0 || seconds > 60)
			throw new RangeError('The Hours time is outside 0–60 seconds.');
		const instant = this._instantAt(seconds);
		const index = Math.round(seconds * 30);
		if (
			Math.abs(index / 30 - seconds) < 1e-12 &&
			index < 1800 &&
			instant !== this._original.frames[index].instant
		) {
			throw new Error(`Original astronomical clock mismatch at frame ${index}.`);
		}
		return {...this._seed, modeKind: 'spherical-distant', observation: {...this._seed.observation, instant}};
	}
}
