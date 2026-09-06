import assert from 'node:assert/strict';
import test from 'node:test';
import {generateData} from './generate-data.js';
import {
	BRUNETON_INCOMING_SAMPLE_COUNT,
	acceptsE2Criterion,
	buildReport,
	createBrunetonIncomingDirectionSamples,
	createDisplayMapper,
	createFibonacciIncomingDirectionSamples,
	createSkyRay,
	e2AcceptanceUpperBound,
	interpolateCie,
} from './run.js';

const closeTo = (actual, expected, tolerance, message) => {
	assert.ok(
		Math.abs(actual - expected) <= tolerance,
		`${message}: expected ${expected} +/- ${tolerance}, received ${actual}`,
	);
};

test('generates the declared deterministic paired physical inputs', () => {
	const first = generateData();
	const second = generateData();

	assert.equal(first.experiment.id, 'E3');
	assert.equal(first.cases.length, 24);
	assert.deepEqual(first, second);
	assert.equal(first.referenceQuadrature.incidentDirections, 512);
	assert.equal(first.currentAlgorithm32Controls.incidentDirections, 34);
	assert.equal(first.incidentDirectionSearch.maximumCount, 68);
	assert.equal(first.displayDifferenceDiagnostics.referenceUncertaintyDeltaEItp, 0);
	assert.equal(first.displayDifferenceDiagnostics.visibilityBoundaryDeltaEItp, 1);
	assert.equal(first.displayDifferenceDiagnostics.acceptableAccuracyBoundaryDeltaEItp, 3);
	assert.ok(
		first.cases.every(
			(physicalCase) =>
				!Object.hasOwn(physicalCase, 'endpointSpectralRadianceDensity') &&
				!Object.hasOwn(physicalCase, 'distanceMeters'),
		),
	);
});

test('every declared view is an upward observer ray ending at top atmosphere', () => {
	const data = generateData();
	for (const physicalCase of data.cases) {
		const ray = createSkyRay(data, physicalCase);
		closeTo(Math.hypot(...ray.direction), 1, 1e-14, 'unit sky direction');
		assert.ok(ray.direction[2] > 0);
		assert.ok(ray.distanceMeters > 0);
		closeTo(Math.hypot(...ray.endpoint), data.atmosphere.topRadiusMeters, 1e-6, 'top-atmosphere endpoint radius');
	}
});

test('candidate and reference differ only in incident angular quadrature controls', () => {
	const data = generateData();
	const sharedKeys = ['pathIntervals', 'sourceTransmittanceIntervals', 'incidentAltitudeBins'];

	for (const key of sharedKeys) {
		assert.equal(data.currentAlgorithm32Controls[key], data.referenceQuadrature[key]);
	}
	assert.notEqual(data.currentAlgorithm32Controls.incidentQuadrature, data.referenceQuadrature.incidentQuadrature);
});

test('creates exactly N production-form Fibonacci samples for odd and even counts', () => {
	for (const count of [1, 4, 17, 34, 68]) {
		const samples = createFibonacciIncomingDirectionSamples([1, 0, 0], count);
		assert.equal(samples.length, count);
		for (const sample of samples) {
			closeTo(Math.hypot(...sample.direction), 1, 1e-14, 'unit direction');
			closeTo(sample.solidAngleSteradians, (4 * Math.PI) / count, 1e-15, 'equal solid-angle weight');
		}
		closeTo(
			samples.reduce((sum, sample) => sum + sample.solidAngleSteradians, 0),
			4 * Math.PI,
			2e-13,
			'Fibonacci weight sum',
		);
	}
	assert.throws(() => createFibonacciIncomingDirectionSamples([1, 0, 0], 0), /positive integer/);
});

test('reproduces Bruneton 16 by 32 midpoint samples without renormalizing weights', () => {
	const samples = createBrunetonIncomingDirectionSamples([0, 0, 6_360_002], [1, 0, 0], [0, 1, 1]);
	assert.equal(samples.length, BRUNETON_INCOMING_SAMPLE_COUNT);
	assert.equal(samples.length, 16 * 32);
	for (const sample of samples) {
		closeTo(Math.hypot(...sample.direction), 1, 2e-14, 'unit direction');
	}

	const firstTheta = (0.5 * Math.PI) / 16;
	const expectedFirstWeight = Math.sin(firstTheta) * (Math.PI / 16) * (Math.PI / 16);
	assert.equal(samples[0].solidAngleSteradians, expectedFirstWeight);
	assert.notEqual(
		samples.reduce((sum, sample) => sum + sample.solidAngleSteradians, 0),
		4 * Math.PI,
	);
});

test('interpolates the retained CIE data at exact and fractional wavelengths', () => {
	const exact = interpolateCie(407);
	const lower = interpolateCie(375);
	const upper = interpolateCie(376);
	const midpoint = interpolateCie(375.5);
	assert.equal(exact.length, 3);
	midpoint.forEach((value, index) => {
		assert.ok(Math.abs(value - 0.5 * (lower[index] + upper[index])) < 1e-15);
	});
});

test('maps completed spectra through the declared bounded display boundary', () => {
	const data = generateData();
	const mapSpectrum = createDisplayMapper(data);
	const black = mapSpectrum(Array(15).fill(0));
	const positive = mapSpectrum(Array(15).fill(1));
	assert.deepEqual(black.displayLinearSrgb, [0, 0, 0]);
	assert.ok(positive.displayLinearSrgb.every((value) => value >= 0 && value <= 1));
	assert.ok(positive.displayLinearSrgb.some((value) => value > 0));
});

test('evaluates the E2 display diagnostic as a strict uncertainty sum', () => {
	assert.equal(e2AcceptanceUpperBound(0.4, 0, 0.01), 0.41000000000000003);
	assert.equal(acceptsE2Criterion(2.9, 0, 0.01, 3), true);
	assert.equal(acceptsE2Criterion(2.99, 0, 0.01, 3), false);
	assert.equal(acceptsE2Criterion(3, 0, 0, 3), false);
});

test('characterizes every count in the practical envelope without auto-selection', () => {
	const report = buildReport();
	assert.equal(report.accepted, true);
	assert.equal(report.selectedDirectionCount, null);
	assert.equal(report.directionSearch.length, 65);
	assert.deepEqual(
		report.directionSearch.map((row) => row.candidateCount),
		Array.from({length: 65}, (_, index) => index + 4),
	);
	assert.equal(report.currentAlgorithm32Assessment.caseRows.length, report.data.cases.length);
	assert.ok(Number.isFinite(report.currentAlgorithm32Assessment.deltaEItpStatistics.maximum));
});
