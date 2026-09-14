import assert from 'node:assert/strict';
import {
	ALL_RAYS,
	RADIANCE_UNITS,
	SCREEN_SELECTION,
	assertIdentity,
	selectBoundary,
} from '../../../analysis/boundary.mjs';
import {scoreBoundary} from '../../../analysis/metrics.mjs';
import {validateAdaptiveCapture} from '../../capture/adaptive.js';

const budgets = [4, 8, 16],
	probeChannels = [0, 8, 24, 30],
	scoreChannels = [0, 8, 16, 24, 30];

/** Exact physical identity independent of capture array ordering.
 * @param {SkyMechanismAdaptiveCoordinate} row @returns {string}
 */
function coordinate(row) {
	return `${row.time}/${row.gridY}/${row.gridX}`;
}

/** Require complete matching operational identities before selecting any values.
 * @param {readonly SkyMechanismAdaptiveInput[]} sources @returns {void}
 */
function validateInputs(sources) {
	assert.deepEqual(sources.map((source) => source.caseId).sort(), ['v-factored', 'v-raw']);
	/** @type {readonly string[] | null} */ let shared = null;
	for (const source of sources) {
		assertIdentity(source.sourceIdentity);
		assert.deepEqual(
			source.channels.map((item) => item.channel).sort((a, b) => a - b),
			SCREEN_SELECTION.channels,
		);
		for (const channel of source.channels) {
			assertIdentity(channel.artifact);
			const value = validateAdaptiveCapture(channel.value);
			assert.equal(value.firstOrder, source.caseId === 'v-raw' ? 'raw' : 'factored');
			const coordinates = value.rows.map(coordinate);
			assert.equal(new Set(coordinates).size, 259, 'Operational coordinates must be unique.');
			const identities = value.rows.map((row) => `${coordinate(row)}/${row.id}/${row.probeId}`).sort();
			if (shared) assert.deepEqual(identities, shared);
			else shared = identities;
		}
	}
}

/** Assemble the 243 ordinary rays by explicit time/y/x identity, never array position.
 * @param {SkyMechanismAdaptiveInput} source @param {SkyMechanismAdaptiveMethod} method
 * @param {number} budgetIndex @param {number} order @returns {DialAnalysisBoundary}
 */
function ordinaryBoundary(source, method, budgetIndex, order) {
	const channels = new Map(source.channels.map((item) => [item.channel, item]));
	const indexed = new Map(
		source.channels.map((item) => [item.channel, new Map(item.value.rows.map((row) => [coordinate(row), row]))]),
	);
	const values = new Float64Array(243 * scoreChannels.length);
	let offset = 0;
	for (const time of SCREEN_SELECTION.times)
		for (const ray of ALL_RAYS)
			for (const channel of scoreChannels) {
				assert.ok(channels.has(channel));
				const row = indexed.get(channel).get(`${time}/${Math.floor(ray / 9)}/${ray % 9}`);
				assert.ok(row && row.ordinaryRayIndex !== null, 'An ordinary score coordinate is absent.');
				values[offset++] = row[method][budgetIndex].groupedRadiancesW[order - 1];
			}
	return {
		configId: `${source.caseId}/${method}/${budgets[budgetIndex]}/${order}`,
		quantity: 'radiance',
		units: RADIANCE_UNITS,
		times: SCREEN_SELECTION.times,
		rayIndices: ALL_RAYS,
		channels: scoreChannels,
		values,
		sourceIdentity: source.sourceIdentity,
	};
}

/** Retain all scalar gates; a known reference with an unresolved response is still unresolved.
 * @param {SkyMechanismAdaptiveInput} source @param {SkyContinuationAnalysisCell[][]} rows
 * @param {SkyMechanismAdaptiveCounts} counts @returns {void}
 */
