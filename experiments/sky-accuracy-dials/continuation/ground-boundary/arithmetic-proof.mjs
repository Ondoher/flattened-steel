import assert from 'node:assert/strict';
import {createProductQuadrature} from '../../numerics/profile.js';
import {
	groundArithmeticExp,
	groundArithmeticPowRelative,
	prepareGroundArithmetic,
	assessGroundArithmetic,
} from './arithmetic.mjs';
import {assertGroundArithmeticPrecision} from './arithmetic-precision.js';

/** Verify outward primitive enclosures, mandatory storage precision and prospective residual rejection.
 * @returns {SkyGroundArithmeticProof} Manufactured CPU-only checks.
 */
export function groundArithmeticProof() {
	let checks = 0;
	let previous = 0;
	for (let i = -256; i <= 256; i++) {
		const x = i / 4,
			a = groundArithmeticExp([x, x]),
			comparison = Math.exp(x);
		assert.ok(a[0] <= comparison && a[1] >= comparison);
		checks++;
		assert.ok(a[0] > previous);
		checks++;
		previous = a[1];
	}
	assert.throws(() => groundArithmeticExp([-65, 0]));
	checks++;
	assert.throws(() => groundArithmeticExp([0, 65]));
	checks++;
	const power = groundArithmeticPowRelative();
	assert.ok(power > 0 && power < 1e-5);
	checks++;
	/** @type {SkyGroundArithmeticPrecision} */
	const precision = {
		schemaId: 'sky-ground-arithmetic-precision-v1',
		low: {rangeMin: 127, rangeMax: 127, precision: 23},
		high: {rangeMin: 127, rangeMax: 127, precision: 23},
	};
	assertGroundArithmeticPrecision(precision);
	checks++;
	for (const key of ['low', 'high']) {
		assert.throws(() => assertGroundArithmeticPrecision({...precision, [key]: {...precision[key], precision: 10}}));
		checks++;
		assert.throws(() => assertGroundArithmeticPrecision({...precision, [key]: {...precision[key], rangeMin: 125}}));
		checks++;
		assert.throws(() => assertGroundArithmeticPrecision({...precision, [key]: {...precision[key], rangeMax: 126}}));
		checks++;
	}
	/** @type {SkySixCommonParameters} */
	const p = {
		wavelengthNanometers: 360,
		sourceIrradiance: 1.13419,
		ozoneCrossSection: 0,
		ozoneMaximumDensity: 0,
		rayleighScattering: 0.00006678276651860079,
		mieExtinction: 0.00007548084348202988,
		groundAlbedo: 0.018,
		bottomRadiusMeters: 6360000,
		topRadiusMeters: 6420000,
		rayleighScaleHeightMeters: 8000,
		mieScaleHeightMeters: 1200,
		rayleighCoefficientScalePerMeter: 0.00000124062,
		mieAngstromAlpha: 0.8,
		mieAngstromBeta: 0.04,
		mieSingleScatteringAlbedo: 0.8,
		miePhaseFunctionG: 0.7,
		sourcePathTransmittanceIntervalCount: 80,
		incomingDirectionCount: 512,
		transportIntervalCount: 160,
		outgoingFaceWidth: 27,
		positionAltitudesMeters: Array.from({length: 48}, (_, i) => (i === 0 ? 0 : ((i + 0.5) / 48) * 60000)),
		solarZenithDegrees: Array.from({length: 180}, (_, i) => i + 0.5),
		coordinateContract: 'scene-cache-receiver-local-v1',
		sourceDirection: [0, 0, 1],
		numericalPolicy: {id: 'algorithm32-anchored-radial-surface-v2', positionMethod: 'anchored-radial'},
	};
	const incoming = createProductQuadrature(16, 32);
	/** @type {SkyGroundBoundaryPredictionInputs} */
	const inputs = {
		commonParameters: p,
		incomingPackedFloat32: Array.from(
			Float32Array.from(incoming.unitVectors.flatMap((v, i) => [...v, incoming.integrationWeightsSteradians[i]])),
		),
		groundHemisphere: 'incomingRecord.z < 0',
		sourceQuantity: 'sourceIrradianceDensityWattsPerSquareMeterPerNanometer',
		sourceTransmittanceOperation: 'multiply',
	};
	/** @type {SkyGroundArithmeticNode[]} */
	const nodes = [
		{x: 0, y: 48 * 50, outgoingDirectionFloat32: [0, 0, 1]},
		{x: 1, y: 48 * 70, outgoingDirectionFloat32: [1, 0, 0]},
	];
	const plan = prepareGroundArithmetic(inputs, nodes);
	assert.equal(plan.rows.length, 2);
	checks++;
	for (const row of plan.rows) {
		assert.ok(row.source.b0[0] > 0 && row.source.transmission[0] > 0 && row.source.transmission[1] < 1);
		checks++;
		assert.ok(row.addedUnaccumulated[0] > 0 && row.addedUnaccumulated[1] > row.addedUnaccumulated[0]);
		checks++;
		assert.ok(row.maxScatteringRatio > 1 && row.oldShadowMultiplier > 0);
		checks++;
		assert.ok(Math.abs(row.packedRayleighHalfspace - 0.5) < 2e-7);
		checks++;
		assert.ok(row.packedMieHalfspace > 0);
		checks++;
		assert.ok(row.minimumPowBase >= 1 / 16 && row.maximumPowBase <= 4);
		checks++;
		assert.ok(row.maxUpperTermRatio >= row.maxScatteringRatio);
		checks++;
	}
	const samples = plan.rows.map((row) => ({
		...row,
		solarZenithIndex: row.solarZenithIndex,
		shadowValue: 0,
		correctedValue: Math.fround(row.idealPacked),
		difference: Math.fround(row.idealPacked),
	}));
	assert.equal(assessGroundArithmetic(plan, precision, samples).state, 'passed');
	checks++;
	const wrong = samples.map((row) => ({...row, correctedValue: 0, difference: 0}));
	assert.equal(assessGroundArithmetic(plan, precision, wrong).state, 'failed');
	checks++;
	assert.throws(() => assessGroundArithmetic(plan, precision, samples.slice(1)));
	checks++;
	assert.throws(() => prepareGroundArithmetic({...inputs, commonParameters: {...p, miePhaseFunctionG: 0.99}}, nodes));
	checks++;
	assert.throws(() => prepareGroundArithmetic(inputs, [{...nodes[0], y: 1}]));
	checks++;
	return {schemaId: 'sky-ground-arithmetic-proof-v1', checks, gpuExecuted: false};
}
