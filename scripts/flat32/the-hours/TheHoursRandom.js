/** Replay-seeded noncryptographic generator preserving the original binary64 recurrence.
 *
 * @implements {TheHoursObservatoryRandomSource}
 */
export class TheHoursRandom {
	/** Creates one privately owned deterministic sequence. */
	constructor() {
		this._seed = 0;
	}
	/**
	 * Call this method to reset the explicit construction seed.
	 *
	 * @param {number} seed - Integer construction seed.
	 * @returns {void} - Sequence reset.
	 */
	randomize(seed) {
		if (!Number.isSafeInteger(seed)) throw new RangeError('The Hours requires an integer random seed.');
		this._seed = seed;
	}
	/**
	 * Call this method to obtain the next original unit-interval value.
	 *
	 * @returns {number} - Deterministic value.
	 */
	random() {
		this._seed = (this._seed * 0x8088405 + 1) % Math.pow(2, 31);
		return this._seed * Math.pow(2, -31);
	}
}
