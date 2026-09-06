/**
 * Deterministic pseudorandom utilities copied from Enigma's Random module.
 *
 * Source: C:/dev/enigma/package/lib/utils/Random.js
 * License: MIT; Copyright (c) 2022 Glenn Anderson
 * This generator is not suitable for cryptographic use.
 */
class Random {
	constructor() {
		this.randSeed = Date.now();
	}

	randomize(value) {
		value = value === undefined ? Date.now() : value;
		this.randSeed = value;
	}

	random(limit) {
		let randPow = Math.pow(2, -31);
		let randLimit = Math.pow(2, 31);
		let magic = 0x8088405;
		let rand = this.randSeed * magic + 1;

		this.randSeed = rand % randLimit;
		rand = rand % randLimit;
		rand = rand * randPow;

		if (limit !== undefined) {
			rand = Math.floor(Math.abs(rand) * limit);
		}

		return rand;
	}

	randomCurve(dice, faces, zeroBased = false) {
		let result = 0;
		let adjust = zeroBased ? 0 : 1;
		for (let idx = 0; idx < dice; idx++) {
			result += this.random(faces) + adjust;
		}

		return result;
	}

	randomNormal(mean = 0, stddev = 1) {
		let u1 = 0;
		let u2 = 0;

		while (u1 === 0) {
			u1 = this.random();
		}

		while (u2 === 0) {
			u2 = this.random();
		}

		let z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
		return z0 * stddev + mean;
	}

	randomInt(start, end) {
		if (!Number.isInteger(start) || !Number.isInteger(end)) {
			throw new Error('start and end must be integers');
		}

		if (end < start) {
			throw new Error('end must be greater than or equal to start');
		}

		return start + this.random(end - start + 1);
	}

	randomNormalInt(mean = 0, stddev = 1) {
		return Math.round(this.randomNormal(mean, stddev));
	}

	randomNormalRange(start, end, mean = undefined, stddev = undefined) {
		if (!Number.isInteger(start) || !Number.isInteger(end)) {
			throw new Error('start and end must be integers');
		}

		if (end < start) {
			throw new Error('end must be greater than or equal to start');
		}

		if (start === end) {
			return start;
		}

		let width = end - start;
		let center = mean ?? (start + end) / 2;
		let spread = stddev ?? width / 6;

		while (true) {
			let value = this.randomNormalInt(center, spread);
			if (value >= start && value <= end) {
				return value;
			}
		}
	}

	randomBell(start, end) {
		return this.randomNormalRange(start, end);
	}

	pickOne(list) {
		let pos = Math.floor(this.random() * list.length);
		let choice = list.splice(pos, 1);
		return choice[0];
	}

	pickPair(list) {
		if (list.length === 0) {
			return [];
		}

		if (list.length === 1) {
			return [this.pickOne(list)];
		}

		return [this.pickOne(list), this.pickOne(list)];
	}

	pick(count, list) {
		let result = [];
		let limit = Math.min(list.length, count);
		for (let idx = 0; idx < limit; idx++) {
			result.push(this.pickOne(list));
		}

		return result;
	}

	pickPairs(count, list) {
		let result = [];
		for (let idx = 0; idx < count; idx++) {
			result.push(this.pickPair(list));
		}

		return result;
	}

	chooseOne(list) {
		let pos = Math.floor(this.random() * list.length);
		return list[pos];
	}

	choosePair(list) {
		if (list.length < 2) {
			return list;
		}

		let first = Math.floor(this.random() * list.length);
		let second = Math.floor(this.random() * list.length);
		while (second === first) {
			second = Math.floor(this.random() * list.length);
		}

		return [list[first], list[second]];
	}

	chooseRange(count, list) {
		let start = this.random(list.length) - count;
		return list.slice(start, start + count).join(' ');
	}

	choose(count, list) {
		let result = [];
		for (let idx = 0; idx < count; idx++) {
			result.push(this.chooseOne(list));
		}

		return result;
	}
}

export default new Random();
