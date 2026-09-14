import assert from 'node:assert/strict';
import {ALL_RAYS, selectBoundary} from '../../analysis/boundary.mjs';
import {geometricStrata, scoreBoundary} from '../../analysis/metrics.mjs';
import {extractBoundary} from '../../processing.mjs';
import {benchmarkRay} from '../../numerics/view.js';

/** Euclidean norm with complete, nonempty coverage. @param {readonly (number|null)[]} values @returns {number|null} */
export function completeNorm(values) {
	return !values.length || values.some((value) => value === null)
		? null
		: Math.sqrt(values.reduce((sum, value) => sum + value * value, 0));
}

/** Exact aligned subtraction, retaining every missing component as null.
 * @param {readonly (number|null)[]} baseline @param {readonly (number|null)[]} candidate @returns {(number|null)[]}
 */
export function difference(baseline, candidate) {
	assert.equal(baseline.length, candidate.length);
	return baseline.map((value, index) =>
		value === null || candidate[index] === null ? null : candidate[index] - value,
	);
}

/** Describe an observed response without extrapolating a remaining error.
 * @param {readonly (number|null)[]} values @param {number} floor @returns {SkyLadderDelta}
 */
export function deltaMetrics(values, floor) {
	assert.ok(Number.isFinite(floor) && floor > 0);
	assert.ok(values.every((value) => value === null || Number.isFinite(value)));
	const norm = completeNorm(values),
		complete = norm !== null;
	return {
		count: values.length,
		availableCount: values.filter((value) => value !== null).length,
		normW: norm,
		rmsW: complete ? norm / Math.sqrt(values.length) : null,
		meanW: complete ? values.reduce((sum, value) => sum + value, 0) / values.length : null,
		twiceObservedNormW: complete ? 2 * norm : null,
		significantCount: complete ? values.filter((value) => Math.abs(value) > floor).length : null,
		positiveCount: complete ? values.filter((value) => value > floor).length : null,
		negativeCount: complete ? values.filter((value) => value < -floor).length : null,
	};
}

/** Compare response vectors only where both exceed the implementation floor.
 * @param {readonly (number|null)[]} initial @param {readonly (number|null)[]} final @param {number} floor
 * @returns {SkyLadderResponseComparison}
 */
export function compareResponses(initial, final, floor) {
	assert.equal(initial.length, final.length);
	const a = completeNorm(initial),
		b = completeNorm(final),
		threshold = floor * Math.sqrt(initial.length);
	const resolved = a !== null && b !== null && a > threshold && b > threshold;
	return {
		normRatio: resolved ? b / a : null,
		cosine: resolved
			? Math.max(-1, Math.min(1, initial.reduce((sum, value, index) => sum + value * final[index], 0) / (a * b)))
			: null,
		differenceNormW: completeNorm(difference(initial, final)),
	};
}

/** Require every named component before forming a total allowance.
 * @param {readonly SkyLadderComponent[]} components @returns {number|null}
 */
export function totalQualifiedAllowance(components) {
	return !components.length ||
		components.some((component) => !component.qualified || component.qualifiedAllowanceW === null)
		? null
		: components.reduce((sum, component) => sum + component.qualifiedAllowanceW, 0);
}

/** Frozen numerical improvement gate, without promoting missing evidence to a rejection.
 * @param {number|null} reduction @param {number|null} uncertainty @param {SkyLadderReductionGates} gates @returns {boolean|null}
 */
export function localReductionGate(reduction, uncertainty, gates) {
	return reduction === null || uncertainty === null
		? null
		: reduction > 0 &&
				uncertainty <= gates.maximumAllowanceToReduction * reduction &&
				reduction > gates.strictReductionAllowanceMultiplier * uncertainty;
}

/** Reconstruct only geometry, with scope and overlapping group identities fixed before values.
 * @param {SkyLadderSource} baseline @param {DialContinuationRegistrationRead} registration @returns {SkyLadderGroup[]}
 */
