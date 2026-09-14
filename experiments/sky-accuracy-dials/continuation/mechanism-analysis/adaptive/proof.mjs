import assert from 'node:assert/strict';
import {ALL_RAYS, RADIANCE_UNITS, SCREEN_SELECTION} from '../../../analysis/boundary.mjs';
import {evaluateAdaptiveEvidence} from './evaluate.mjs';

const times = ['09:30', '10:15', '11:15', '12:30', '13:30'],
	budgets = /** @type {const} */ ([4, 8, 16]),
	channels = SCREEN_SELECTION.channels;
const identity = {path: 'manufactured/adaptive-assessment.json', byteLength: 0, sha256: '0'.repeat(64)};

/** Manufactured nonuniform signal reveals x/y transposition and excluded-coordinate leakage.
 * @param {string} time @param {number} x @param {number} y @param {number} channel @returns {number}
 */
function base(time, x, y, channel) {
	return (
		2 +
		times.indexOf(time) / 10 +
		x / 1000 +
		y / 100 +
		channel / 100000 +
		(channel === 39 ? 1e6 : 0) +
		(SCREEN_SELECTION.times.includes(time) ? 0 : 1e5)
	);
}

/** Complete manufactured checkpoint satisfying real accounting and grouping equations.
 * @param {SkyAdaptiveCaptureIdentity} row @param {number} channel @param {boolean} adaptive
 * @param {number} index @param {SkyMechanismAdaptiveScalarCount} scalarCount @returns {SkyAdaptiveCheckpoint}
 */
function checkpoint(row, channel, adaptive, index, scalarCount) {
	const active = adaptive ? /** @type {const} */ ([2, 4, 8])[index] : budgets[index],
		queried = adaptive ? 2 * active - 1 : active;
	const values = [1, 2, 3, 4].map(
		(order) =>
			base(row.time, row.gridX, row.gridY, channel) +
			order / 10 +
			(adaptive ? (row.probeId === 'p-0930-0-0' && order === 4 ? 0.75 : 0.25) : 0.5),
	);
	return {
		budget: budgets[index],
		activeNodeCount: active,
		counters: {
			queriedNodes: queried,
			mediumEvaluations: queried,
			scalarReconstructions: queried * scalarCount,
			cacheHits: 0,
		},
		componentRadiancesW: [values[0], ...values.slice(1).map((value) => value - values[0])],
		groupedRadiancesW: values,
		transmittance: 0.5,
		mesh: row.probeId === null ? null : [active],
		nextRefinementCost: adaptive ? 2 * active : 0,
	};
}

/** Authored finite data only; no atmospheric evaluator or saved run is involved.
 * @param {SkyMechanismAdaptiveCase} caseId @returns {SkyMechanismAdaptiveInput}
 */
function fixture(caseId) {
	/** @type {SkyAdaptiveCaptureIdentity[]} */ const rows = [];
	for (const time of times)
		for (let x = 0; x < 9; x++)
			for (let y = 0; y < 9; y++) {
				const ordinary = SCREEN_SELECTION.times.indexOf(time),
					probe = x === 0 && y < 8;
				if (ordinary < 0 && !probe) continue;
				const probeId = probe ? `p-${time.replace(':', '')}-${x}-${y}` : null;
				rows.push({
					id: probeId ?? `screen-${time.replace(':', '')}-${x}-${y}`,
					time,
					gridX: x,
					gridY: y,
					ordinaryRayIndex: ordinary < 0 ? null : (ordinary * 9 + x) * 9 + y,
					probeId,
				});
			}
	const factored = caseId === 'v-factored',
		scalarCount = factored ? 5 : 4;
	/** @type {Map<string,SkyContinuationProbeDiagnostic>} */ const envelopes = new Map();
	for (const channel of [0, 8, 24, 30])
		for (const row of rows.filter((row) => row.probeId !== null))
			for (let order = 1; order <= 4; order++) {
				const representation = factored ? 'grouped-factored-n1' : 'grouped';
				envelopes.set(`${channel}/${row.probeId}/${representation}/${order}`, {
					probeId: row.probeId,
					sceneId: `scene-${row.time.replace(':', '')}`,
					time: row.time,
					gridX: row.gridX,
					gridY: row.gridY,
					methodId: 'reference-envelope',
					representationId: representation,
					order,
					value: base(row.time, row.gridX, row.gridY, channel) + order / 10,
					errorAllowance:
						!factored && channel === 0 && row.probeId === 'p-0930-0-0' && order === 1 ? null : 0.01,
					evaluationCount: 1,
				});
			}
	return {
		caseId,
		sourceIdentity: identity,
		envelopes,
		channels: channels.map((channel) => ({
			channel,
			artifact: identity,
			value: {
				schemaId: 'sky-adaptive-capture-v1',
				scope: 'registered-screen-and-component',
				units: RADIANCE_UNITS,
				firstOrder: factored ? 'factored' : 'raw',
				ordinaryRayCount: 243,
				preparedQueryCount: 31 * 259,
				scalarReconstructionsPerNode: scalarCount,
				maximumUniformParityError: 0,
				rows: rows.map((row) => ({
					...row,
					segmentCount: 1,
					adaptive: budgets.map((_, index) => checkpoint(row, channel, true, index, scalarCount)),
					uniform: budgets.map((_, index) => checkpoint(row, channel, false, index, scalarCount)),
				})),
				limitations: ['Manufactured finite data; no atmospheric accuracy claim.'],
			},
		})),
	};
}