function componentRows(source, rows, counts) {
	const representation = source.caseId === 'v-raw' ? 'grouped' : 'grouped-factored-n1';
	for (const channel of source.channels
		.filter((item) => probeChannels.includes(item.channel))
		.sort((a, b) => a.channel - b.channel))
		for (const ray of channel.value.rows
			.filter((row) => row.probeId !== null)
			.sort((a, b) => coordinate(a).localeCompare(coordinate(b))))
			for (let order = 1; order <= 4; order++) {
				const reference = source.envelopes.get(`${channel.channel}/${ray.probeId}/${representation}/${order}`);
				if (reference) {
					assert.equal(reference.methodId, 'reference-envelope');
					assert.equal(reference.representationId, representation);
					assert.equal(reference.probeId, ray.probeId);
					assert.equal(reference.order, order);
					assert.equal(coordinate(reference), coordinate(ray));
					assert.ok(Number.isFinite(reference.value) && reference.value >= 0);
					assert.ok(
						reference.errorAllowance === null ||
							(Number.isFinite(reference.errorAllowance) && reference.errorAllowance >= 0),
					);
				}
				const estimate = reference?.value ?? null,
					allowance = reference?.errorAllowance ?? null;
				for (const [index, multiplier] of budgets.entries()) {
					const uniform = ray.uniform[index].groupedRadiancesW[order - 1],
						adaptive = ray.adaptive[index].groupedRadiancesW[order - 1];
					const uniformError = estimate === null ? null : Math.abs(uniform - estimate),
						adaptiveError = estimate === null ? null : Math.abs(adaptive - estimate);
					const reduction = estimate === null ? null : uniformError - adaptiveError,
						gate =
							allowance === null || reduction === null
								? null
								: allowance <= 0.2 * Math.abs(reduction) && Math.abs(reduction) > 2 * allowance;
					const state = gate
						? reduction > 0
							? 'improved'
							: 'worsened'
						: allowance === null
							? 'unresolved-reference'
							: 'unresolved-response';
					if (gate) {
						counts.adequate++;
						if (reduction > 0) counts.improved++;
						else counts.worsened++;
					} else counts.unresolved++;
					rows.push([
						source.caseId,
						channel.channel,
						ray.probeId,
						ray.time,
						ray.gridX,
						ray.gridY,
						representation,
						order,
						multiplier,
						ray.segmentCount,
						ray.adaptive[index].budget,
						uniform,
						adaptive,
						adaptive - uniform,
						estimate,
						allowance,
						uniformError,
						adaptiveError,
						reduction,
						gate,
						state,
					]);
				}
			}
}

/** Aggregate runtime counters only within one scope/channel/checkpoint.
 * @param {SkyMechanismAdaptiveInput} source @param {SkyContinuationAnalysisCell[][]} rows @returns {void}
 */
function workRows(source, rows) {
	for (const channel of [...source.channels].sort((a, b) => a.channel - b.channel))
		for (const scope of ['all-259', 'ordinary-243', 'extra-16']) {
			const selected = channel.value.rows.filter(
				(row) =>
					scope === 'all-259' ||
					(scope === 'ordinary-243' ? row.ordinaryRayIndex !== null : row.ordinaryRayIndex === null),
			);
			const prepared = selected.reduce((sum, row) => sum + 31 * row.segmentCount, 0);
			for (const method of /** @type {const} */ (['adaptive', 'uniform']))
				for (const [index, multiplier] of budgets.entries()) {
					const checkpoints = selected.map((row) => row[method][index]);
					const budget = checkpoints.reduce((sum, point) => sum + point.budget, 0),
						queried = checkpoints.reduce((sum, point) => sum + point.counters.queriedNodes, 0),
						active = checkpoints.reduce((sum, point) => sum + point.activeNodeCount, 0);
					rows.push([
						source.caseId,
						channel.channel,
						scope,
						selected.length,
						method,
						multiplier,
						prepared,
						budget,
						queried,
						active,
						queried - active,
						budget - queried,
						checkpoints.reduce((sum, point) => sum + point.counters.mediumEvaluations, 0),
						checkpoints.reduce((sum, point) => sum + point.counters.scalarReconstructions, 0),
						checkpoints.reduce((sum, point) => sum + point.counters.cacheHits, 0),
						channel.value.scalarReconstructionsPerNode,
					]);
				}
		}
}

/** Evaluate authenticated V evidence without IO, GPU work or independent quadrature.
 * @param {readonly SkyMechanismAdaptiveInput[]} sources @param {DialAnalysisBoundary} measured
 * @returns {SkyMechanismAdaptiveAssessment}
 */