export function ladderGroups(baseline, registration) {
	/** @type {SkyLadderGroup[]} */ const result = [];
	for (const scene of registration.probeScenes) {
		const rays = ALL_RAYS.map((rayIndex) => {
			const ray = benchmarkRay(
				baseline.loaded.control.buildRequest.transportSpec,
				scene,
				rayIndex % 9,
				Math.floor(rayIndex / 9),
			);
			const up =
				ray.origin.reduce((sum, value, axis) => sum + value * ray.direction[axis], 0) /
				Math.hypot(...ray.origin);
			return {
				rayIndex,
				elevationDegrees: (Math.asin(Math.max(-1, Math.min(1, up))) * 180) / Math.PI,
				sunSeparationDegrees: (Math.acos(Math.max(-1, Math.min(1, ray.direction[2]))) * 180) / Math.PI,
			};
		});
		const strata = [
			{id: `${scene.time}/all-rays`, time: scene.time, rayIndices: ALL_RAYS},
			...geometricStrata(scene.time, rays),
		];
		for (const group of strata) {
			if (registration.record.scopes.screen.times.includes(scene.time))
				result.push({
					id: `screen/${group.id}`,
					scope: 'screen',
					time: scene.time,
					rayIndices: group.rayIndices,
					channels: registration.record.scopes.screen.channels,
					probes: [],
				});
			const probes = registration.probes
				.filter(
					(probe) => probe.time === scene.time && group.rayIndices.includes(probe.gridY * 9 + probe.gridX),
				)
				.sort((a, b) => a.gridY * 9 + a.gridX - (b.gridY * 9 + b.gridX));
			result.push({
				id: `component/${group.id}`,
				scope: 'component',
				time: scene.time,
				rayIndices: probes.map((probe) => probe.gridY * 9 + probe.gridX),
				channels: registration.record.scopes.probeChannels,
				probes,
			});
		}
		const all = result.find((group) => group.id === `component/${scene.time}/all-rays`);
		for (const channel of registration.record.scopes.probeChannels)
			result.push({...all, id: `${all.id}/channel-${channel}`, channels: [channel]});
	}
	return result;
}

/** Select a retained ordinary spectrum once per exact selector.
 * @param {SkyLadderSource} source @param {number} q @param {number} order @param {SkyLadderRepresentation} representation
 * @returns {DialAnalysisBoundary|null}
 */
function boundary(source, q, order, representation) {
	if (!source.loaded.control.controls.viewIntervals.includes(q)) return null;
	const key = `${representation}/${q}/${order}`;
	if (!source.boundaries.has(key))
		source.boundaries.set(key, extractBoundary(source.loaded, representation, q, 'monotone-cubic', order));
	return source.boundaries.get(key);
}

/** Select matched finite vectors; null q denotes the independent fixed-field envelope, not a runtime view.
 * @param {SkyLadderSource|undefined} source @param {SkyLadderGroup} group @param {number|null} q
 * @param {number} [order] @param {SkyLadderRepresentation} [representation] @returns {SkyLadderVector}
 */
function vector(source, group, q, order = 4, representation = 'grouped') {
	const count = group.rayIndices.length * group.channels.length;
	if (!source) return {values: Array(count).fill(null), allowances: Array(count).fill(null)};
	if (q === null) {
		assert.equal(group.scope, 'component');
		const probes = group.probes.flatMap((probe) =>
			group.channels.map((channel) =>
				source.envelopes.get(`${channel}/${probe.probeId}/${representation}/${order}`),
			),
		);
		return {
			values: probes.map((probe) => probe?.value ?? null),
			allowances: probes.map((probe) => probe?.errorAllowance ?? null),
		};
	}
	const values = boundary(source, q, order, representation),
		timeIndex = values?.times.indexOf(group.time) ?? -1;
	if (timeIndex < 0) return {values: Array(count).fill(null), allowances: Array(count).fill(null)};
	return {
		values: group.rayIndices.flatMap((ray) =>
			group.channels.map(
				(channel) =>
					values.values[(timeIndex * 81 + ray) * values.channels.length + values.channels.indexOf(channel)],
			),
		),
		allowances: Array(count).fill(null),
	};
}

/** Original measured values aligned to any explicitly scoped group.
 * @param {DialAnalysisBoundary} measured @param {SkyLadderGroup} group @returns {number[]}
 */
function observed(measured, group) {
	const time = measured.times.indexOf(group.time);
	assert.ok(time >= 0);
	return group.rayIndices.flatMap((ray) =>
		group.channels.map((channel) => {
			const index = measured.channels.indexOf(channel);
			assert.ok(index >= 0);
			return measured.values[(time * 81 + ray) * measured.channels.length + index];
		}),
	);
}

