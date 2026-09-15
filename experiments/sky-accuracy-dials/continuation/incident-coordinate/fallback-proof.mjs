import assert from 'node:assert/strict';
import {loadInputs} from '../../execution.mjs';
import {sha256} from '../../io/files.mjs';
import {physicalReferencePolicy} from '../reference/physical/policy.mjs';
import {resolveVolumeGeometry} from '../volume-reference/geometry.mjs';
import {assembleClosestVolumeResult} from './index.mjs';
import {incidentCoordinateSources, incidentFineComparisons, refineIncidentRows} from './fallback.mjs';

/** Manufacture complete method evidence without evaluating a physical radiance.
 * @param {SkyPhysicalReferenceMethod} method - Independent method identity.
 * @param {readonly number[]} values - Complete component-major fine values.
 * @param {readonly number[]} [coarse=values] - Optional pass-consistency intervention.
 * @returns {SkyPhysicalMethodResult} Small internally accounted original method.
 */
function manufacturedMethod(method, values, coarse = values) {
	return {
		method, values: [...values], coarseValues: [...coarse],
		refinementDifferences: values.map((value, index) => Math.abs(value - coarse[index])),
		outerErrors: values.map(() => 0), innerAllowances: values.map(() => 0),
		mediumEvaluations: 20, outerEvaluations: 4, converged: true, reasons: [],
		passes: [4, 1].map((toleranceScale) => ({
			toleranceScale, elapsedMilliseconds: 0, mediumEvaluations: 10, outerEvaluations: 2,
			columnCalls: 2, maximumColumnEvaluationsUsed: 5, converged: true, reason: null,
		})),
	};
}

/** Check shape, unsupported failures, identity, fine comparisons and interrupted evidence.
 * Manufactured empty-ray attempts query no medium or outer integrand and write no evidence.
 * @returns {SkyIncidentFallbackProof} Manufactured-only proof result.
 */
