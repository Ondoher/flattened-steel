import assert from 'node:assert/strict';
import test from 'node:test';
import {DistantSunSolarInterpolation as interpolation} from '../../../src/algorithm32/implementation/distant-sun/cache/DistantSunSolarInterpolation.js';

test('solar Hermite lookup preserves exact knots and linear fields over spectral scales', () => {
	for (const scale of [1e-30, 1e-15, 1, 1e15]) {
		assert.equal(interpolation.sample(scale, 2 * scale, 3 * scale, 4 * scale, 0), 2 * scale);
		assert.equal(interpolation.sample(scale, 2 * scale, 3 * scale, 4 * scale, 1), 3 * scale);
		for (const fraction of [0.01, 0.25, 0.5, 0.75, 0.99]) {
			const actual = interpolation.sample(scale, 2 * scale, 3 * scale, 4 * scale, fraction);
			assert.ok(Math.abs(actual / scale - (2 + fraction)) <= 2e-15);
		}
	}
});

test('solar Hermite lookup stays within interval bounds and joins with shared tangents', () => {
	for (const values of [
		[0, 0, 1, 1],
		[0, 1, 1.01, 20],
		[20, 1.01, 1, 0],
		[0, 2, 1, 3],
		[0, 0, 0, 0],
	]) {
		for (let step = 0; step <= 1000; step++) {
			const value = interpolation.sample(...values, step / 1000);
			assert.ok(Number.isFinite(value));
			assert.ok(value >= Math.min(values[1], values[2]) - 1e-14);
			assert.ok(value <= Math.max(values[1], values[2]) + 1e-14);
		}
	}
	const values = [0, 0.4, 2, 2.2, 3];
	const delta = 1e-6;
	const before = (values[2] - interpolation.sample(...values.slice(0, 4), 1 - delta)) / delta;
	const after = (interpolation.sample(...values.slice(1), delta) - values[2]) / delta;
	assert.ok(Math.abs(before - after) < 1e-5);
});

test('physical domain endpoints use bounded one-sided slopes', () => {
	for (const fraction of [0, 0.1, 0.5, 0.9, 1]) {
		assert.equal(interpolation.sample(undefined, 0, 1, 2, fraction), fraction);
		assert.ok(Math.abs(interpolation.sample(0, 1, 2, undefined, fraction) - (1 + fraction)) < 1e-15);
	}
});
