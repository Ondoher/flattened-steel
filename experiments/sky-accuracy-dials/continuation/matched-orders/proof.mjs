import assert from 'node:assert/strict';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {evaluateOrders} from '../../numerics/view.js';
import {readRegistration} from '../registration/run.mjs';
import {evaluateMatchedOrderViews, matchedOrderCanonical, prepareMatchedOrderViews} from './evaluate.js';
import {validateMatchedOrderDiagnostics, assessMatchedOrderPredictions} from './diagnostics.mjs';
import {assertMatchedOrdersPrefix, readMatchedOrdersParent} from './read.mjs';

/** Exercise actual-order mapping, sparse indexing, envelope identities and strict rejection.
 * All source fields, optical-depth columns and short ray supports are prescribed
 * in memory. Original H supplies immutable spectral coefficients and probe names;
 * no GPU, atmospheric solver, run allocation or evidence write occurs.
 * @param {SkyGpuControl} control - Authenticated original H control.
 * @returns {SkyMatchedOrdersProof} Actual assertion count.
 */
export function matchedOrdersProof(control) {
	let checks = 0;
	/** @param {unknown} value - Required predicate. @returns {void} Count one successful assertion. */
	const check = (value) => {
		assert.ok(value);
		checks++;
	};
	const probes = control.continuation.probes,
		R = control.buildRequest.transportSpec.planet.bottomRadiusMeters;
	/** @type {SkyViewSample} */ const sample = {
		point: [0, 0, R + 1],
		step: 1,
		altitude: 1,
		altitudeWeights: [1],
		directionWeights: [1],
		solarFraction: 0.25,
		firstSolarInterval: false,
		lastSolarInterval: false,
		indices: [0, 1, 2, 3],
	};
	/** @type {SkyFieldCoordinate[]} */ const coordinates = [0, 1, 2, 3].map((solarIndex) => ({
		x: solarIndex,
		y: 0,
		altitudeIndex: 0,
		solarIndex,
		directionIndex: 0,
		label: `manufactured-${solarIndex}`,
	}));
	const rays = probes.map((probe) => ({
		sceneIndex: 0,
		sceneId: control.continuation.probeScenes.find((scene) => scene.time === probe.time).id,
		time: probe.time,
		gridX: probe.gridX,
		gridY: probe.gridY,
		origin: /** @type {SkyVector3} */ ([0, 0, R]),
		worldDirection: /** @type {SkyVector3} */ ([0, 0, 1]),
		length: 1,
		samples: [sample],
	}));
	/** @type {SkyMatchedOrdersPlan} */ const plan = {
		view: {
			schemaId: 'manufactured-view',
			coordinates,
			rayCount: 40,
			representations: ['cumulative', 'grouped'],
			views: [
				{
					id: 'manufactured',
					viewRule: 'altitude-segmented',
					intervalCount: 1,
					minimumSampleCount: 1,
					maximumSampleCount: 1,
					solarInterpolation: 'monotone-cubic',
					rays,
				},
			],
		},
		referenceIndexes: [0, 1, 2, 3],
		reference: {
			schemaId: 'sky-fixed-field-reference-plan-v1',
			buildRequestId: control.buildRequest.id,
			solarInterpolation: 'monotone-cubic',
			coordinates,
			channels: [0, 8],
			ruleNodeCount: 240,
			uniqueQueryCount: 40,
			rays: probes.map((probe, index) => {
				const prefix = {
					distance: 1,
					rayleighMeters: 0,
					mieMeters: 0,
					errorRayleighMeters: 0,
					errorMieMeters: 0,
					converged: true,
				};
				const node = {distance: 1, prefixIndex: 0, sample};
				return {
					probe: {
						id: probe.probeId,
						time: probe.time,
						gridX: probe.gridX,
						gridY: probe.gridY,
						ray: {origin: rays[index].origin, direction: rays[index].worldDirection, length: 1},
					},
					altitudeSegments: 1,
					rules: {
						gauss4: [node],
						gauss8: [node],
						'gauss8-split': [node],
						simpson8: [node],
						simpson16: [node],
						simpson32: [node],
					},
					distances: [1],
					columns: {gauss: [prefix], simpson: [prefix]},
					columnEvaluations: {gauss: 0, simpson: 0},
				};
			}),
		},
	};
	const fields = Array.from({length: 6}, (_, index) => new Float32Array(4).fill(2 ** -index));
	const result = evaluateMatchedOrderViews(control, plan, 0, fields);
	check(validateMatchedOrderDiagnostics(result.diagnostics, probes, 0) === result.diagnostics);
	check(result.diagnostics.rows.length === 1680 && result.prefixRows.length === 2240);
	check(result.diagnostics.extensionPrefixComparisons === 560);
	check(result.diagnostics.prefixEvaluationCount === 1920 && result.diagnostics.extensionEvaluationCount === 960);
	check(result.diagnostics.evaluationCount === 2880 && result.diagnostics.retainedEvaluationCount === 1440);
	for (const row of result.diagnostics.rows) {
		assert.equal(row.value, 2 - 2 ** (1 - row.order));
		checks++;
		assert.equal(row.errorAllowance, 0);
		checks++;
	}
	const old = evaluateOrders(control.buildRequest, plan.view, 0, fields.slice(0, 4));
	for (let representation = 0; representation < 2; representation++)
		for (let order = 0; order < 4; order++)
			for (let ray = 0; ray < 40; ray++) {
				assert.equal(
					result.evaluation.values[(representation * 6 + order) * 40 + ray],
					old.values[(representation * 4 + order) * 40 + ray],
				);
				checks++;
			}
	check(assessMatchedOrderPredictions(result.diagnostics).every((row) => row.state === 'passed'));
	const varied = fields.map((field, order) =>
		Float32Array.from(field, (value, index) => value * [1, 2, 4, 8][(index + order) % 4]),
	);
	const original = evaluateMatchedOrderViews(control, plan, 0, varied);
	const permuted = varied.map((field) => Float32Array.of(field[2], field[0], field[3], field[1]));
	const remapped = evaluateMatchedOrderViews(control, {...plan, referenceIndexes: [1, 3, 0, 2]}, 0, permuted);
	assert.deepEqual(remapped.prefixRows, original.prefixRows);
	checks++;
	assert.deepEqual(remapped.diagnostics, original.diagnostics);
	checks++;
	const falseSlots = {
		...result.diagnostics,
		slotDerivations: result.diagnostics.slotDerivations.map((row) => ({
			...row,
			actualOrder: /** @type {const} */ (4),
		})),
	};
	assert.throws(() => validateMatchedOrderDiagnostics(falseSlots, probes, 0));
	checks++;
	assert.throws(() =>
		validateMatchedOrderDiagnostics({...result.diagnostics, rows: result.diagnostics.rows.slice(0, -1)}, probes, 0),
	);
	checks++;
	assert.throws(() =>
		validateMatchedOrderDiagnostics(
			{...result.diagnostics, rows: [result.diagnostics.rows[1], ...result.diagnostics.rows.slice(1)]},
			probes,
			0,
		),
	);
	checks++;
	assert.throws(() => validateMatchedOrderDiagnostics({...result.diagnostics, evaluationCount: 0}, probes, 0));
	checks++;
	assert.throws(() => validateMatchedOrderDiagnostics({...result.diagnostics, channel: 8}, probes, 0));
	checks++;
	assert.throws(() =>
		validateMatchedOrderDiagnostics(
			{
				...result.diagnostics,
				rows: result.diagnostics.rows.map((row, index) => (index === 0 ? {...row, value: NaN} : row)),
			},
			probes,
			0,
		),
	);
	checks++;
	assert.throws(() => evaluateMatchedOrderViews(control, plan, 0, fields.slice(0, 4)));
	checks++;
	assert.throws(() =>
		prepareMatchedOrderViews({...control, continuation: {...control.continuation, finalFirstOrder: 'factored'}}),
	);
	checks++;
	const unresolved = {
		...result.diagnostics,
		rows: result.diagnostics.rows.map((row) =>
			row.order === 6 && row.methodId === 'reference-envelope' ? {...row, errorAllowance: null} : row,
		),
	};
	check(assessMatchedOrderPredictions(unresolved).every((row) => row.state === 'unresolved'));
	const failed = {
		...result.diagnostics,
		rows: result.diagnostics.rows.map((row) => (row.order === 6 ? {...row, value: 1.5} : row)),
	};
	check(assessMatchedOrderPredictions(failed).every((row) => row.state === 'failed'));
	/** @type {SkyMatchedOrdersPrefix} */ const expected = {
		coordinateCount: 4,
		coordinateSha256: '0'.repeat(64),
		shape: old.shape,
		fieldChecks: [1, 2, 3, 4].map((order) => ({
			fieldId: `J${order}`,
			count: 4,
			minimum: 0,
			maximum: 1,
			pureSha256: String(order).repeat(64),
			cumulativeSha256: String(order).repeat(64),
		})),
		spectraSha256: '5'.repeat(64),
		referenceRowsSha256: '6'.repeat(64),
		referenceRowCount: 2240,
	};
	const actual = {...expected, sixOrderEvaluatorPrefix: {comparisons: 320, bitExact: true}};
	check(assertMatchedOrdersPrefix(actual, expected) === actual);
	assert.throws(() => assertMatchedOrdersPrefix({...actual, coordinateSha256: '1'.repeat(64)}, expected));
	checks++;
	assert.throws(() => assertMatchedOrdersPrefix({...actual, spectraSha256: '1'.repeat(64)}, expected));
	checks++;
	assert.throws(() => assertMatchedOrdersPrefix({...actual, referenceRowsSha256: '1'.repeat(64)}, expected));
	checks++;
	assert.throws(() => assertMatchedOrdersPrefix({...actual, fieldChecks: actual.fieldChecks.slice(1)}, expected));
	checks++;
	assert.throws(() =>
		assertMatchedOrdersPrefix({...actual, sixOrderEvaluatorPrefix: {comparisons: 319, bitExact: true}}, expected),
	);
	checks++;
	assert.equal(matchedOrderCanonical({b: 2, a: [1]}), matchedOrderCanonical({a: [1], b: 2}));
	checks++;
	check(matchedOrderCanonical(-0) !== matchedOrderCanonical(0));
	assert.throws(() => matchedOrderCanonical(NaN));
	checks++;
	return {schemaId: 'sky-matched-orders-proof-v1', checks};
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
	const registration = readRegistration('tmp/experiments/sky-accuracy-dials/runs/00099-c0-registration');
	console.log(JSON.stringify(matchedOrdersProof(readMatchedOrdersParent(registration).control), null, 2));
}
