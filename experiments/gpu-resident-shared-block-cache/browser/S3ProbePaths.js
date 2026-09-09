/** Dense baseline adapter used by S4 to compare the atlas without changing probe semantics. */
export class DenseProbePath {
	/** @param {Float32Array} values - Dense scalar values indexed by caller-defined ordinal. */
	constructor(values) {
		if (!(values instanceof Float32Array)) throw new TypeError('Dense probe values must be Float32Array.');
		this.values = values;
	}

	/** @param {number} ordinal - Dense scalar ordinal. */
	probe(ordinal) {
		if (!Number.isInteger(ordinal) || ordinal < 0 || ordinal >= this.values.length) throw new RangeError('Dense probe ordinal is invalid.');
		return this.values[ordinal];
	}
}

/** Atlas adapter used by S4 to resolve a logical sample through block slot and row metadata. */
export class AtlasProbePath {
	/** @param {Map<number, Float32Array>} blocks - Authenticated decoded blocks by block identity. */
	constructor(blocks) {
		this.blocks = blocks;
	}

	/** @param {{block: number, ordinal: number}} location - Published immutable lookup entry. */
	probe(location) {
		if (!Number.isInteger(location?.block) || !Number.isInteger(location?.ordinal) || location.ordinal < 0) throw new TypeError('Atlas probe location is invalid.');
		const values = this.blocks.get(location.block);
		if (!(values instanceof Float32Array) || location.ordinal >= values.length) throw new RangeError('Atlas probe references an absent scalar.');
		return values[location.ordinal];
	}
}

/** Compare Float32 values by their exact in-memory bit pattern. */
export function sameFloat32(left, right) {
	const values = new Float32Array([left, right]);
	const bits = new Uint32Array(values.buffer);
	return bits[0] === bits[1];
}
