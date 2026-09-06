import assert from 'node:assert/strict';
import test from 'node:test';
import {
	BASE_RADIANCE,
	CASES,
	capSolidAngle,
	evaluateCase,
	generateSamples,
	integrateSamples,
	projectedCapSolidAngle,
	runExperiment,
} from './run.js';

const caseById = (id) => CASES.find((candidate) => candidate.id === id);

const closePacket = (actual, expected, relativeTolerance = 1e-11) => {
	assert.equal(actual.length, expected.length);
	actual.forEach((value, channel) => {
		const scale = Math.max(Math.abs(actual[channel]), Math.abs(expected[channel]), Number.MIN_VALUE);
		assert.ok(
			Math.abs(value - expected[channel]) <= relativeTolerance * scale,
			`channel ${channel}: expected ${expected[channel]}, received ${value}`,
		);
	});
};

test('stable cap formulas retain small positive angular support', () => {
	const radius = 1e-8;
	assert.ok(capSolidAngle(radius) > 0);
	assert.ok(projectedCapSolidAngle(radius) > 0);
	assert.ok(Math.abs(capSolidAngle(radius) - Math.PI * radius ** 2) <= 1e-15 * Math.PI * radius ** 2);
});

test('uniform cap samples reproduce ordinary and projected analytic integrals', () => {
	for (const id of ['uniform-spherical-cap', 'uniform-angular-disk']) {
		const result = evaluateCase(caseById(id));
		assert.ok(result.accepted);
		closePacket(result.observed.ordinaryTotal, result.expected.ordinaryTotal);
		closePacket(result.observed.projectedTotal, result.expected.projectedTotal);
	}
});

test('the normalized limb profile preserves the uniform projected integral', () => {
	const result = evaluateCase(caseById('normalized-linear-limb-profile'));
	assert.ok(result.accepted);
	closePacket(result.observed.projectedTotal, result.expected.projectedTotal);
});

test('clipped and fully off-raster support are accounted without renormalization', () => {
	const clipped = evaluateCase(caseById('clipped-support'));
	const off = evaluateCase(caseById('fully-off-raster'));
	assert.equal(clipped.expected.fraction, 3 / 8);
	closePacket(clipped.observed.ordinaryOn, clipped.expected.ordinaryOn);
	closePacket(clipped.observed.ordinaryOff, clipped.expected.ordinaryOff);
	closePacket(clipped.observed.ordinaryTotal, clipped.expected.ordinaryTotal);
	assert.ok(off.observed.ordinaryOn.every((value) => value === 0));
	closePacket(off.observed.ordinaryOff, off.expected.ordinaryTotal);
	closePacket(off.observed.projectedOff, off.expected.projectedTotal);
});

test('resolved and collapsed small-angle disks reproduce the same integrals', () => {
	const resolved = evaluateCase(caseById('resolved-small-angle'));
	const collapsed = evaluateCase(caseById('collapsed-small-angle'));
	assert.ok(resolved.sampleCount > collapsed.sampleCount);
	closePacket(resolved.observed.ordinaryTotal, collapsed.observed.ordinaryTotal);
	closePacket(resolved.observed.projectedTotal, collapsed.observed.projectedTotal);
});

test('the angular integrator consumes only declared boundary sample data', () => {
	const descriptor = caseById('uniform-angular-disk');
	const samples = generateSamples(descriptor);
	const observed = integrateSamples(samples);
	assert.equal(samples.length, descriptor.radialBands * descriptor.azimuthSamples);
	assert.ok(
		samples.every(
			(sample) =>
				sample.radiance.length === BASE_RADIANCE.length &&
				sample.solidAngleSteradians > 0 &&
				sample.projectionCosine >= 0 &&
				sample.projectionCosine <= 1,
		),
	);
	assert.equal(observed.ordinaryTotal.length, BASE_RADIANCE.length);
});

test('the complete E5 experiment satisfies every declared criterion', () => {
	const result = runExperiment();
	assert.ok(result.accepted);
	assert.equal(result.results.length, CASES.length);
	assert.ok(result.results.every((iteration) => iteration.accepted));
	assert.ok(result.smallAngleComparison.ordinary.accepted);
	assert.ok(result.smallAngleComparison.projected.accepted);
});