export function incidentFallbackProof() {
	const spec = loadInputs().native48.transportSpec,
		channels = [0, 8],
		geometry = resolveVolumeGeometry(spec, [0, 0, spec.planet.topRadiusMeters], [0, 0, 1]);
	const values = [0.01, 0.02, 0, 0, 0.01, 0.02],
		coarse = [0.011, 0.02, 0, 0, 0.011, 0.02];
	const gauss = manufacturedMethod('gauss', values),
		simpson = manufacturedMethod('simpson', values);
	/** @param {SkyPhysicalMethodResult} g - Gauss evidence. @param {SkyPhysicalMethodResult} s - Simpson evidence.
	 * @returns {SkyVolumeResult} Original schema with independently assembled admissions. */
	const original = (g, s) => ({
		...assembleClosestVolumeResult(geometry, channels, g, s, {profile: 'simpson-expanded-medium', outerStrategy: 'global'}),
		schemaId: 'sky-independent-volume-l1-v1',
	});
	const resolved = original(gauss, simpson),
		inconsistent = original(gauss, manufacturedMethod('simpson', values, coarse));
	let guardCalls = 0,
		checks = 0;
	const guard = () => { guardCalls++; };
	/** @param {SkyVolumeResult} result - Manufactured evidence. @param {string} id - Unique identifier.
	 * @returns {SkyVolumeWorkerRow} Exact immutable-style worker row. */
	const row = (result, id) => ({id, result, elapsedMilliseconds: 123.5});
	const resolvedRow = row(resolved, 'resolved'),
		before = JSON.stringify(resolvedRow);
	const untouched = refineIncidentRows(spec, channels, [resolvedRow], guard);
	assert.strictEqual(untouched.rows[0], resolvedRow); checks++;
	assert.equal(JSON.stringify(resolvedRow), before); checks++;
	assert.deepEqual(untouched.records, []); checks++;
	assert.deepEqual(untouched.originalWitnesses, []); checks++;
	assert.equal(untouched.extraWork.mediumEvaluations + untouched.extraWork.outerEvaluations, 0); checks++;
	assert.ok(guardCalls >= 2 && untouched.extraWork.mainThreadMilliseconds >= 0); checks++;
	const missing = structuredClone(inconsistent);
	missing.methods[1].passes.pop();
	missing.methods[1].converged = false;
	const missingValues = structuredClone(inconsistent);
	missingValues.methods[1].innerAllowances = null;
	const exhausted = structuredClone(inconsistent),
		cap = physicalReferencePolicy('simpson-expanded-medium').maximumMediumEvaluations.simpson;
	exhausted.methods[1].mediumEvaluations = cap;
	exhausted.methods[1].passes[0].mediumEvaluations = cap - 10;
	const otherFailure = original(gauss, manufacturedMethod('simpson', values.map((value) => value + 0.001)));
	const gaussFailure = original(manufacturedMethod('gauss', values, coarse), simpson);
	const outerFailure = structuredClone(inconsistent);
	outerFailure.methods[1].outerErrors[0] = 1;
	const unsupported = [
		{...inconsistent, schemaId: 'sky-independent-volume-closest-l1-v1'},
		{...inconsistent, outerStrategy: /** @type {SkyPhysicalOuterStrategy} */ ('local')},
		missing, missingValues, exhausted, otherFailure, gaussFailure, outerFailure,
		{...inconsistent, schemaId: 'unknown-volume-schema'},
	].map((result, index) => row(result, `unsupported-${index}`));
	const snapshots = unsupported.map((value) => JSON.stringify(value));
	const unchanged = refineIncidentRows(spec, channels, unsupported, guard);
	for (const [index, value] of unsupported.entries()) {
		assert.strictEqual(unchanged.rows[index], value); checks++;
		assert.equal(JSON.stringify(value), snapshots[index]); checks++;
	}
	assert.equal(unchanged.records.length, 0); checks++;
	assert.equal(unchanged.originalWitnesses.length, 8); checks++;
	assert.equal(unchanged.extraWork.mediumEvaluations + unchanged.extraWork.outerEvaluations, 0); checks++;
	for (let index = 0; index < 8; index++) {
		assert.strictEqual(unchanged.originalWitnesses[index], unsupported[index].result); checks++;
	}
	assert.throws(() => refineIncidentRows(spec, channels, [resolvedRow, resolvedRow], guard)); checks++;
	assert.throws(() => refineIncidentRows(spec, [8, 0], [resolvedRow], guard)); checks++;
	const tampered = {
		...inconsistent,
		numericalPolicy: {...inconsistent.numericalPolicy, maximumOuterEvaluations: inconsistent.numericalPolicy.maximumOuterEvaluations + 1},
	};
	assert.throws(() => refineIncidentRows(spec, channels, [row(tampered, 'tampered')], guard)); checks++;
	const invalidWork = structuredClone(inconsistent);
	invalidWork.methods[1].mediumEvaluations++;
	assert.throws(() => refineIncidentRows(spec, channels, [row(invalidWork, 'invalid-work')], guard)); checks++;
	const sentinel = new Error('Manufactured cancellation');
	assert.throws(() => refineIncidentRows(spec, channels, [], () => { throw sentinel; }), (error) => error === sentinel); checks++;
	const comparisons = incidentFineComparisons([gauss, simpson], [gauss, simpson], values.length);
	assert.equal(comparisons.length, 4 * values.length); checks++;
	assert.ok(comparisons.every((comparison) => comparison.passed)); checks++;
	const shifted = manufacturedMethod('simpson', values.map((value) => value + 0.001));
	const rejected = incidentFineComparisons([gauss, simpson], [gauss, shifted], values.length);
	assert.equal(rejected.filter((comparison) => !comparison.passed).length, 2 * values.length); checks++;
	assert.ok(rejected.some((comparison) => comparison.index >= 2 * channels.length && !comparison.passed)); checks++;
	const absent = {...simpson, values: null, innerAllowances: null};
	const unavailable = incidentFineComparisons([gauss, simpson], [gauss, absent], values.length);
	assert.equal(unavailable.filter((comparison) => comparison.allowanceWatts === null && !comparison.passed).length, 2 * values.length); checks++;
	const sources = incidentCoordinateSources();
	assert.deepEqual(sources.map((source) => source.path.split('/').at(-1)), ['geometry.mjs', 'index.mjs', 'method.mjs', 'fallback.mjs']); checks++;
	assert.ok(sources.every((source) => source.byteLength > 0 && /^[0-9a-f]{64}$/u.test(source.sha256))); checks++;
	// The exact empty top-outward path performs no optical or outer evaluations.
	// It exercises completed-attempt callbacks before a subsequent batch guard.
	const zero = values.map(() => 0),
		zeroCoarse = zero.map((value, index) => index === 0 || index === 4 ? 1e-6 : value);
	const terminalFailure = original(manufacturedMethod('gauss', zero), manufacturedMethod('simpson', zero, zeroCoarse));
	const terminalRow = row(terminalFailure, 'completed-before-stop'),
		terminalSnapshot = JSON.stringify(terminalRow);
	/** @type {SkyIncidentFallbackRecord[]} */ const savedRecords = [];
	/** @type {SkyVolumeWorkerRow[]} */ const savedRows = [];
	/** @type {SkyIncidentFallbackWork[]} */ const savedWork = [];
	/** @type {SkyVolumeResult[]} */ const savedWitnesses = [];
	let stopAfterAttempt = false,
		unexpectedInterruptions = 0;
	assert.throws(() => refineIncidentRows(spec, channels, [terminalRow, row(terminalFailure, 'never-started')],
		() => { if (stopAfterAttempt) throw sentinel; },
		(record, returnedRow, extraWork, witness) => {
			savedRecords.push(record); savedRows.push(returnedRow); savedWork.push(extraWork); savedWitnesses.push(witness);
			stopAfterAttempt = true;
		},
		() => { unexpectedInterruptions++; },
	), (error) => error === sentinel); checks++;
	assert.equal(savedRecords.length, 1); checks++;
	assert.equal(unexpectedInterruptions, 0); checks++;
	assert.ok(savedRecords[0].replaced && savedRows[0].result.resolved); checks++;
	assert.equal(savedRecords[0].candidateSimpson.mediumEvaluations + savedRecords[0].candidateSimpson.outerEvaluations, 0); checks++;
	assert.strictEqual(savedRows[0].result.methods[0], terminalFailure.methods[0]); checks++;
	assert.equal(savedRows[0].elapsedMilliseconds, terminalRow.elapsedMilliseconds); checks++;
	assert.strictEqual(savedWitnesses[0], terminalFailure); checks++;
	assert.equal(JSON.stringify(terminalRow), terminalSnapshot); checks++;
	for (const key of /** @type {const} */ (['mediumEvaluations', 'outerEvaluations'])) {
		const originalWork = terminalFailure.methods.reduce((sum, method) => sum + method[key], 0),
			returnedWork = savedRows[0].result.methods.reduce((sum, method) => sum + method[key], 0);
		assert.equal(returnedWork + savedWork[0][key], originalWork + savedRecords[0].candidateSimpson[key]); checks++;
	}
	assert.ok(savedWork[0].mainThreadMilliseconds >= 0); checks++;
	// A completed rejected candidate must also reach the observer before a final guard.
	let rejectedObserved = false;
	const rejectedRow = row(inconsistent, 'rejected-before-stop');
	assert.throws(() => refineIncidentRows(spec, channels, [rejectedRow],
		() => { if (rejectedObserved) throw sentinel; },
		(record, returnedRow, extraWork, witness) => {
			assert.equal(record.replaced, false); checks++;
			assert.strictEqual(returnedRow, rejectedRow); checks++;
			assert.strictEqual(witness, inconsistent); checks++;
			assert.equal(extraWork.mediumEvaluations, record.candidateSimpson.mediumEvaluations); checks++;
			assert.equal(extraWork.outerEvaluations, record.candidateSimpson.outerEvaluations); checks++;
			rejectedObserved = true;
		},
	), (error) => error === sentinel); checks++;
	assert.ok(rejectedObserved); checks++;
	// A guard inside the new method cannot supply counters; retain an explicit unfinished identity.
	/** @type {SkyIncidentFallbackInterruption[]} */ const interruptions = [];
	let methodGuardCalls = 0,
		incompleteAttemptCallbacks = 0;
	assert.throws(() => refineIncidentRows(spec, channels, [terminalRow],
		() => { if (++methodGuardCalls === 3) throw sentinel; },
		() => { incompleteAttemptCallbacks++; },
		(interruption, witness) => {
			interruptions.push(interruption);
			assert.strictEqual(witness, terminalFailure); checks++;
		},
	), (error) => error === sentinel); checks++;
	assert.equal(interruptions.length, 1); checks++;
	assert.equal(incompleteAttemptCallbacks, 0); checks++;
	assert.equal(interruptions[0].id, terminalRow.id); checks++;
	assert.equal(interruptions[0].originalResultSha256, sha256(JSON.stringify(terminalFailure))); checks++;
	assert.equal(interruptions[0].geometrySha256, sha256(JSON.stringify(terminalFailure.geometry))); checks++;
	assert.equal(interruptions[0].candidateSimpson, null); checks++;
	assert.equal(interruptions[0].mediumEvaluations, null); checks++;
	assert.equal(interruptions[0].outerEvaluations, null); checks++;
	assert.equal(interruptions[0].failure, sentinel.message); checks++;
	assert.ok(interruptions[0].mainThreadMilliseconds >= 0); checks++;
	return {schemaId: 'sky-incident-fallback-manufactured-proof-v1', checks, attempted: 3, replaced: 1};
}