/** Locate a unique table row through named columns, without relying on output order.
 * @param {SkyContinuationAnalysisTable} table @param {SkyMechanismAdaptiveRowSelector} selector
 * @returns {readonly SkyContinuationAnalysisCell[]}
 */
function selectRow(table, selector) {
	const matches = table.rows.filter((row) =>
		Object.entries(selector).every(([key, value]) => row[table.columns.indexOf(key)] === value),
	);
	assert.equal(matches.length, 1);
	return matches[0];
}

/** Focused mathematical/admission proof for the new pure assessment.
 * @returns {SkyMechanismAdaptiveAssessmentProof}
 */
export function adaptiveMechanismAssessmentProof() {
	let checks = 0;
	/** @param {unknown} actual @param {unknown} expected @returns {void} */
	function equal(actual, expected) {
		assert.deepEqual(actual, expected);
		checks++;
	}
	/** @param {() => unknown} operation @returns {void} */
	function rejects(operation) {
		assert.throws(operation);
		checks++;
	}
	const raw = fixture('v-raw'),
		factored = fixture('v-factored');
	/** @type {DialAnalysisBoundary} */ const measured = {
		configId: 'manufactured-measurements',
		quantity: 'radiance',
		units: RADIANCE_UNITS,
		times: SCREEN_SELECTION.times,
		rayIndices: ALL_RAYS,
		channels: [0, 8, 16, 24, 30],
		sourceIdentity: identity,
		values: Float64Array.from(
			SCREEN_SELECTION.times.flatMap((time) =>
				ALL_RAYS.flatMap((ray) =>
					[0, 8, 16, 24, 30].map((channel) => base(time, ray % 9, Math.floor(ray / 9), channel) + 0.1),
				),
			),
		),
	};
	const result = evaluateAdaptiveEvidence([raw, factored], measured);
	equal(result.table.rows.length, 3840);
	equal(result.scores.rows.length, 192);
	equal(result.work.rows.length, 216);
	equal(result.summary.localNumericalComparisons, {adequate: 3837, improved: 3813, worsened: 24, unresolved: 3});
	equal(result.summary.prospectivePrediction, 'not-tested-by-C3');
	equal(result.summary.combinedAccuracyQualified, false);
	equal(result.summary.observedResponse, true);
	equal(result.summary.kiderImprovementCount, 96);
	for (const multiplier of budgets) {
		const row = selectRow(result.table, {
			case: 'v-raw',
			channel: 0,
			probe: 'p-0930-0-0',
			order: 1,
			budget_multiplier: multiplier,
		});
		equal(row[result.table.columns.indexOf('empirical_allowance_W')], null);
		equal(row[result.table.columns.indexOf('qualified_local_comparison')], null);
		equal(row[result.table.columns.indexOf('state')], 'unresolved-reference');
	}
	for (const method of ['uniform', 'adaptive']) {
		const row = selectRow(result.scores, {
			case: 'v-raw',
			budget_multiplier: 4,
			order: 1,
			method,
			time_group: 'all-three-times',
		});
		const score = row[result.scores.columns.indexOf('Kider_rmse_mW')];
		assert.ok(typeof score === 'number' && Math.abs(score - (method === 'uniform' ? 500 : 250)) < 1e-10);
		checks++;
		equal(row[result.scores.columns.indexOf('score_count')], 1215);
		equal(row[result.scores.columns.indexOf('ordinary_ray_count')], 243);
	}
	for (const [caseId, scalar] of [
		['v-raw', 4],
		['v-factored', 5],
	])
		for (const [index, multiplier] of budgets.entries()) {
			const row = selectRow(result.work, {
				case: caseId,
				channel: 39,
				scope: 'all-259',
				method: 'adaptive',
				budget_multiplier: multiplier,
			});
			equal(row[result.work.columns.indexOf('prepared_midpoints_31P')], 31 * 259);
			equal(row[result.work.columns.indexOf('queried_nodes_including_trials')], [3, 7, 15][index] * 259);
			equal(row[result.work.columns.indexOf('scalar_reconstructions')], Number(scalar) * [3, 7, 15][index] * 259);
			equal(row[result.work.columns.indexOf('unspent_budget')], 259);
		}
	// Reordering input rows and channels must leave the values selected by physical identity unchanged.
	const shuffled = {
		...raw,
		channels: [...raw.channels]
			.reverse()
			.map((channel) => ({...channel, value: {...channel.value, rows: [...channel.value.rows].reverse()}})),
	};
	const shuffledResult = evaluateAdaptiveEvidence([factored, shuffled], measured);
	equal(shuffledResult.scores, result.scores);
	equal(shuffledResult.table, result.table);
	equal(shuffledResult.work, result.work);
	equal(shuffledResult.summary, result.summary);
	const missing = new Map(raw.envelopes);
	missing.delete('8/p-0930-0-0/grouped/1');
	const missingResult = evaluateAdaptiveEvidence([{...raw, envelopes: missing}, factored], measured);
	equal(missingResult.summary.localNumericalComparisons.unresolved, 6);
	const missingRow = selectRow(missingResult.table, {
		case: 'v-raw',
		channel: 8,
		probe: 'p-0930-0-0',
		order: 1,
		budget_multiplier: 4,
	});
	for (const field of [
		'reference_W',
		'empirical_allowance_W',
		'uniform_absolute_error_W',
		'adaptive_absolute_error_W',
		'absolute_error_reduction_W',
		'qualified_local_comparison',
	])
		equal(missingRow[missingResult.table.columns.indexOf(field)], null);
	const largeAllowance = new Map(raw.envelopes);
	const old = largeAllowance.get('8/p-0930-0-0/grouped/1');
	largeAllowance.set('8/p-0930-0-0/grouped/1', {...old, errorAllowance: 1});
	const limited = evaluateAdaptiveEvidence([{...raw, envelopes: largeAllowance}, factored], measured);
	equal(limited.summary.localNumericalComparisons.unresolved, 6);
	equal(
		selectRow(limited.table, {case: 'v-raw', channel: 8, probe: 'p-0930-0-0', order: 1, budget_multiplier: 4})[
			limited.table.columns.indexOf('qualified_local_comparison')
		],
		false,
	);
	rejects(() => evaluateAdaptiveEvidence([raw, raw], measured));
	rejects(() => evaluateAdaptiveEvidence([{...raw, channels: raw.channels.slice(0, 5)}, factored], measured));
	rejects(() =>
		evaluateAdaptiveEvidence(
			[
				{
					...raw,
					channels: raw.channels.map((channel, index) =>
						index ? channel : {...channel, value: {...channel.value, rows: channel.value.rows.slice(1)}},
					),
				},
				factored,
			],
			measured,
		),
	);
	rejects(() =>
		evaluateAdaptiveEvidence(
			[
				{
					...raw,
					channels: raw.channels.map((channel, index) =>
						index ? channel : {...channel, value: {...channel.value, preparedQueryCount: 1}},
					),
				},
				factored,
			],
			measured,
		),
	);
	const dishonestWork = {
		...raw,
		channels: raw.channels.map((channel, index) =>
			index
				? channel
				: {
						...channel,
						value: {
							...channel.value,
							rows: channel.value.rows.map((row, rowIndex) =>
								rowIndex
									? row
									: {
											...row,
											adaptive: row.adaptive.map((point, pointIndex) =>
												pointIndex
													? point
													: {
															...point,
															counters: {...point.counters, mediumEvaluations: 0},
														},
											),
										},
							),
						},
					},
		),
	};
	rejects(() => evaluateAdaptiveEvidence([dishonestWork, factored], measured));
	const wrongReference = new Map(raw.envelopes);
	wrongReference.set('8/p-0930-0-0/grouped/1', {...old, representationId: 'grouped-factored-n1'});
	rejects(() => evaluateAdaptiveEvidence([{...raw, envelopes: wrongReference}, factored], measured));
	return {schemaId: 'sky-mechanism-adaptive-assessment-proof-v1', checks};
}
