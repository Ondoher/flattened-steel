import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {
	assertGroundBoundaryShadow,
	groundBoundaryP2Rows,
	groundBoundaryParentRun,
	assertGroundBoundaryCommonSource,
} from './reader.mjs';

/** Manufacture exact dyadic allowances and the original seven-method envelope equation.
 * @param {number} change - Added grouped effective P2 at both selected rays.
 * @param {boolean} [unresolved] - Missing original method optical-depth admission.
 * @returns {SkyContinuationChannelDiagnostics} Selected synthetic rows only, not full C0 capture evidence.
 */
function diagnostic(change, unresolved = false) {
	const allowance = 2 ** -12;
	/** @type {SkyContinuationProbeDiagnostic[]} */ const probes = [];
	for (const [index, probeId] of ['p-0930-5-7', 'p-1230-3-5'].entries())
		for (const order of [1, 2]) {
			const value = order === 1 ? 1 : 3 + change,
				missing = unresolved && order === 2;
			const common = {
				probeId,
				sceneId: index ? 'noon' : 'morning',
				time: index ? '12:30' : '09:30',
				gridX: index ? 3 : 5,
				gridY: index ? 5 : 7,
				order,
				representationId: 'grouped',
			};
			for (const methodId of ['gauss4', 'gauss8', 'gauss8-split', 'simpson8', 'simpson16', 'simpson32'])
				probes.push({
					...common,
					methodId,
					value,
					errorAllowance: missing && methodId === 'gauss4' ? null : allowance,
					evaluationCount: 1,
				});
			probes.push({
				...common,
				methodId: 'reference-envelope',
				value,
				errorAllowance: missing ? null : allowance,
				evaluationCount: 0,
				limitations: missing ? ['At least one optical-depth prefix is unresolved.'] : [],
			});
		}
	return {
		schemaId: 'sky-continuation-channel-diagnostics-v1',
		scope: 'component-probes',
		units: 'W m^-2 sr^-1 nm^-1',
		queryCount: 1,
		preparationEvaluationCount: 1,
		evaluationCount: 24,
		allowancePolicy: 'Manufactured dyadic allowances; no physical evidence.',
		probes,
	};
}

/** Verify exact historical scope, strict positive-side threshold and unresolved comparisons in memory.
 * @returns {SkyGroundBoundaryTargetProof} Local checks only; no GPU, files or immutable runs created.
 */
