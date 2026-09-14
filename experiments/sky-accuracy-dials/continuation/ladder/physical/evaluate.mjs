import assert from 'node:assert/strict';
import {ALL_RAYS} from '../../../analysis/boundary.mjs';
import {completeNorm, ladderGroups, localReductionGate} from '../evaluate.mjs';
import {assertLadderPrefix} from '../read.mjs';

/** Add complete empirical allowances without treating absence as zero.
 * @param {readonly (number|null)[]} values - Nonnegative numerical allowances.
 * @returns {number|null} Conservative sum, or explicit unavailability.
 */
function sumAllowances(values) {
	assert.ok(values.every((value) => value === null || (Number.isFinite(value) && value >= 0)));
	return values.some((value) => value === null) ? null : values.reduce((sum, value) => sum + value, 0);
}

/** Enforce the algebraic identity independently of reference uncertainty.
 * @param {number} difference - Computed identity residual.
 * @param {readonly number[]} terms - Magnitudes defining roundoff scale.
 * @returns {void}
 */
function identityCheck(difference, terms) {
	assert.ok(Math.abs(difference) <= 256 * Number.EPSILON * Math.max(1e-30, ...terms.map(Math.abs)));
}

/** Decompose one integrated N4 residual using the independently resolved physical J1.
 * @param {number|null} firstW - Grouped fixed-field N1 estimate.
 * @param {number|null} firstAllowanceW - N1 integration allowance.
 * @param {number|null} fourthW - Grouped fixed-field N4 estimate.
 * @param {number|null} fourthAllowanceW - N4 integration allowance.
 * @param {number|null} physicalW - Continuous physical J1 estimate.
 * @param {number|null} physicalAllowanceW - Physical J1 allowance.
 * @param {number} measuredW - Matched measured radiance.
 * @returns {SkyLadderPhysicalValue} Signed terms and independent allowance propagation.
 */
export function decomposePhysicalFirst(
	firstW,
	firstAllowanceW,
	fourthW,
	fourthAllowanceW,
	physicalW,
	physicalAllowanceW,
	measuredW,
) {
	assert.ok([firstW, fourthW, physicalW].every((value) => value === null || Number.isFinite(value)));
	assert.ok(Number.isFinite(measuredW));
	assert.ok(firstW !== null || firstAllowanceW === null);
	assert.ok(fourthW !== null || fourthAllowanceW === null);
	assert.ok(physicalW !== null || physicalAllowanceW === null);
	const numericalW = firstW === null || physicalW === null ? null : firstW - physicalW;
	const residualW = fourthW === null ? null : fourthW - measuredW;
	const remainingW = numericalW === null || fourthW === null ? null : fourthW - firstW + physicalW - measuredW;
	if (numericalW !== null && remainingW !== null) {
		identityCheck(residualW - numericalW - remainingW, [firstW, fourthW, physicalW, measuredW]);
		identityCheck(residualW ** 2 - numericalW ** 2 - remainingW ** 2 - 2 * numericalW * remainingW, [
			residualW ** 2,
			numericalW ** 2,
			remainingW ** 2,
			2 * numericalW * remainingW,
		]);
	}
	return {
		firstW,
		firstAllowanceW,
		fourthW,
		fourthAllowanceW,
		physicalW,
		physicalAllowanceW,
		measuredW,
		numericalW,
		numericalAllowanceW: sumAllowances([firstAllowanceW, physicalAllowanceW]),
		residualW,
		remainingW,
		remainingAllowanceW: sumAllowances([fourthAllowanceW, firstAllowanceW, physicalAllowanceW]),
	};
}

/** Aggregate complete selected vectors; unresolved/empty members never disappear.
 * First-order accuracy does not depend on availability of a fourth-order reference.
 * @param {readonly SkyLadderPhysicalValue[]} values - Exact selected scalar inventory.
 * @returns {SkyLadderPhysicalStats} Numerical norms and separately qualified compensation terms.
 */
export function physicalStatistics(values) {
	const firstComplete =
		values.length > 0 && values.every((value) => value.numericalW !== null && value.numericalAllowanceW !== null);
	const fullComplete =
		firstComplete && values.every((value) => value.remainingW !== null && value.remainingAllowanceW !== null);
	const residualComplete = values.length > 0 && values.every((value) => value.residualW !== null);
	const numericalSseW2 = firstComplete ? values.reduce((sum, value) => sum + value.numericalW ** 2, 0) : null;
	const remainingSseW2 = fullComplete ? values.reduce((sum, value) => sum + value.remainingW ** 2, 0) : null;
	const crossTermW2 = fullComplete
		? values.reduce((sum, value) => sum + 2 * value.numericalW * value.remainingW, 0)
		: null;
	const residualSseW2 = residualComplete ? values.reduce((sum, value) => sum + value.residualW ** 2, 0) : null;
	const identityResidualW2 = fullComplete ? residualSseW2 - numericalSseW2 - remainingSseW2 - crossTermW2 : null;
	if (identityResidualW2 !== null)
		identityCheck(identityResidualW2, [residualSseW2, numericalSseW2, remainingSseW2, crossTermW2]);
	const errorNormW = numericalSseW2 === null ? null : Math.sqrt(numericalSseW2);
	return {
		count: values.length,
		firstResolvedCount: values.filter((value) => value.numericalW !== null && value.numericalAllowanceW !== null)
			.length,
		decompositionResolvedCount: values.filter(
			(value) => value.remainingW !== null && value.remainingAllowanceW !== null,
		).length,
		errorNormW,
		errorAllowanceNormW: completeNorm(values.map((value) => value.numericalAllowanceW)),
		errorRmsW: errorNormW === null ? null : errorNormW / Math.sqrt(values.length),
		numericalSseW2,
		remainingSseW2,
		crossTermW2,
		residualSseW2,
		componentRmseMilliwatt: residualSseW2 === null ? null : 1000 * Math.sqrt(residualSseW2 / values.length),
		remainingAllowanceNormW: completeNorm(values.map((value) => value.remainingAllowanceW)),
		residualAllowanceNormW: completeNorm(values.map((value) => value.fourthAllowanceW)),
		identityResidualW2,
	};
}