/** Exercise the actual eight saved failures only after the coordinate witness gate passes.
 * The caller supplies authenticated original witnesses, authorizes this physical
 * exercise, and owns the guard. This entry performs no filesystem writes.
 * @param {SkyTransportSpec} spec - Original physical input.
 * @param {readonly SkyVolumeResult[]} witnesses - Exact eight original unresolved results.
 * @param {() => void} guard - Cooperative parent execution guard.
 * @returns {SkyIncidentFallbackProof} Actual admission, identity and combined-work checks.
 */
export function incidentFallbackWitnessProof(spec, witnesses, guard) {
	assert.equal(witnesses.length, 8);
	assert.ok(witnesses.every((witness) => !witness.resolved));
	const originals = witnesses.map((witness) => JSON.stringify(witness));
	const rows = witnesses.map((result, index) => ({id: `saved-witness-${index}`, result, elapsedMilliseconds: 0}));
	const refined = refineIncidentRows(spec, [0, 8], rows, guard);
	let checks = 2;
	assert.equal(refined.records.length, 8); checks++;
	assert.ok(refined.rows.every((row) => row.result.resolved)); checks++;
	for (const [index, row] of refined.rows.entries()) {
		const old = witnesses[index], record = refined.records[index];
		assert.strictEqual(row.result.methods[0], old.methods[0]); checks++;
		assert.strictEqual(row.result.geometry, old.geometry); checks++;
		assert.equal(row.elapsedMilliseconds, rows[index].elapsedMilliseconds); checks++;
		assert.equal(row.result.schemaId, 'sky-independent-volume-closest-l1-v1'); checks++;
		assert.equal(JSON.stringify(old), originals[index]); checks++;
		assert.equal(record.originalResultSha256, sha256(originals[index])); checks++;
		assert.ok(record.replaced && record.comparisons.every((comparison) => comparison.passed)); checks++;
		assert.ok(old.methods[1].mediumEvaluations + record.candidateSimpson.mediumEvaluations <= old.numericalPolicy.maximumMediumEvaluations.simpson); checks++;
		assert.ok(old.methods[1].outerEvaluations + record.candidateSimpson.outerEvaluations <= old.numericalPolicy.maximumOuterEvaluations); checks++;
		assert.strictEqual(refined.originalWitnesses[index], old); checks++;
	}
	for (const key of /** @type {const} */ (['mediumEvaluations', 'outerEvaluations'])) {
		const originalWork = witnesses.reduce((sum, witness) => sum + witness.methods.reduce((value, method) => value + method[key], 0), 0);
		const newWork = refined.records.reduce((sum, record) => sum + record.candidateSimpson[key], 0);
		const returnedWork = refined.rows.reduce((sum, row) => sum + row.result.methods.reduce((value, method) => value + method[key], 0), 0);
		assert.equal(returnedWork + refined.extraWork[key], originalWork + newWork); checks++;
	}
	assert.ok(refined.extraWork.mainThreadMilliseconds >= refined.records.reduce((sum, record) => sum + record.mainThreadMilliseconds, 0)); checks++;
	return {schemaId: 'sky-incident-fallback-eight-witness-proof-v1', checks, attempted: refined.records.length, replaced: refined.records.filter((record) => record.replaced).length};
}