/** Orient a pair candidate minus baseline on the selected boundary.
 * @param {ReadonlyMap<string,SkyLadderSource>} lookup @param {SkyLadderPair} pair @param {SkyLadderGroup} group
 * @param {number|null} q @param {number} [order] @returns {(number|null)[]}
 */
function response(lookup, pair, group, q, order = 4) {
	return difference(
		vector(lookup.get(pair.baseline), group, q, order).values,
		vector(lookup.get(pair.candidate), group, q, order).values,
	);
}

/** Conservative sensitivity records never imply a qualified remaining error by themselves.
 * @param {string} component @param {SkyLadderPair} pair @param {ReadonlyMap<string,SkyLadderSource>} lookup
 * @param {SkyLadderGroup} group @param {number|null} q @param {number} floor @param {string} reason
 * @returns {SkyLadderComponent}
 */
function heuristic(component, pair, lookup, group, q, floor, reason) {
	return {
		component,
		support: `${pair.candidate}-${pair.baseline}`,
		twiceObservedNormW: deltaMetrics(response(lookup, pair, group, q), floor).twiceObservedNormW,
		qualifiedAllowanceW: null,
		qualified: false,
		reason,
	};
}

/** Explicit finite-N4 error inventory; unavailable angular/interactions cannot disappear from the sum.
 * @param {ReadonlyMap<string,SkyLadderSource>} lookup @param {SkyLadderGroup} group @param {number} floor
 * @returns {SkyLadderComponent[]}
 */
function componentsFor(lookup, group, floor) {
	const q = group.scope === 'component' ? null : 16,
		r7 = lookup.get('r7'),
		reference = vector(r7, group, q),
		viewAllowance = group.scope === 'component' ? completeNorm(reference.allowances) : null;
	const viewStep =
		r7 && group.scope === 'screen'
			? deltaMetrics(difference(vector(r7, group, 8).values, vector(r7, group, 16).values), floor)
					.twiceObservedNormW
			: null;
	const components = [
		{
			component: 'view-integration',
			support: group.scope === 'component' ? 'R7 fixed-field six-method envelope' : 'R7 view16-view8',
			twiceObservedNormW: viewStep,
			qualifiedAllowanceW: viewAllowance,
			qualified: viewAllowance !== null && completeNorm(reference.values) !== null,
			reason:
				group.scope === 'component'
					? 'Independent integration of fixed Float32 fields only; null if any envelope is missing/unresolved.'
					: 'Ordinary full-ray scope has no independent reference on every ray. A midpoint step difference alone is not a remainder bound.',
		},
		heuristic(
			'source-integration',
			{baseline: 'r9', candidate: 'r7'},
			lookup,
			group,
			q,
			floor,
			'Final-background S80-to-S160 response; two levels do not establish its remaining error or transport interactions.',
		),
		heuristic(
			'transport-integration',
			{baseline: 'r10', candidate: 'r7'},
			lookup,
			group,
			q,
			floor,
			'Final-background T160-to-T320 response; source, path reconstruction and ground contributions remain coupled.',
		),
		heuristic(
			'altitude-reconstruction',
			{baseline: 'r11', candidate: 'r7'},
			lookup,
			group,
			q,
			floor,
			'Final-background P55-to-P63 response; decreasing earlier changes do not bound the continuous-height remainder.',
		),
		heuristic(
			'outgoing-reconstruction',
			{baseline: 'r5', candidate: 'r6'},
			lookup,
			group,
			q,
			floor,
			'W39-to-W51 is measured before incoming refinement. W51 is a layout ceiling, not an independently qualified angular remainder.',
		),
		heuristic(
			'incoming-quadrature',
			{baseline: 'r6', candidate: 'r7'},
			lookup,
			group,
			q,
			floor,
			'Only one final-background count change; the original incoming quarter law failed twice. No angular or local-J2 full-solver bound is supplied.',
		),
		heuristic(
			'incoming-placement',
			{baseline: 'r7', candidate: 'r8'},
			lookup,
			group,
			q,
			floor,
			'Same-count azimuth placement sensitivity is not convergence and cannot bound both placement rules.',
		),
		{
			component: 'precision-and-grouping',
			support: 'R7 grouped-cumulative',
			twiceObservedNormW: deltaMetrics(
				difference(vector(r7, group, q, 4, 'cumulative').values, reference.values),
				floor,
			).twiceObservedNormW,
			qualifiedAllowanceW: null,
			qualified: false,
			reason: 'Nonlinear grouping contrast is measured where available; it is not a floating-point precision ladder or full reconstruction-error bound.',
		},
		{
			component: 'solar-reconstruction',
			support: 'Z180 monotone-cubic held fixed',
			twiceObservedNormW: null,
			qualifiedAllowanceW: null,
			qualified: false,
			reason: 'The ladder contains no independent solar reconstruction remainder on this background.',
		},
		{
			component: 'interactions',
			support: 'C4 factorials not supplied by the C2 ladder',
			twiceObservedNormW: null,
			qualifiedAllowanceW: null,
			qualified: false,
			reason: 'Source/transport return contrasts reveal combined background dependence, but no complete isolated interaction allowance is supplied.',
		},
		{
			component: 'ground-and-local-j2',
			support: 'Optional matched ground-density witnesses only',
			twiceObservedNormW: null,
			qualifiedAllowanceW: null,
			qualified: false,
			reason: 'Point densities use different units and do not bound path-integrated N4. No independent local-J2 comparison or propagated full-solver error bound is part of this API.',
		},
	];
	return components;
}