/** Validate the already-authenticated fixed-field selector at its scalar join.
 * The ladder reader has reproduced its six-method envelope before this call.
 * @param {SkyContinuationProbeDiagnostic|undefined} value - Retained envelope or missing support.
 * @param {SkyPhysicalReferenceRow} row - Frozen physical row to match.
 * @param {number} order - Exact cumulative grouped order.
 * @returns {void}
 */
function matchEnvelope(value, row, order) {
	if (!value) return;
	assert.equal(value.probeId, row.probeId);
	assert.equal(value.time, row.time);
	assert.equal(value.gridX, row.gridX);
	assert.equal(value.gridY, row.gridY);
	assert.equal(value.representationId, 'grouped');
	assert.equal(value.order, order);
	assert.equal(value.methodId, 'reference-envelope');
	assert.ok(Number.isFinite(value.value));
	assert.ok(value.errorAllowance === null || (Number.isFinite(value.errorAllowance) && value.errorAllowance >= 0));
}

/** Compare every accepted raw rung with the same physical J1 and matched observations.
 * This is retrospective first-order attribution, not a full-N4 oracle or prediction.
 * @param {readonly SkyLadderSource[]} sources - Authenticated contiguous R0..Rk captures from readLadderCapture.
 * @param {DialContinuationRegistrationRead} registration - Authenticated C0 selectors and gates.
 * @param {DialAnalysisBoundary} measured - Authenticated complete measured boundary.
 * @param {SkyLadderPhysicalRead} physical - Exact checked readPhysicalFirst result.
 * @param {() => void} guard - Parent resource and heartbeat guard.
 * @returns {SkyLadderPhysicalTables} Compact tables with unchanged, biased component selectors.
 */
