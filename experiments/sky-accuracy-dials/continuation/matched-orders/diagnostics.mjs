import assert from 'node:assert/strict';
import {checkedEnvelope} from '../ladder/read.mjs';
import {matchedOrderSlots} from './evaluate.js';

/** Validate the closed actual-order payload before it can become retained evidence.
 * Original N4 decoders are never used for this schema. Every original seven-row
 * envelope is nevertheless independently recomputed by its existing equation.
 * @param {unknown} value - Browser-supplied bounded compiler extension.
 * @param {readonly SkyContinuationProbe[]} probes - Exact original C0 forty-ray inventory.
 * @param {number} channel - Expected zero/eight endpoint.
 * @returns {SkyMatchedOrderDiagnostics} Complete validated actual-order payload.
 */
export function validateMatchedOrderDiagnostics(value, probes, channel) {
	assert.ok(value && typeof value === 'object' && !Array.isArray(value));
	const record = /** @type {SkyMatchedOrderDiagnostics} */ (value);
	assert.equal(record.schemaId, 'sky-matched-order-diagnostics-v1');
	assert.equal(record.scope, 'original-c0-probes-two-channels');
	assert.equal(record.units, 'W m^-2 sr^-1 nm^-1');
	assert.ok([0, 8].includes(channel));
	assert.equal(record.channel, channel);
	assert.deepEqual(record.actualOrders, [1, 2, 3, 4, 5, 6]);
	assert.deepEqual(record.slotDerivations, matchedOrderSlots);
	assert.equal(probes.length, 40);
	assert.equal(new Set(probes.map((probe) => probe.probeId)).size, 40);
	assert.ok(Array.isArray(record.rows));
	assert.equal(record.rows.length, 40 * 6 * 7);
	assert.equal(record.prefixReferenceRowCount, 40 * 4 * 2 * 7);
	assert.equal(record.extensionPrefixComparisons, 40 * 2 * 7);
	assert.ok(
		typeof record.allowancePolicy === 'string' &&
			record.allowancePolicy.length > 0 &&
			record.allowancePolicy.length <= 4096,
	);
	for (const count of [
		record.queryCount,
		record.preparationEvaluationCount,
		record.prefixEvaluationCount,
		record.extensionEvaluationCount,
		record.evaluationCount,
		record.retainedEvaluationCount,
	])
		assert.ok(Number.isSafeInteger(count) && count >= 0);
	assert.ok(record.queryCount > 0);
	assert.equal(record.evaluationCount, record.prefixEvaluationCount + record.extensionEvaluationCount);
	assert.equal(
		record.retainedEvaluationCount,
		record.rows.reduce((sum, row) => sum + row.evaluationCount, 0),
	);
	assert.equal(
		record.prefixEvaluationCount,
		2 * record.rows.filter((row) => row.order <= 4).reduce((sum, row) => sum + row.evaluationCount, 0),
	);
	assert.equal(
		record.extensionEvaluationCount,
		record.rows.filter((row) => row.order >= 3).reduce((sum, row) => sum + row.evaluationCount, 0),
	);
	assert.ok(record.evaluationCount >= record.retainedEvaluationCount);
	const addresses = new Set();
	for (const row of record.rows) {
		const probe = probes.find((item) => item.probeId === row.probeId);
		assert.ok(probe);
		assert.equal(row.time, probe.time);
		assert.equal(row.gridX, probe.gridX);
		assert.equal(row.gridY, probe.gridY);
		assert.match(row.sceneId, /^[A-Za-z0-9][A-Za-z0-9._-]{0,95}$/u);
		assert.equal(row.representationId, 'grouped');
		assert.ok(Number.isInteger(row.order) && row.order >= 1 && row.order <= 6);
		assert.ok(Number.isFinite(row.value) && row.value >= 0);
		assert.ok(row.errorAllowance === null || (Number.isFinite(row.errorAllowance) && row.errorAllowance >= 0));
		assert.ok(Number.isSafeInteger(row.evaluationCount) && row.evaluationCount >= 0);
		assert.equal(
			row.evaluationCount,
			record.rows.find(
				(value) => value.probeId === row.probeId && value.order === 1 && value.methodId === row.methodId,
			)?.evaluationCount,
		);
		if (row.methodId === 'reference-envelope') assert.equal(row.evaluationCount, 0);
		if (row.limitations !== undefined)
			assert.ok(
				Array.isArray(row.limitations) &&
					row.limitations.length <= 16 &&
					row.limitations.every(
						(reason) => typeof reason === 'string' && reason.length > 0 && reason.length <= 1024,
					),
			);
		const key = `${row.probeId}:${row.order}:${row.methodId}`;
		assert.ok(!addresses.has(key));
		addresses.add(key);
	}
	for (const probe of probes)
		for (const order of record.actualOrders)
			checkedEnvelope(record.rows.filter((row) => row.probeId === probe.probeId && row.order === order));
	return record;
}

/** Assess the two preregistered finite-increment predictions without claiming a tail bound.
 * The P1/P2 substitution prediction is intentionally caller-owned and unresolved
 * until independently admitted physical component references are supplied.
 * @param {SkyMatchedOrderDiagnostics} diagnostics - Validated complete actual-order rows.
 * @returns {SkyMatchedOrderPrediction[]} Two predictions on each selected original physical ray.
 */
export function assessMatchedOrderPredictions(diagnostics) {
	return ['p-0930-5-7', 'p-1230-3-5'].flatMap((probeId) => {
		const values = [4, 5, 6].map((order) =>
			diagnostics.rows.find(
				(row) => row.probeId === probeId && row.order === order && row.methodId === 'reference-envelope',
			),
		);
		const complete = values.every((row) => row && row.errorAllowance !== null);
		const [e4, e5, e6] = values;
		const fifthIncrementWatts = complete ? e5.value - e4.value : null,
			sixthIncrementWatts = complete ? e6.value - e5.value : null,
			fifthAllowanceWatts = complete ? e5.errorAllowance + e4.errorAllowance : null,
			sixthAllowanceWatts = complete ? e6.errorAllowance + e5.errorAllowance : null;
		const common = {
			channel: diagnostics.channel,
			probeId,
			fifthIncrementWatts,
			sixthIncrementWatts,
			fifthAllowanceWatts,
			sixthAllowanceWatts,
		};
		return [
			{
				...common,
				id: 'matched-added-increments-positive',
				state: /** @type {SkyVolumeCheckState} */ (
					!complete
						? 'unresolved'
						: fifthIncrementWatts > fifthAllowanceWatts && sixthIncrementWatts > sixthAllowanceWatts
							? 'passed'
							: 'failed'
				),
			},
			{
				...common,
				id: 'matched-finite-increment-ratio',
				state: /** @type {SkyVolumeCheckState} */ (
					!complete
						? 'unresolved'
						: sixthIncrementWatts + sixthAllowanceWatts >=
									0.25 * (fifthIncrementWatts - fifthAllowanceWatts) &&
							  sixthIncrementWatts - sixthAllowanceWatts <=
									0.65 * (fifthIncrementWatts + fifthAllowanceWatts)
							? 'passed'
							: 'failed'
				),
			},
		];
	});
}