export function evaluateAdaptiveEvidence(sources, measured) {
	validateInputs(sources);
	/** @type {SkyContinuationAnalysisCell[][]} */ const table = [],
		scores = [],
		work = [];
	const counts = {adequate: 0, improved: 0, worsened: 0, unresolved: 0};
	let observedResponse = false,
		kiderImprovementCount = 0;
	for (const source of [...sources].sort((a, b) => a.caseId.localeCompare(b.caseId))) {
		componentRows(source, table, counts);
		workRows(source, work);
		observedResponse ||= source.channels.some((channel) =>
			channel.value.rows.some((row) =>
				row.adaptive.some((point, index) =>
					point.groupedRadiancesW.some(
						(value, order) => value !== row.uniform[index].groupedRadiancesW[order],
					),
				),
			),
		);
		for (const [index, multiplier] of budgets.entries())
			for (let order = 1; order <= 4; order++) {
				const boundaries = {
					adaptive: ordinaryBoundary(source, 'adaptive', index, order),
					uniform: ordinaryBoundary(source, 'uniform', index, order),
				};
				for (const times of [SCREEN_SELECTION.times, ...SCREEN_SELECTION.times.map((time) => [time])]) {
					/** @type {Map<string,number>} */ const paired = new Map();
					for (const method of /** @type {const} */ (['uniform', 'adaptive'])) {
						const boundary = selectBoundary(boundaries[method], {
								times,
								channels: scoreChannels,
								rayIndices: ALL_RAYS,
							}),
							score = scoreBoundary(boundary, measured, scoreChannels);
						paired.set(method, score.aggregateRmseMilliwatt);
						scores.push([
							source.caseId,
							multiplier,
							order,
							method,
							times.length === 3 ? 'all-three-times' : times[0],
							81 * times.length,
							scoreChannels.length,
							score.sampleCount,
							score.aggregateRmseMilliwatt,
							score.squaredError,
							false,
						]);
						assert.equal(score.fullRegisteredBoundary, false);
					}
					if (paired.get('adaptive') < paired.get('uniform')) kiderImprovementCount++;
				}
			}
	}
	return {
		table: {
			columns: [
				'case',
				'channel',
				'probe',
				'time',
				'grid_x',
				'grid_y',
				'reference_representation',
				'order',
				'budget_multiplier',
				'physical_segments',
				'runtime_budget',
				'uniform_W',
				'adaptive_W',
				'adaptive_minus_uniform_W',
				'reference_W',
				'empirical_allowance_W',
				'uniform_absolute_error_W',
				'adaptive_absolute_error_W',
				'absolute_error_reduction_W',
				'qualified_local_comparison',
				'state',
			],
			rows: table,
		},
		scores: {
			columns: [
				'case',
				'budget_multiplier',
				'order',
				'method',
				'time_group',
				'ordinary_ray_count',
				'score_channel_count',
				'score_count',
				'Kider_rmse_mW',
				'squared_error_W2',
				'full_registered_boundary',
			],
			rows: scores,
		},
		work: {
			columns: [
				'case',
				'channel',
				'scope',
				'ray_count',
				'method',
				'budget_multiplier',
				'prepared_midpoints_31P',
				'runtime_budget',
				'queried_nodes_including_trials',
				'active_nodes',
				'inactive_queried_nodes',
				'unspent_budget',
				'medium_evaluations',
				'scalar_reconstructions',
				'cache_hits',
				'scalar_reconstructions_per_node',
			],
			rows: work,
		},
		summary: {
			classification: counts.adequate
				? 'local-fixed-field-response-assessed'
				: observedResponse
					? 'observed-response-only'
					: 'no-observed-response',
			observedResponse,
			localNumericalComparisons: counts,
			prospectivePrediction: 'not-tested-by-C3',
			kiderImprovementCount,
			combinedAccuracyQualified: false,
			limitations: [
				'Local counts describe overlapping scalar comparisons across budgets, orders, channels and backgrounds; they are not independent samples. Adequate means the absolute response passes the empirical allowance gate. Missing allowances and responses below that gate remain unresolved.',
				'Fixed-field references qualify view integration of the captured reconstruction only. They do not establish recurrence, cache, physical-model or whole-N4 accuracy, and empirical allowances are not rigorous bounds.',
				'Kider scores use only the 243 ordinary rays at 09:30, 11:15 and 13:30 and channels 0/8/16/24/30. Channel39 and sixteen extra-time component rays are excluded. Improvement counts are overlapping retrospective comparisons, not full-boundary or prospective qualification.',
				'Work tables separate prepared31P support from runtime joint queries, medium evaluations and four/five scalar reconstructions. Adaptive checkpoint counts are cumulative prefixes and must not be summed across budgets; scope rows overlap. Preparation, GPU readback and whole-job elapsed time are not runtime integration savings.',
				'Adaptive and uniform results use matching raw or final-J1-factored grouping within each background. The heuristic offers no universal or monotonic error guarantee.',
			],
		},
	};
}

/** Project the parent's authenticated captures onto the pure adaptive evidence contract.
 * @param {readonly SkyMechanismAssessmentCapture[]} sources @param {DialAnalysisBoundary} measured
 * @returns {SkyMechanismAdaptiveAssessment}
 */
export function evaluateAdaptiveMechanisms(sources, measured) {
	return evaluateAdaptiveEvidence(
		sources.map((source) => ({
			caseId: source.caseId,
			sourceIdentity: source.loaded.sealIdentity,
			channels: source.diagnostics.map((item) => {
				assert.ok(item.value.operations, 'V assessment requires operational evidence in every channel.');
				return {channel: item.channel, artifact: item.artifact, value: item.value.operations};
			}),
			envelopes: source.envelopes,
		})),
		measured,
	);
}