export function evaluatePhysicalFirst(sources, registration, measured, physical, guard) {
	assertLadderPrefix(sources.map((source) => source.loaded.caseId));
	assert.equal(physical.record.rows.length, 160);
	assert.equal(physical.record.resolved, true);
	assert.equal(measured.quantity, 'radiance');
	assert.equal(measured.units, physical.record.units);
	assert.deepEqual(measured.rayIndices, ALL_RAYS);
	/** @type {Map<string, readonly SkyLadderPhysicalValue[]>} */ const valuesByCase = new Map();
	/** @type {SkyContinuationAnalysisCell[][]} */ const points = [],
		groups = [],
		coverage = [];
	for (const source of sources) {
		guard();
		const values = physical.record.rows.map((row) => {
			const first = source.envelopes.get(`${row.channel}/${row.probeId}/grouped/1`);
			const fourth = source.envelopes.get(`${row.channel}/${row.probeId}/grouped/4`);
			matchEnvelope(first, row, 1);
			matchEnvelope(fourth, row, 4);
			const time = measured.times.indexOf(row.time),
				channel = measured.channels.indexOf(row.channel);
			assert.ok(time >= 0 && channel >= 0);
			const observation =
				measured.values[(time * 81 + row.gridY * 9 + row.gridX) * measured.channels.length + channel];
			return decomposePhysicalFirst(
				first?.value ?? null,
				first?.errorAllowance ?? null,
				fourth?.value ?? null,
				fourth?.errorAllowance ?? null,
				row.resolved ? (row.gaussWatts + row.simpsonWatts) / 2 : null,
				row.resolved ? row.empiricalAllowanceWatts : null,
				observation,
			);
		});
		valuesByCase.set(source.loaded.caseId, values);
		const baseline = valuesByCase.get('r0');
		for (const [index, value] of values.entries()) {
			const row = physical.record.rows[index],
				a = baseline[index];
			const reduction =
				a.numericalW === null || value.numericalW === null
					? null
					: Math.abs(a.numericalW) - Math.abs(value.numericalW);
			const allowance = sumAllowances([a.numericalAllowanceW, value.numericalAllowanceW]);
			const stats = physicalStatistics([value]);
			points.push([
				source.loaded.caseId,
				row.probeId,
				row.time,
				row.gridX,
				row.gridY,
				row.channel,
				value.firstW,
				value.firstAllowanceW,
				value.fourthW,
				value.fourthAllowanceW,
				value.physicalW,
				value.physicalAllowanceW,
				value.measuredW,
				value.numericalW,
				value.numericalAllowanceW,
				value.residualW,
				value.remainingW,
				value.remainingAllowanceW,
				stats.numericalSseW2,
				stats.remainingSseW2,
				stats.crossTermW2,
				stats.residualSseW2,
				stats.identityResidualW2,
				reduction,
				allowance,
				localReductionGate(reduction, allowance, registration.record.scientificGates),
			]);
		}
		const summary = physicalStatistics(values);
		coverage.push([
			source.loaded.caseId,
			source.run,
			source.loaded.sealIdentity.sha256,
			source.diagnostics.map((item) => item.sha256).join(' | '),
			physical.run,
			physical.parents[0].sha256,
			values.length,
			summary.firstResolvedCount,
			summary.decompositionResolvedCount,
			'grouped',
			'reference-envelope',
			registration.record.scopes.probeTimes.join(' | '),
			registration.record.scopes.probeChannels.join(' | '),
			false,
			false,
		]);
	}
	/** @type {Map<string, readonly number[]>} */ const selections = new Map([
		['component/all-frozen-probes', physical.record.rows.map((_, index) => index)],
	]);
	for (const channel of registration.record.scopes.probeChannels)
		selections.set(
			`component/all-frozen-probes/channel-${channel}`,
			physical.record.rows.flatMap((row, index) => (row.channel === channel ? [index] : [])),
		);
	for (const group of ladderGroups(sources[0], registration).filter((group) => group.scope === 'component'))
		selections.set(
			group.id,
			physical.record.rows.flatMap((row, index) =>
				group.time === row.time &&
				group.channels.includes(row.channel) &&
				group.probes.some((probe) => probe.probeId === row.probeId)
					? [index]
					: [],
			),
		);
	for (const source of sources) {
		guard();
		const baseline = valuesByCase.get('r0'),
			candidate = valuesByCase.get(source.loaded.caseId);
		for (const [id, indices] of selections) {
			const a = physicalStatistics(indices.map((index) => baseline[index]));
			const b = physicalStatistics(indices.map((index) => candidate[index]));
			const reduction = a.errorNormW === null || b.errorNormW === null ? null : a.errorNormW - b.errorNormW;
			const allowance = completeNorm(
				indices.map((index) =>
					sumAllowances([baseline[index].numericalAllowanceW, candidate[index].numericalAllowanceW]),
				),
			);
			groups.push([
				source.loaded.caseId,
				id,
				b.count,
				b.firstResolvedCount,
				b.decompositionResolvedCount,
				a.errorNormW,
				b.errorNormW,
				b.errorRmsW,
				b.errorAllowanceNormW,
				reduction,
				allowance,
				localReductionGate(reduction, allowance, registration.record.scientificGates),
				b.numericalSseW2,
				b.remainingSseW2,
				b.crossTermW2,
				b.residualSseW2,
				b.componentRmseMilliwatt,
				b.remainingAllowanceNormW,
				b.residualAllowanceNormW,
				b.identityResidualW2,
				indices
					.map((index) => `${physical.record.rows[index].probeId}/${physical.record.rows[index].channel}`)
					.join(' | '),
			]);
		}
	}
	return {
		points: {
			columns: [
				'case',
				'probe',
				'time',
				'grid_x',
				'grid_y',
				'channel',
				'L1_W',
				'L1_integration_U_W',
				'L4_W',
				'L4_integration_U_W',
				'physical_J1_W',
				'physical_J1_U_W',
				'measured_W',
				'n_W',
				'n_U_W',
				'r_W',
				'p_W',
				'p_U_W',
				'n2_W2',
				'p2_W2',
				'twice_n_p_W2',
				'r2_W2',
				'identity_residual_W2',
				'R0_absolute_error_reduction_W',
				'paired_reduction_U_W',
				'qualified_J1_reduction',
			],
			rows: points,
		},
		groups: {
			columns: [
				'case',
				'group',
				'count',
				'J1_resolved_count',
				'decomposition_resolved_count',
				'R0_J1_error_norm_W',
				'J1_error_norm_W',
				'J1_error_RMS_W',
				'J1_error_U_norm_W',
				'R0_J1_error_norm_reduction_W',
				'paired_reduction_U_W',
				'qualified_J1_reduction',
				'n2_W2',
				'p2_W2',
				'twice_n_p_W2',
				'r2_W2',
				'biased_component_RMSE_mW',
				'p_U_norm_W',
				'r_integration_U_norm_W',
				'identity_residual_W2',
				'exact_probe_channel_selectors',
			],
			rows: groups,
		},
		coverage: {
			columns: [
				'case',
				'run',
				'seal_sha256',
				'diagnostic_sha256s',
				'physical_run',
				'physical_seal_sha256',
				'expected_scalar_count',
				'J1_resolved_count',
				'decomposition_resolved_count',
				'representation',
				'method',
				'times',
				'channels',
				'full_registered_boundary',
				'prospective',
			],
			rows: coverage,
		},
	};
}
