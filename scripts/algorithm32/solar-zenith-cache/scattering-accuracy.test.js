import assert from 'node:assert/strict';
import test from 'node:test';
import {DistantSunScatteringAccuracy as accuracy} from '../../../src/algorithm32/implementation/distant-sun/cache/DistantSunScatteringAccuracy.js';
import {CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER as outgoing} from '../../../src/algorithm32/sampling-domains/direction/cubed-sphere/consts.js';
import {DistantSunSceneCacheCompilerInputs as inputs} from './DistantSunSceneCacheCompilerInputs.js';
import {DistantSunPointLocalCacheAerosolOptics as aerosols} from './DistantSunPointLocalCacheAerosolOptics.js';

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

test('zero aerosol amount changes the physical field identity while preserving other construction inputs', () => {
	const scene = inputs.createQualifiedSanJoseNauticalScene();
	const original = inputs.createInputSet(scene);
	const clear = inputs.createInputSet(scene, {mieAngstromBeta: 0});
	assert.deepEqual(clear.buildRequest.transportSpec, {
		...original.buildRequest.transportSpec,
		atmosphere: {...original.buildRequest.transportSpec.atmosphere, mieAngstromBeta: 0},
	});
	assert.notEqual(clear.numericalIdentity, original.numericalIdentity);
	for (const value of [-1, NaN, Infinity, null, '0'])
		assert.throws(() => inputs.createInputSet(scene, {mieAngstromBeta: value}), /finite and nonnegative/u);
});

test('explicit aerosol qualification material preserves extinction and changes complete input identity', () => {
	const scene = inputs.createQualifiedSanJoseNauticalScene();
	const original = inputs.createInputSet(scene);
	const table = {mu: [-1, 0, 1], pdf: [0.25, 0.5, 0.75]};
	const spectralAerosols = original.buildRequest.transportSpec.domains.spectrum.channels.map(() => ({
		mieSingleScatteringAlbedo: 0.94,
		miePhaseTable: table,
	}));
	const before = structuredClone(spectralAerosols);
	const matched = inputs.createInputSet(scene, {spectralAerosols});
	assert.deepEqual(matched.buildRequest.transportSpec.atmosphere, original.buildRequest.transportSpec.atmosphere);
	assert.deepEqual(matched.buildRequest.transportSpec.numerical, original.buildRequest.transportSpec.numerical);
	assert.notEqual(matched.numericalIdentity, original.numericalIdentity);
	assert.deepEqual(spectralAerosols, before);
	assert.equal(matched.buildRequest.transportSpec.domains.spectrum.channels[0].mieSingleScatteringAlbedo, 0.94);
	assert.throws(() => aerosols.acceptTable({mu: [-1, 1], pdf: [1, 1]}), /integrate to one/u);
	assert.throws(() => aerosols.acceptChannel({mieSingleScatteringAlbedo: 1.1}), /\[0, 1\]/u);
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
