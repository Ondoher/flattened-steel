import assert from 'node:assert/strict';
import {matchedOrderAllowance, matchedOrderResidualChange, assessMatchedOrders} from './index.mjs';

/** Manufacture algebra, cancellation, allowance and malformed-prefix witnesses.
 * @returns {SkyMatchedOrderAssessmentProof} Actual executed assertion count.
 */
export function matchedOrderAssessmentProof() {
	let checks = 0;
	/** @param {unknown} condition */ const check = (condition) => {
		assert.ok(condition);
		checks++;
	};
	/** @param {() => unknown} operation */ const rejects = (operation) => {
		assert.throws(operation);
		checks++;
	};
	check(matchedOrderAllowance([1, 2, 0]) === 3);
	check(matchedOrderAllowance([1, null]) === null);
	rejects(() => matchedOrderAllowance([-1]));
	rejects(() => matchedOrderAllowance([NaN]));
	rejects(() => matchedOrderResidualChange(Infinity, 1, 0, 0, 0));
	for (const before of [-2, 0, 2])
		for (const addition of [-0.5, 0, 0.5]) {
			const row = matchedOrderResidualChange(before, addition, 0.03, 0.02, 0.05);
			check(row.afterResidualWatts === before + addition);
			check(row.deltaSseWattsSquared === 2 * before * addition + addition ** 2);
			for (const dr of [-0.03, 0.03])
				for (const dt of [-0.02, 0.02]) {
					const perturbed = 2 * (before + dr) * (addition + dt) + (addition + dt) ** 2;
					check(Math.abs(perturbed - row.deltaSseWattsSquared) <= row.deltaSseAllowanceWattsSquared + 1e-14);
				}
		}
	check(matchedOrderResidualChange(1, 2, null, 0, null).deltaSseAllowanceWattsSquared === null);
	const values = [0.02, 0.03, 0.034, 0.036, 0.037, 0.0375],
		e = 1e-8;
	const probes = [
		['p-0930-5-7', '09:30'],
		['p-1230-3-5', '12:30'],
	];
	/** @type {SkyOrderAttributionRow[]} */ const originals = [];
	for (const [probeId, time] of probes)
		for (const channel of [0, 8]) {
			const physicalFirstResidual = 0.01 - 0.033,
				contributions = [physicalFirstResidual, ...values.slice(1, 4).map((v, i) => v - values[i])],
				firstNumerical = 0.01,
				remaining = values[3] - values[0] + physicalFirstResidual;
			originals.push({
				probeId,
				time,
				channel,
				physicalFirstResidual,
				cumulative: values.slice(0, 4),
				contributions,
				allowances: [e, 2 * e, 2 * e, 2 * e],
				firstNumerical,
				remaining,
				cancellationContributions: contributions.map((v) => 2 * firstNumerical * v),
				identityResidual: 0,
			});
		}
	// Only envelope rows are needed by the pure assessor; production input validation
	// is separately owned by the authenticated complete-payload reader.
	const diagnostics = /** @type {SkyMatchedOrderDiagnostics[]} */ (
		/** @type {unknown} */ (
			[0, 8].map((channel) => ({
				channel,
				rows: probes.flatMap(([probeId, time]) =>
					values.map((value, index) => ({
						probeId,
						time,
						order: index + 1,
						value,
						errorAllowance: e,
						methodId: 'reference-envelope',
					})),
				),
			}))
		)
	);
	const frozen = JSON.stringify({originals, diagnostics}),
		assessed = assessMatchedOrders(originals, diagnostics);
	check(assessed.rows.length === 4);
	check(JSON.stringify({originals, diagnostics}) === frozen);
	check(
		assessed.physicalSubstitution.state === 'unresolved' &&
			assessed.physicalSubstitution.physicalSecondWatts === null,
	);
	for (const row of assessed.rows) {
		check(row.original === originals.find((r) => r.probeId === row.probeId && r.channel === row.channel));
		check(row.cumulativeWatts[3] === values[3]);
		check(row.raw.deltaSseWattsSquared > 0 && row.physicalFirstOnly.deltaSseWattsSquared < 0);
		check(row.raw.additionWatts === row.physicalFirstOnly.additionWatts);
		check(row.finiteAdditionAllowanceWatts === 2 * e);
		check(row.physicalFirstOnly.afterAllowanceWatts === 3 * e);
		check(
			Math.abs(row.baselineSensitivityWattsSquared + 2 * row.original.firstNumerical * row.finiteAdditionWatts) <
				1e-20,
		);
	}
	const wrong = structuredClone(originals);
	wrong[0] = {...wrong[0], cumulative: [0.01, ...wrong[0].cumulative.slice(1)]};
	rejects(() => assessMatchedOrders(wrong, diagnostics));
	rejects(() => assessMatchedOrders([...originals, originals[0]], diagnostics));
	rejects(() => assessMatchedOrders(originals, [...diagnostics].reverse()));
	return {schemaId: 'sky-matched-h-order-assessment-proof-v1', checks};
}