export function groundBoundaryTargetProof() {
	let checks = 0;
	const format = (value) => value.toExponential(17).replace('e+', 'e');
	const constants = Array.from({length: 180}, () => format(0.5));
	const common = (values) =>
		'prefix\nconst float SOLAR_ZENITH_COSINES[180] = float[180](' + values.join(', ') + ');\nsuffix';
	const expectedCommon = common(constants);
	assert.deepEqual(assertGroundBoundaryCommonSource(expectedCommon, expectedCommon).differingCosineIndexes, []);
	checks++;
	const adjacent = [...constants];
	adjacent[31] = format(0.5 + 2 ** -53);
	assert.deepEqual(assertGroundBoundaryCommonSource(common(adjacent), expectedCommon).differingCosineIndexes, [31]);
	checks++;
	assert.throws(() =>
		assertGroundBoundaryCommonSource(common(adjacent).replace('suffix', 'changed'), expectedCommon),
	);
	checks++;
	const excessive = [...constants];
	excessive[31] = format(0.5 + 4 * 2 ** -53);
	assert.throws(() => assertGroundBoundaryCommonSource(common(excessive), expectedCommon));
	checks++;
	const differentFloat = [...constants];
	differentFloat[31] = format(0.5001);
	assert.throws(() => assertGroundBoundaryCommonSource(common(differentFloat), expectedCommon));
	checks++;
	assert.throws(() => assertGroundBoundaryCommonSource(expectedCommon + '\n' + expectedCommon, expectedCommon));
	checks++;
	const fields = ['J1', 'J2', 'J3', 'J4'].map((fieldId, i) => ({
		fieldId,
		count: 3,
		minimum: 0,
		maximum: 2,
		pureSha256: String(i + 1).repeat(64),
		cumulativeSha256: String(i + 5).repeat(64),
	}));
	/** @type {SkyMatchedOrdersPrefix} */ const expected = {
		coordinateCount: 3,
		coordinateSha256: 'a'.repeat(64),
		shape: {representationCount: 1, viewCount: 2, orderCount: 4, rayCount: 243},
		fieldChecks: fields,
		spectraSha256: 'b'.repeat(64),
		referenceRowsSha256: 'c'.repeat(64),
		referenceRowCount: 2240,
	};
	/** @type {SkyGroundBoundaryShadowProof} */ const shadow = {
		schemaId: 'sky-ground-boundary-shadow-proof-v1',
		coordinateCount: 3,
		coordinateSha256: expected.coordinateSha256,
		fieldId: 'J2-shadow',
		originalFieldId: 'J2',
		count: 3,
		minimum: 0,
		maximum: 2,
		pureSha256: fields[1].pureSha256,
	};
	assert.equal(assertGroundBoundaryShadow(shadow, fields, expected), shadow);
	checks++;
	for (const altered of [
		{...shadow, coordinateCount: 2},
		{...shadow, coordinateSha256: 'd'.repeat(64)},
		{...shadow, pureSha256: fields[2].pureSha256},
		{...shadow, fieldId: 'J2'},
		{...shadow, originalFieldId: 'J3'},
		{...shadow, count: 4},
		{...shadow, minimum: 1},
		{...shadow, maximum: 3},
		{...shadow, schemaId: 'borrowed-original-schema'},
	]) {
		assert.throws(() => assertGroundBoundaryShadow(altered, fields, expected));
		checks++;
	}
	assert.throws(() => assertGroundBoundaryShadow(shadow, [fields[1], fields[0], ...fields.slice(2)], expected));
	checks++;
	assert.throws(() =>
		assertGroundBoundaryShadow(shadow, [{...fields[0], pureSha256: 'e'.repeat(64)}, ...fields.slice(1)], expected),
	);
	checks++;
	// Later changed J fields are not falsely required to match the original intervention-free cache.
	assert.equal(
		assertGroundBoundaryShadow(
			shadow,
			[...fields.slice(0, 1), ...fields.slice(1).map((f) => ({...f, pureSha256: 'f'.repeat(64)}))],
			expected,
		),
		shadow,
	);
	checks++;
	assert.match(groundBoundaryParentRun('ground-j2-p48-raw'), /00103-c-r0-scr$/u);
	checks++;
	assert.match(groundBoundaryParentRun('ground-j2-p55-raw'), /00132-c-d55-raw$/u);
	checks++;
	assert.throws(() => groundBoundaryParentRun(/** @type {SkyGroundBoundaryCaseId} */ ('ground-j2-p55-factored')));
	checks++;
	/** @type {SkyGroundBoundaryMorningReference} */ const reference = {
		run: 'manufactured',
		identities: [],
		channels: [0, 8].map((channel) => ({channel, referenceWatts: 2, allowanceWatts: 2 ** -20})),
	};
	const original = diagnostic(0),
		allowance = 2 ** -12;
	for (const channel of [0, 8]) {
		const positive = groundBoundaryP2Rows(diagnostic(8 * allowance), original, channel, reference);
		assert.equal(positive.length, 2);
		checks++;
		for (const row of positive) {
			assert.equal(row.beforeWatts, 2);
			checks++;
			assert.equal(row.afterWatts, 2 + 8 * allowance);
			checks++;
			assert.equal(row.deltaWatts, 8 * allowance);
			checks++;
			assert.equal(row.comparisonAllowanceWatts, 4 * allowance);
			checks++;
			assert.equal(row.state, 'passed');
			checks++;
		}
		assert.equal(positive[0].physical.state, 'available');
		checks++;
		assert.equal(positive[1].physical.state, 'unresolved');
		checks++;
		for (const change of [4 * allowance, 0, -8 * allowance]) {
			assert.ok(
				groundBoundaryP2Rows(diagnostic(change), original, channel, reference).every(
					(r) => r.state === 'failed',
				),
			);
			checks++;
		}
		for (const row of groundBoundaryP2Rows(diagnostic(8 * allowance, true), original, channel, reference)) {
			assert.equal(row.state, 'unresolved');
			checks++;
			assert.equal(row.comparisonAllowanceWatts, null);
			checks++;
			assert.equal(row.beforeAllowanceWatts, 2 * allowance);
			checks++;
			assert.equal(row.afterAllowanceWatts, null);
			checks++;
		}
	}
	const incomplete = {...original, probes: original.probes.slice(1)};
	assert.throws(() => groundBoundaryP2Rows(incomplete, original, 0, reference));
	checks++;
	const changedJ1 = {...original, probes: original.probes.map((row) => (row.order === 1 ? {...row, value: 2} : row))};
	assert.throws(() => groundBoundaryP2Rows(changedJ1, original, 0, reference));
	checks++;
	return {schemaId: 'sky-ground-boundary-target-proof-v1', checks, gpuExecuted: false};
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url))
	console.log(JSON.stringify(groundBoundaryTargetProof(), null, 2));