/** Assess independently integrated fixed-field view accuracy and its finite measured residual decomposition.
 * @param {readonly SkyLadderSource[]} sources @param {readonly SkyLadderGroup[]} groups
 * @param {DialAnalysisBoundary} measured @param {DialContinuationScientificGates} gates @returns {SkyContinuationAnalysisTable}
 */
function viewTable(sources, groups, measured, gates) {
	const columns = [
		'case',
		'group',
		'order',
		'count',
		'resolved_reference_count',
		'error8_norm_W',
		'error16_norm_W',
		'reference_allowance_norm_W',
		'reduction_W',
		'qualified_local_view_control',
		'measurement_SSE8_W2',
		'view_error_SSE8_W2',
		'remaining_SSE_W2',
		'cross_term8_W2',
		'representation',
	];
	/** @type {SkyContinuationAnalysisCell[][]} */ const rows = [];
	for (const source of sources)
		for (const group of groups.filter((group) => group.scope === 'component'))
			for (let order = 1; order <= 4; order++) {
				const ref = vector(source, group, null, order),
					a = vector(source, group, 8, order),
					b = vector(source, group, 16, order);
				const n = difference(ref.values, a.values),
					error8 = completeNorm(n),
					error16 = completeNorm(difference(ref.values, b.values)),
					allowance = completeNorm(ref.allowances);
				const reduction = error8 === null || error16 === null ? null : error8 - error16;
				let residualSse = null,
					numericalSse = null,
					remainingSse = null,
					cross = null;
				if (order === 4 && error8 !== null && allowance !== null) {
					const measurement = observed(measured, group),
						p = difference(measurement, ref.values),
						r = difference(measurement, a.values);
					residualSse = r.reduce((sum, value) => sum + value ** 2, 0);
					numericalSse = n.reduce((sum, value) => sum + value ** 2, 0);
					remainingSse = p.reduce((sum, value) => sum + value ** 2, 0);
					cross = n.reduce((sum, value, index) => sum + 2 * value * p[index], 0);
					assert.ok(
						Math.abs(residualSse - numericalSse - remainingSse - cross) <=
							256 *
								Number.EPSILON *
								Math.max(1e-30, residualSse, numericalSse, remainingSse, Math.abs(cross)),
					);
				}
				rows.push([
					source.loaded.caseId,
					group.id,
					order,
					a.values.length,
					ref.allowances.filter((value) => value !== null).length,
					error8,
					error16,
					allowance,
					reduction,
					localReductionGate(reduction, allowance, gates),
					residualSse,
					numericalSse,
					remainingSse,
					cross,
					'grouped',
				]);
			}
	return {columns, rows};
}

/** Evaluate all promised finite scopes; nothing here is a prospective predictor.
 * @param {readonly SkyLadderSource[]} sources @param {DialContinuationRegistrationRead} registration
 * @param {DialAnalysisBoundary} measured @param {() => void} progress @returns {SkyLadderEvaluation}
 */
