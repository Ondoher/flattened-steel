import assert from 'node:assert/strict';
import test from 'node:test';

import {Algorithm32} from '../../../src/algorithm32/implementation/index.js';
import {loadKiderDataset} from './benchmark.js';
import {BRUNETON_SOURCE_REVISION, createBrunetonProductionProfile, createViewDirection} from './production-profile.js';

test('constructs the benchmark-owned direct-40 profile through production ingress', () => {
	const condition = loadKiderDataset().conditions[0];
	const profile = createBrunetonProductionProfile({
		time: condition.time,
		fittedAzimuthDegrees: condition.sun.fittedAzimuthDegrees,
		maximumScatteringOrder: 4,
	});
	const algorithm = new Algorithm32({profile});

	assert.equal(profile.spectral.basis.channelCount, 40);
	assert.equal(profile.spectral.basis.semantics, 'point-sampled-spectral-density');
	assert.deepEqual(
		profile.spectral.basis.channels.map((channel) => channel.center.value),
		Array.from({length: 40}, (_, index) => 360 + (470 * index) / 40),
	);
	assert.deepEqual(profile.numerical.viewPath, {
		intervalCount: 30,
		sampleDistribution: {kind: 'quadratic-near-observer-v1'},
	});
	assert.equal(profile.numerical.sourcePathTransmittance.intervalCount, 20);
	assert.equal(profile.numerical.cacheConstruction.transportIntervalCount, 40);
	assert.equal(profile.numerical.cacheConstruction.maximumScatteringOrder, 4);
	assert.equal(profile.domains.positions.count, 48);
	assert.deepEqual(profile.domains.positions.nodes[0].coordinate, {value: 0, units: 'meters'});
	assert.deepEqual(profile.domains.positions.boundaryAltitude, {value: 0, units: 'meters'});
	assert.deepEqual(profile.models.geometry.configuration.cacheBoundaryAltitude, {value: 0, units: 'meters'});
	assert.equal(profile.domains.incomingDirections.directionCount, 68);
	assert.equal(profile.domains.incomingDirections.id, 'algorithm32-reflection-completed-fibonacci-68-incoming-v1');
	assert.equal(profile.domains.outgoingDirections.directionCount, 4374);
	assert.match(profile.contentHash, /^sha256:[0-9a-f]{64}$/);
	assert.equal(profile.provenanceIdentity, `b1-bruneton-${BRUNETON_SOURCE_REVISION}`);
	assert.deepEqual(createViewDirection(4, 4), [0, 0, 1]);

	algorithm.dispose();
});

test('constructs the reflection-completed 136-direction experimental profile', () => {
	const condition = loadKiderDataset().conditions[0];
	const profile = createBrunetonProductionProfile({
		time: condition.time,
		fittedAzimuthDegrees: condition.sun.fittedAzimuthDegrees,
		maximumScatteringOrder: 4,
		incomingDirectionVariant: 'reflection-completed-136',
	});
	const directions = profile.domains.incomingDirections;

	assert.equal(directions.directionCount, 136);
	assert.equal(directions.pairCount, 68);
	assert.equal(directions.integrationWeights.values.length, 136);
	assert.ok(
		Math.abs(directions.integrationWeights.values.reduce((sum, value) => sum + value, 0) - 4 * Math.PI) < 1e-12,
	);
	for (let index = 0; index < directions.directionCount; index += 2) {
		assert.deepEqual(directions.unitVectors[index + 1], [
			directions.unitVectors[index][0],
			-directions.unitVectors[index][1],
			directions.unitVectors[index][2],
		]);
	}
	assert.match(profile.id, /reflection-completed-136/);
});

test('constructs the reflection-completed ordinary 68-direction experimental profile', () => {
	const condition = loadKiderDataset().conditions[0];
	const profile = createBrunetonProductionProfile({
		time: condition.time,
		fittedAzimuthDegrees: condition.sun.fittedAzimuthDegrees,
		maximumScatteringOrder: 4,
		incomingDirectionVariant: 'reflection-completed-ordinary-68',
	});
	const directions = profile.domains.incomingDirections;

	assert.equal(directions.directionCount, 68);
	assert.equal(directions.integrationWeights.values.length, 68);
	assert.ok(
		Math.abs(directions.integrationWeights.values.reduce((sum, value) => sum + value, 0) - 4 * Math.PI) < 1e-12,
	);
	for (let index = 0; index < directions.directionCount; index += 2) {
		assert.deepEqual(directions.unitVectors[index + 1], [
			directions.unitVectors[index][0],
			-directions.unitVectors[index][1],
			directions.unitVectors[index][2],
		]);
	}
	assert.match(profile.id, /reflection-completed-ordinary-68/);
});

test('constructs dense paired-Fibonacci convergence profiles', () => {
	const condition = loadKiderDataset().conditions[0];
	for (const directionCount of [272, 544]) {
		const profile = createBrunetonProductionProfile({
			time: condition.time,
			fittedAzimuthDegrees: condition.sun.fittedAzimuthDegrees,
			maximumScatteringOrder: 4,
			incomingDirectionVariant: `paired-fibonacci-${directionCount}`,
		});
		const directions = profile.domains.incomingDirections;

		assert.equal(directions.directionCount, directionCount);
		assert.equal(directions.pairCount, directionCount / 2);
		assert.equal(directions.integrationWeights.values.length, directionCount);
		assert.ok(
			Math.abs(directions.integrationWeights.values.reduce((sum, value) => sum + value, 0) - 4 * Math.PI) < 1e-12,
		);
		for (let index = 0; index < directions.directionCount; index += 2) {
			assert.deepEqual(
				directions.unitVectors[index + 1],
				directions.unitVectors[index].map((value) => -value),
			);
		}
		assert.match(profile.id, new RegExp(`paired-fibonacci-${directionCount}`));
	}
});

test('constructs zenith-oriented Bruneton angular integration profiles', () => {
	const condition = loadKiderDataset().conditions.find((candidate) => candidate.time === '10:15');
	for (const directionCount of [288, 392, 512]) {
		const profile = createBrunetonProductionProfile({
			time: condition.time,
			fittedAzimuthDegrees: condition.sun.fittedAzimuthDegrees,
			maximumScatteringOrder: 4,
			incomingDirectionVariant: `bruneton-angular-${directionCount}`,
		});
		const directions = profile.domains.incomingDirections;

		assert.equal(directions.directionCount, directionCount);
		assert.equal(directions.pairCount, directionCount / 2);
		assert.equal(directions.integrationWeights.values.length, directionCount);
		assert.ok(
			Math.abs(directions.integrationWeights.values.reduce((sum, value) => sum + value, 0) - 4 * Math.PI) < 1e-12,
		);
		for (let index = 0; index < directions.directionCount; index += 4) {
			assert.deepEqual(
				directions.unitVectors[index + 2],
				directions.unitVectors[index].map((value) => -value),
			);
			assert.deepEqual(
				directions.unitVectors[index + 3],
				directions.unitVectors[index + 1].map((value) => -value),
			);
		}
		const weightedFirstMoment = [0, 1, 2].map((component) =>
			directions.unitVectors.reduce(
				(sum, direction, index) => sum + direction[component] * directions.integrationWeights.values[index],
				0,
			),
		);
		assert.ok(weightedFirstMoment.every((value) => Math.abs(value) < 1e-14));
		assert.match(profile.id, new RegExp(`bruneton-angular-${directionCount}`));
	}
});
