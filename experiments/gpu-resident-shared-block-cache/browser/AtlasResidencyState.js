/** Deterministic, bounded shared-block residency model for the contained atlas proof. */
export default class AtlasResidencyState {
	/** @type {number} */ #capacity;
	/** @type {Map<number, {slot: number, touched: number, pins: number}>} */ #resident = new Map();
	/** @type {number} */ #clock = 0;

	/** @param {number} capacity - Maximum simultaneously resident decoded blocks. */
	constructor(capacity) {
		if (!Number.isInteger(capacity) || capacity < 1) throw new RangeError('Atlas residency capacity must be a positive integer.');
		this.#capacity = capacity;
	}

	/**
	 * Plan one frame-boundary selection without mutating GPU state. The caller must upload
	 * `added` blocks and authenticate them before committing this returned plan.
	 *
	 * @param {readonly number[]} required - Unique block identities for the requested scene.
	 * @param {readonly number[]} predicted - Unique block identities for one predicted next scene.
	 * @returns {{required: number[], predicted: number[], reused: number[], added: number[], evicted: number[]}} - Deterministic residency transaction.
	 */
	plan(required, predicted) {
		const unique = (values) => [...new Set(values)].sort((left, right) => left - right);
		const requiredUnique = unique(required);
		const predictedUnique = unique(predicted).filter((block) => !requiredUnique.includes(block));
		if (requiredUnique.length > this.#capacity) throw new RangeError('Required scene blocks exceed atlas capacity.');
		const desired = unique([...requiredUnique, ...predictedUnique]).slice(0, this.#capacity);
		const reused = desired.filter((block) => this.#resident.has(block));
		const added = desired.filter((block) => !this.#resident.has(block));
		const pins = new Set(desired);
		const evictable = [...this.#resident.entries()]
			.filter(([block]) => !pins.has(block))
			.sort((left, right) => left[1].touched - right[1].touched || left[0] - right[0]);
		const evicted = evictable.slice(0, Math.max(0, this.#resident.size + added.length - this.#capacity)).map(([block]) => block);
		if (this.#resident.size + added.length - evicted.length > this.#capacity) throw new Error('Pinned residency cannot fit in the declared atlas capacity.');
		return {required: requiredUnique, predicted: predictedUnique, reused, added, evicted};
	}

	/** Commit an authenticated upload/publication transaction planned by `plan`. */
	commit(plan) {
		for (const block of plan.evicted) this.#resident.delete(block);
		const freeSlots = [...Array(this.#capacity).keys()].filter((slot) => ![...this.#resident.values()].some((entry) => entry.slot === slot));
		for (const block of plan.added) this.#resident.set(block, {slot: freeSlots.shift(), touched: ++this.#clock, pins: 0});
		const pins = new Set([...plan.required, ...plan.predicted]);
		for (const [block, entry] of this.#resident) {
			entry.pins = pins.has(block) ? 1 : 0;
			if (pins.has(block)) entry.touched = ++this.#clock;
		}
		return Object.freeze([...this.#resident.entries()].map(([block, entry]) => Object.freeze({block, slot: entry.slot})).sort((left, right) => left.block - right.block));
	}
}
