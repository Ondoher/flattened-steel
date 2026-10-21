import assert from 'node:assert/strict';
import test from 'node:test';
import {DistantSunScatteringAccuracy as accuracy} from '../../../src/algorithm32/implementation/distant-sun/cache/DistantSunScatteringAccuracy.js';
import {CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER as outgoing} from '../../../src/algorithm32/sampling-domains/direction/cubed-sphere/consts.js';
import {DistantSunSceneCacheCompilerInputs as inputs} from './DistantSunSceneCacheCompilerInputs.js';

test('retains the deployed input identity unless the corrected policy is explicitly selected', () => {
	const scene = inputs.createQualifiedSanJoseNauticalScene();
	const original = inputs.createInputSet(scene);
	assert.deepEqual(inputs.createInputSet(scene, {scatteringAccuracy: 'legacy'}), original);
	const corrected = inputs.createInputSet(scene, {scatteringAccuracy: 'corrected60-sun035'});
	assert.equal(corrected.buildRequest.transportSpec.numerical.transportIntervalCount, 60);
	assert.equal(corrected.buildRequest.transportSpec.numerical.sourcePathTransmittanceIntervalCount, 20);
	assert.equal(corrected.buildRequest.transportSpec.numerical.maximumScatteringOrder, 4);
	assert.deepEqual(corrected.buildRequest.transportSpec.domains, original.buildRequest.transportSpec.domains);
	assert.deepEqual(corrected.buildRequest.transportSpec.atmosphere, original.buildRequest.transportSpec.atmosphere);
	assert.notEqual(corrected.numericalIdentity, original.numericalIdentity);
});

test('matches independently constructed half-angle directions including both axis limits', () => {
	for (const theta of [0, 0.01, 0.25, 1, 2, Math.PI - 0.01, Math.PI]) {
		const physical = accuracy.map([Math.cos(theta), Math.sin(theta), 0], [1, 0, 0], 'corrected60-sun035');
		const expectedTheta = theta === Math.PI ? Math.PI : 2 * Math.atan(0.35 * Math.tan(theta / 2));
		assert.ok(Math.abs(physical[0] - Math.cos(expectedTheta)) < 1e-13);
		assert.ok(Math.abs(physical[1] - Math.sin(expectedTheta)) < 1e-13);
	}
});

test('preserves exact seam copies, finite unit directions and invertibility across solar rows', () => {
	for (const degrees of [0.5, 30.5, 89.5, 120.5, 179.5]) {
		const angle = (degrees * Math.PI) / 180;
		const sun = [Math.sin(angle), 0, Math.cos(angle)];
		const seams = new Map();
		for (const direction of outgoing.unitVectors) {
			const mapped = accuracy.map(direction, sun, 'corrected60-sun035');
			const restored = accuracy.map(mapped, sun, 'corrected60-sun035', true);
			assert.ok(mapped.every(Number.isFinite));
			assert.ok(Math.abs(Math.hypot(...mapped) - 1) < 1e-14);
			assert.ok(restored.every((value, axis) => Math.abs(value - direction[axis]) < 1e-12));
			const key = direction.map(Math.fround).join(',');
			const value = mapped.map(Math.fround).join(',');
			if (seams.has(key)) assert.equal(value, seams.get(key));
			else seams.set(key, value);
		}
	}
});