export function evaluateLadder(sources, registration, measured, progress) {
	const groups = ladderGroups(sources[0], registration),
		lookup = new Map(sources.map((source) => [source.loaded.caseId, source]));
	const floor = registration.record.scientificGates.implementationFloorW;
	/** @type {SkyContinuationAnalysisCell[][]} */ const scoreRows = [],
		contrastRows = [],
		backgroundRows = [],
		componentRows = [],
		adequacyRows = [],
		memberRows = [];
	for (const source of sources) {
		progress();
		for (const q of [8, 16])
			for (let order = 1; order <= 4; order++) {
				const model = boundary(source, q, order, 'grouped'),
					channels = registration.record.scopes.screen.channels.filter((channel) =>
						registration.record.scopes.scoreChannels.includes(channel),
					);
				const score = model ? scoreBoundary(model, measured, channels) : null;
				scoreRows.push([
					source.loaded.caseId,
					q,
					order,
					'screen/all-three-times/all-rays',
					model?.values.length ?? 0,
					score?.sampleCount ?? 0,
					score?.aggregateRmseMilliwatt ?? null,
					false,
				]);
			}
		for (const q of [8, 16])
			for (let order = 1; order <= 4; order++)
				for (const group of groups.filter((group) => group.scope === 'screen')) {
					const model = boundary(source, q, order, 'grouped');
					const scoreChannels = group.channels.filter((channel) =>
						registration.record.scopes.scoreChannels.includes(channel),
					);
					const score =
						model && group.rayIndices.length
							? scoreBoundary(
									selectBoundary(model, {
										times: [group.time],
										rayIndices: group.rayIndices,
										channels: model.channels,
									}),
									measured,
									scoreChannels,
								)
							: null;
					scoreRows.push([
						source.loaded.caseId,
						q,
						order,
						group.id,
						group.rayIndices.length * group.channels.length,
						score?.sampleCount ?? 0,
						score?.aggregateRmseMilliwatt ?? null,
						false,
					]);
				}
	}
	for (let index = 1; index < sources.length; index++) {
		progress();
		const firstId = `r${index >= 8 ? 7 : index - 1}`,
			secondId = `r${index}`;
		for (const q of [8, 16])
			for (let order = 1; order <= 4; order++)
				for (const group of groups.filter((group) => group.scope === 'screen')) {
					const delta = response(lookup, {baseline: firstId, candidate: secondId}, group, q, order),
						metrics = deltaMetrics(delta, floor);
					const previous =
						order === 1
							? Array(delta.length).fill(0)
							: response(lookup, {baseline: firstId, candidate: secondId}, group, q, order - 1);
					const increment = deltaMetrics(difference(previous, delta), floor);
					const invariantExpected = order === 1 && [2, 7, 8, 10].includes(index);
					const invariant =
						invariantExpected && metrics.normW !== null ? delta.every((value) => value === 0) : null;
					contrastRows.push([
						firstId,
						secondId,
						q,
						order,
						group.id,
						metrics.count,
						metrics.availableCount,
						metrics.normW,
						metrics.rmsW,
						metrics.meanW,
						metrics.twiceObservedNormW,
						metrics.significantCount,
						metrics.positiveCount,
						metrics.negativeCount,
						increment.normW,
						invariant,
					]);
				}
	}
	const backgrounds = [
		{
			name: 'source-background',
			initial: {baseline: 'r0', candidate: 'r1'},
			final: {baseline: 'r9', candidate: 'r7'},
		},
		{
			name: 'transport-background',
			initial: {baseline: 'r1', candidate: 'r2'},
			final: {baseline: 'r10', candidate: 'r7'},
		},
		{
			name: 'altitude-background',
			initial: {baseline: 'r3', candidate: 'r4'},
			final: {baseline: 'r11', candidate: 'r7'},
		},
		{
			name: 'altitude-successive-steps',
			initial: {baseline: 'r2', candidate: 'r3'},
			final: {baseline: 'r3', candidate: 'r4'},
		},
		{
			name: 'outgoing-successive-steps',
			initial: {baseline: 'r4', candidate: 'r5'},
			final: {baseline: 'r5', candidate: 'r6'},
		},
	];
	for (const group of groups) {
		progress();
		const q = group.scope === 'component' ? null : 16;
		for (const item of backgrounds)
			for (let order = 1; order <= 4; order++) {
				const a = response(lookup, item.initial, group, q, order),
					b = response(lookup, item.final, group, q, order),
					comparison = compareResponses(a, b, floor);
				backgroundRows.push([
					item.name,
					group.id,
					q,
					order,
					`${item.initial.candidate}-${item.initial.baseline}`,
					`${item.final.candidate}-${item.final.baseline}`,
					a.length,
					completeNorm(a),
					completeNorm(b),
					comparison.normRatio,
					comparison.cosine,
					comparison.differenceNormW,
					comparison.differenceNormW === null ? null : 2 * comparison.differenceNormW,
				]);
			}
		const components = componentsFor(lookup, group, floor),
			total = totalQualifiedAllowance(components);
		for (const item of components)
			componentRows.push([
				group.id,
				q,
				item.component,
				item.support,
				item.twiceObservedNormW,
				item.qualifiedAllowanceW,
				item.qualified,
				item.reason,
			]);
		const reference = vector(lookup.get('r7'), group, q),
			available = completeNorm(reference.values) !== null;
		adequacyRows.push([
			group.id,
			group.rayIndices.length * group.channels.length,
			q,
			'r7',
			available,
			components.filter((component) => component.qualified).length,
			components.length,
			total,
			available && total !== null,
			components
				.filter((component) => !component.qualified)
				.map((component) => component.component)
				.join(' | '),
			false,
		]);
		for (const referenceId of ['r7', 'r8', 'r9', 'r10', 'r11'])
			for (const source of sources) {
				const candidateQ = group.scope === 'component' ? null : 8;
				const member = vector(lookup.get('r7') ? lookup.get(referenceId) : undefined, group, q);
				const distance = deltaMetrics(
					difference(member.values, vector(source, group, candidateQ).values),
					floor,
				);
				memberRows.push([
					group.id,
					source.loaded.caseId,
					candidateQ,
					referenceId,
					q,
					distance.count,
					distance.availableCount,
					distance.normW,
					total,
					null,
					false,
				]);
			}
	}
	return {
		scores: {
			columns: [
				'case',
				'view_subdivisions',
				'order',
				'group',
				'numerical_count',
				'score_count',
				'Kider_rmse_mW',
				'full_registered_boundary',
			],
			rows: scoreRows,
		},
		contrasts: {
			columns: [
				'baseline',
				'candidate',
				'view_subdivisions',
				'order',
				'group',
				'count',
				'available_count',
				'delta_norm_W',
				'delta_rms_W',
				'delta_mean_W',
				'twice_observed_norm_W',
				'significant_count',
				'positive_count',
				'negative_count',
				'effective_increment_change_norm_W',
				'expected_C1_invariance_pass',
			],
			rows: contrastRows,
		},
		views: viewTable(sources, groups, measured, registration.record.scientificGates),
		backgrounds: {
			columns: [
				'comparison',
				'group',
				'view_subdivisions_null_means_fixed_field',
				'order',
				'initial_response',
				'final_response',
				'count',
				'initial_norm_W',
				'final_norm_W',
				'norm_ratio',
				'cosine',
				'response_difference_norm_W',
				'twice_response_difference_norm_W',
			],
			rows: backgroundRows,
		},
		components: {
			columns: [
				'group',
				'view_subdivisions_null_means_fixed_field',
				'component',
				'support',
				'twice_observed_sensitivity_norm_W',
				'qualified_allowance_W',
				'qualified',
				'reason',
			],
			rows: componentRows,
		},
		adequacy: {
			columns: [
				'group',
				'count',
				'reference_view_null_means_fixed_field',
				'reference_case',
				'reference_member_available',
				'qualified_component_count',
				'required_component_count',
				'total_reference_allowance_W',
				'finite_N4_reference_adequate',
				'unresolved_components',
				'full17_31channel_boundary',
			],
			rows: adequacyRows,
		},
		members: {
			columns: [
				'group',
				'candidate_case',
				'candidate_view_null_means_fixed_field',
				'reference_case',
				'reference_view_null_means_fixed_field',
				'count',
				'available_count',
				'distance_to_member_W_not_true_error',
				'qualified_reference_allowance_W',
				'qualified_numerical_reduction',
				'prospective',
			],
			rows: memberRows,
		},
	};
}
