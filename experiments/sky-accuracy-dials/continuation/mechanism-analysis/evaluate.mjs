import assert from 'node:assert/strict';
import {ALL_RAYS, assertAligned, selectBoundary} from '../../analysis/boundary.mjs';
import {scoreBoundary, scoreDeltaIdentity, spectralDelta, factorialContrast} from '../../analysis/metrics.mjs';
import {extractBoundary} from '../../processing.mjs';
import {interactionStrata} from '../interaction/metrics.mjs';
import {localJ2FiniteControls} from '../j2/finite.mjs';
import {assertGroundDirection} from '../geometry.mjs';

/** Positive reduction and symmetric worsening use the same empirical separation gates.
 * These are component-unit engineering allowances, not statistical confidence.
 * @param {number} before @param {number} after @param {number} reference @param {number|null} allowance
 * @returns {SkyMechanismReduction}
 */
export function compareMechanismReference(before, after, reference, allowance) {
	for (const value of [before, after, reference]) assert.ok(Number.isFinite(value));
	assert.ok(allowance === null || (Number.isFinite(allowance) && allowance >= 0));
	const reduction = Math.abs(before - reference) - Math.abs(after - reference),
		magnitude = Math.abs(reduction);
	const adequate = allowance !== null && allowance <= 0.2 * magnitude && magnitude > 2 * allowance;
	return {reduction, status: adequate ? (reduction > 0 ? 'improved' : 'worsened') : 'unresolved'};
}

/** SSE correction to an additive prediction, whose signed values may be negative.
 * All four supplied outcomes are physical radiances. The intermediate additive
 * prediction is algebra, not a radiance boundary and is never clipped or scored
 * through the nonnegative physical-boundary admission path.
 * @param {DialAnalysisBoundary} a @param {DialAnalysisBoundary} b
 * @param {DialAnalysisBoundary} c @param {DialAnalysisBoundary} d
 * @param {DialAnalysisBoundary} measured @returns {DialScoreDeltaIdentity}
 */
export function interactionResidualIdentity(a, b, c, d, measured) {
	for (const value of [b, c, d, measured]) assertAligned(a, value);
	let residualCrossTerm = 0,
		deltaSquaredNorm = 0,
		before = 0,
		after = 0;
	for (let index = 0; index < a.values.length; index++) {
		const additive = b.values[index] + c.values[index] - a.values[index],
			residual = additive - measured.values[index],
			change = d.values[index] - additive;
		residualCrossTerm += 2 * residual * change;
		deltaSquaredNorm += change * change;
		before += residual * residual;
		after += (residual + change) ** 2;
	}
	const predictedSquaredErrorChange = residualCrossTerm + deltaSquaredNorm,
		actualSquaredErrorChange = after - before;
	for (const value of [residualCrossTerm, deltaSquaredNorm, predictedSquaredErrorChange, actualSquaredErrorChange])
		assert.ok(Number.isFinite(value));
	return {
		residualCrossTerm,
		deltaSquaredNorm,
		predictedSquaredErrorChange,
		actualSquaredErrorChange,
		identityResidual: actualSquaredErrorChange - predictedSquaredErrorChange,
	};
}

/** Fixed scope memberships depend only on registered geometry.
 * @param {SkyMechanismAssessmentCapture} source @returns {readonly SkyMechanismMetricGroup[]}
 */
function groups(source) {
	const times = source.loaded.control.scenes.map((scene) => scene.time);
	return [
		{id: 'all-three-times/all-rays', times, rayIndices: ALL_RAYS},
		...times.map((time) => ({id: `${time}/all-rays`, times: [time], rayIndices: ALL_RAYS})),
		...interactionStrata(source.loaded.control).map((group) => ({
			id: group.id,
			times: [group.time],
			rayIndices: group.rayIndices,
		})),
	];
}

/** Require an exact input identity once, before all derived selections.
 * @param {readonly SkyMechanismAssessmentCapture[]} sources @param {string} id @returns {SkyMechanismAssessmentCapture}
 */
function capture(sources, id) {
	const found = sources.filter((source) => source.caseId === id);
	assert.equal(found.length, 1);
	return found[0];
}

/** Counted ordinary selections never include separately captured component-only rays.
 * @param {SkyMechanismAssessmentCapture} source @param {number} view @param {number} order @returns {DialAnalysisBoundary}
 */
function boundary(source, view, order) {
	return extractBoundary(source.loaded, 'grouped', view, 'monotone-cubic', order);
}

/** Check matched N1 spectra and only compare sparse hashes when coordinates agree.
 * Raw H recapture parity is all N1-N4, proving eligibility as the missing H ground witness.
 * @param {readonly SkyMechanismAssessmentCapture[]} sources @returns {SkyContinuationAnalysisTable}
 */
function invariance(sources) {
	/** @type {SkyContinuationAnalysisCell[][]} */ const rows = [];
	const pairs = [
		['r0', 'v-raw'],
		['h-factored', 'v-factored'],
		['r0', 'd48-split'],
		['d48-split', 'd48-factored'],
		['d55-raw', 'd55-split'],
		['d55-split', 'd55-factored'],
		['r0', 'i512-end'],
		['r0', 'i512-aspect'],
		['i512-end', 'i2048-end'],
	];
	for (const [aId, bId] of pairs) {
		const a = capture(sources, aId),
			b = capture(sources, bId),
			recapture = bId.startsWith('v-');
		if (recapture) assert.deepEqual(a.loaded.control.buildRequest, b.loaded.control.buildRequest);
		const matchingCoordinates = a.coordinateSha256 === b.coordinateSha256;
		for (const view of [8, 16])
			for (let order = 1; order <= (recapture ? 4 : 1); order++) {
				const av = boundary(a, view, order).values,
					bv = boundary(b, view, order).values;
				assert.equal(av.length, bv.length);
				let maximum = 0,
					different = 0;
				for (let i = 0; i < av.length; i++) {
					maximum = Math.max(maximum, Math.abs(bv[i] - av[i]));
					if (bv[i] !== av[i]) different++;
				}
				assert.ok(
					maximum <= 1e-8,
					'Matched first-order or H recapture spectrum exceeds the original implementation floor.',
				);
				rows.push([
					aId,
					bId,
					view,
					order,
					av.length,
					different,
					maximum,
					maximum <= 1e-8,
					matchingCoordinates,
					null,
					null,
				]);
			}
		if (matchingCoordinates)
			for (const [index, channel] of a.channels.entries()) {
				assert.equal(channel.channel, b.channels[index].channel);
				const af = channel.fieldChecks.find((field) => field.fieldId === 'J1'),
					bf = b.channels[index].fieldChecks.find((field) => field.fieldId === 'J1');
				assert.equal(
					af.pureSha256,
					bf.pureSha256,
					'Matched support and direct-J1 shader must preserve exact source values.',
				);
				rows.push([
					aId,
					bId,
					null,
					1,
					null,
					null,
					null,
					true,
					true,
					channel.channel,
					af.pureSha256 === bf.pureSha256,
				]);
			}
	}
	return {
		columns: [
			'baseline',
			'candidate',
			'view_subdivisions',
			'order',
			'scalar_count',
			'nonidentical_scalars',
			'maximum_absolute_difference_W',
			'implementation_floor_pass',
			'coordinate_union_equal',
			'channel',
			'J1_hash_equal_on_identical_coordinates',
		],
		rows,
	};
}

/** Keep whole signed radiance responses and their exact residual/SSE effect separate.
 * Altitude interactions compare complete matched 2x2 vertices; grouping/storage/
 * recurrence feedback is distinct from density placement, including roundoff.
 * @param {SkyMechanismAssessmentInputs} inputs @param {DialAnalysisBoundary} measured
 * @returns {SkyMechanismResponseEvaluation}
 */
export function evaluateMechanismResponses(inputs, measured) {
	const sources = inputs.captures,
		h = capture(sources, 'r0'),
		invariant = invariance(sources),
		scoreChannels = [0, 8, 16, 24, 30];
	const memberships = groups(h),
		densityIds = ['r0', 'd48-split', 'd48-factored', 'd55-raw', 'd55-split', 'd55-factored'];
	/** @type {SkyContinuationAnalysisCell[][]} */ const scores = [],
		contrasts = [],
		layout = [],
		fixedFields = [];
	/** @type {Buffer[]} */ const packed = [];
	let byteOffset = 0,
		densityGain = 0,
		incomingGain = 0,
		densityObserved = false,
		incomingObserved = false;
	const pairs = [
		['p48-grouping', 'r0', 'd48-split'],
		['p48-density', 'd48-split', 'd48-factored'],
		['p55-grouping', 'd55-raw', 'd55-split'],
		['p55-density', 'd55-split', 'd55-factored'],
		['altitude-combined', 'r0', 'd55-raw'],
		['altitude-split', 'd48-split', 'd55-split'],
		['altitude-factored', 'd48-factored', 'd55-factored'],
		['incoming-placement', 'r0', 'i512-end'],
		['incoming-aspect', 'r0', 'i512-aspect'],
		['incoming-count-endpoint', 'i512-end', 'i2048-end'],
	];
	for (const source of sources.filter((source) => !['h-factored', 'v-raw', 'v-factored'].includes(source.caseId)))
		for (const view of [8, 16])
			for (let order = 1; order <= 4; order++) {
				const full = boundary(source, view, order);
				for (const group of memberships) {
					const selection = {times: group.times, rayIndices: group.rayIndices, channels: scoreChannels};
					const score = scoreBoundary(
						selectBoundary(full, selection),
						selectBoundary(measured, selection),
						scoreChannels,
					);
					scores.push([
						source.caseId,
						view,
						order,
						group.id,
						score.sampleCount,
						score.aggregateRmseMilliwatt,
						score.squaredError,
						false,
					]);
				}
			}
	for (const view of [8, 16])
		for (let order = 1; order <= 4; order++) {
			for (const [id, aId, bId] of pairs) {
				const a = boundary(capture(sources, aId), view, order),
					b = boundary(capture(sources, bId), view, order),
					delta = spectralDelta(a, b),
					isDensity = !id.startsWith('incoming-');
				if (isDensity) {
					const bytes = Buffer.alloc(delta.values.length * 8);
					delta.values.forEach((value, index) => bytes.writeDoubleLE(value, index * 8));
					layout.push([
						id,
						view,
						order,
						byteOffset,
						bytes.length,
						delta.values.length,
						'time/y*9+x/channel',
						'W m^-2 sr^-1 nm^-1',
					]);
					packed.push(bytes);
					byteOffset += bytes.length;
				}
				for (const group of memberships) {
					const selection = {times: group.times, rayIndices: group.rayIndices, channels: a.channels};
					const selected = selectBoundary(delta, selection);
					const norm = Math.hypot(...selected.values),
						maximum = Math.max(...Array.from(selected.values, Math.abs)),
						mean = selected.values.reduce((sum, value) => sum + value, 0) / selected.values.length;
					const scoring = {...selection, channels: scoreChannels},
						sa = selectBoundary(a, scoring),
						sb = selectBoundary(b, scoring),
						sm = selectBoundary(measured, scoring),
						sd = selectBoundary(delta, scoring);
					const aScore = scoreBoundary(sa, sm, scoreChannels),
						bScore = scoreBoundary(sb, sm, scoreChannels),
						sse = scoreDeltaIdentity(sa, sm, sd),
						gain = aScore.aggregateRmseMilliwatt - bScore.aggregateRmseMilliwatt;
					assert.ok(
						Math.abs(sse.identityResidual) <= 1e-12 * Math.max(1, aScore.squaredError, bScore.squaredError),
					);
					if (group.id === 'all-three-times/all-rays') {
						if (isDensity) {
							densityGain += Number(gain > 0);
							densityObserved ||= norm > 0;
						} else {
							incomingGain += Number(gain > 0);
							incomingObserved ||= norm > 0;
						}
					}
					contrasts.push([
						id,
						'candidate-minus-baseline',
						aId,
						bId,
						view,
						order,
						group.id,
						selected.values.length,
						norm,
						norm / Math.sqrt(selected.values.length),
						mean,
						maximum,
						gain,
						sse.residualCrossTerm,
						sse.deltaSquaredNorm,
						sse.actualSquaredErrorChange,
						sse.identityResidual,
						null,
						null,
					]);
				}
			}
			for (const [id, aId, bId, cId, dId] of [
				['density-by-altitude', 'd48-split', 'd48-factored', 'd55-split', 'd55-factored'],
				['grouping-by-altitude', 'r0', 'd48-split', 'd55-raw', 'd55-split'],
			]) {
				const [a, b, c, d] = [aId, bId, cId, dId].map((id) => boundary(capture(sources, id), view, order));
				// Full numerical contrast includes channel39 and requires no measurement.
				// The explicit altitude-first subtraction is retained without rounding.
				const full = {
					...d,
					quantity: /** @type {DialAnalysisQuantity} */ ('delta'),
					values: Float64Array.from(
						d.values,
						(value, index) => value - b.values[index] - (c.values[index] - a.values[index]),
					),
				};
				const bytes = Buffer.alloc(full.values.length * 8);
				full.values.forEach((value, index) => bytes.writeDoubleLE(value, index * 8));
				layout.push([
					id,
					view,
					order,
					byteOffset,
					bytes.length,
					full.values.length,
					'time/y*9+x/channel',
					'W m^-2 sr^-1 nm^-1',
				]);
				packed.push(bytes);
				byteOffset += bytes.length;
				for (const group of memberships) {
					const selection = {times: group.times, rayIndices: group.rayIndices, channels: a.channels},
						values = selectBoundary(full, selection).values;
					const scoring = {...selection, channels: scoreChannels},
						[sa, sb, sc, sd] = [a, b, c, d].map((item) => selectBoundary(item, scoring)),
						sm = selectBoundary(measured, scoring);
					const factorial = factorialContrast(sa, sb, sc, sd, sm, 1e-8),
						norm = Math.hypot(...values),
						mean = values.reduce((sum, value) => sum + value, 0) / values.length;
					const sse = interactionResidualIdentity(sa, sb, sc, sd, sm);
					assert.ok(
						Math.abs(sse.identityResidual) <= 1e-12 * Math.max(1, Math.abs(sse.actualSquaredErrorChange)),
					);
					assert.ok(
						Math.abs(
							factorial.squaredErrorInteraction -
								factorial.additiveSquaredErrorCrossTerm -
								sse.actualSquaredErrorChange,
						) <=
							1e-12 * Math.max(1, Math.abs(factorial.squaredErrorInteraction)),
					);
					contrasts.push([
						id,
						`(${dId}-${bId})-(${cId}-${aId}); SSE residual base=${bId}+${cId}-${aId}`,
						`${aId}|${bId}`,
						`${cId}|${dId}`,
						view,
						order,
						group.id,
						values.length,
						norm,
						norm / Math.sqrt(values.length),
						mean,
						Math.max(...Array.from(values, Math.abs)),
						null,
						sse.residualCrossTerm,
						sse.deltaSquaredNorm,
						sse.actualSquaredErrorChange,
						sse.identityResidual,
						factorial.squaredErrorInteraction,
						factorial.additiveSquaredErrorCrossTerm,
					]);
				}
			}
		}
	// Reference rows integrate each source's own frozen field. A changed field is
	// not compared to another field's envelope as if it were a numerical oracle.
	for (const id of densityIds) {
		const source = capture(sources, id),
			representation = id.includes('split')
				? 'grouped-split-higher'
				: id.includes('factored')
					? 'grouped-factored-higher'
					: 'grouped';
		for (const channel of [0, 8, 24, 30])
			for (const probe of inputs.registration.probes)
				for (let order = 1; order <= 4; order++) {
					const envelope = source.envelopes.get(`${channel}/${probe.probeId}/${representation}/${order}`);
					assert.ok(envelope);
					for (const view of [8, 16]) {
						const full = boundary(source, view, order),
							time = full.times.indexOf(probe.time),
							ch = full.channels.indexOf(channel),
							index = (time * 81 + probe.gridY * 9 + probe.gridX) * full.channels.length + ch;
						const value = time < 0 ? null : full.values[index];
						fixedFields.push([
							id,
							representation,
							channel,
							probe.probeId,
							order,
							view,
							value,
							envelope.value,
							envelope.errorAllowance,
							value === null ? null : value - envelope.value,
							'integration-of-this-frozen-field-only',
						]);
					}
				}
	}
	const incoming = evaluateIncoming(inputs),
		noClaims = {adequate: 0, improved: 0, worsened: 0, unresolved: 0};
	return {
		scores: {
			columns: [
				'case',
				'view_subdivisions',
				'order',
				'group',
				'score_scalar_count',
				'Kider_rmse_mW',
				'Kider_SSE_W2',
				'full_registered_boundary',
			],
			rows: scores,
		},
		contrasts: {
			columns: [
				'contrast',
				'equation',
				'baseline',
				'candidate',
				'view_subdivisions',
				'order',
				'group',
				'numerical_scalar_count',
				'delta_L2_W',
				'delta_RMS_W',
				'delta_mean_W',
				'delta_max_abs_W',
				'Kider_gain_mW',
				'SSE_2r_dot_delta_W2',
				'SSE_delta_squared_W2',
				'SSE_actual_change_W2',
				'SSE_identity_residual_W2',
				'factorial_SSE_interaction_W2',
				'additive_SSE_cross_term_W2',
			],
			rows: contrasts,
		},
		spectra: Buffer.concat(packed),
		spectrumLayout: {
			columns: [
				'contrast',
				'view_subdivisions',
				'order',
				'byte_offset',
				'byte_length',
				'scalar_count',
				'layout',
				'units',
			],
			rows: layout,
		},
		invariance: invariant,
		fixedFields: {
			columns: [
				'case',
				'representation',
				'channel',
				'probe',
				'order',
				'view_subdivisions',
				'ordinary_value_W',
				'fixed_field_reference_W',
				'empirical_allowance_W',
				'ordinary_minus_reference_W',
				'qualification_scope',
			],
			rows: fixedFields,
		},
		incoming: incoming.table,
		finiteControls: incoming.finite,
		densitySummary: {
			classification:
				'Observed matched representation and altitude responses; whole-field numerical accuracy unresolved.',
			observedResponse: densityObserved,
			localNumericalComparisons: noClaims,
			prospectivePrediction: 'not-tested-by-C3',
			kiderImprovementCount: densityGain,
			combinedAccuracyQualified: false,
			limitations: [
				'Combined-to-split changes grouping, storage roundoff, and regenerated recurrence feedback. Split-to-factored moves species density to query locations while retaining the same grouping path; actual atmospheric roundoff is not independently isolated.',
				'Own-field fixed references qualify view integration only. No complete numerical reference ranks the regenerated J2-J4 fields.',
				'Seven pair contrasts and two altitude interactions retain all six spectral channels. SSE and scores use only five measurement channels; geometric groups overlap.',
			],
		},
		incomingSummary: {
			classification:
				'Observed incoming-rule responses with separately qualified or unresolved local J2 density comparisons.',
			observedResponse: incomingObserved,
			localNumericalComparisons: incoming.counts,
			prospectivePrediction: 'not-tested-by-C3',
			kiderImprovementCount: incomingGain,
			combinedAccuracyQualified: false,
			limitations: [
				'Endpoint placement and 8x64 aspect cases have no matched finite binary64 CPU control. Their GPU-reference residuals include angular, finite S/T, Float32 packing and reconstruction differences.',
				'Only sixteen exact-ground source-density references are available; unresolved angular allowances remain null. Local J2 does not establish integrated N4 accuracy.',
				'H lacks original ground taps; its v-raw recapture is used only after generation equality and ordinary N1-N4 parity. The exact ground zero-inward-L1 boundary is retained.',
			],
		},
	};
}

/** Join pure J2 density to exact query geometry; it is never a Kider radiance.
 * @param {SkyMechanismAssessmentInputs} inputs
 * @returns {SkyMechanismIncomingEvaluation}
 */
function evaluateIncoming(inputs) {
	/** @type {SkyContinuationAnalysisCell[][]} */ const rows = [],
		finite = [];
	const counts = {adequate: 0, improved: 0, worsened: 0, unresolved: 0},
		reference = inputs.localJ2.record;
	for (const rule of reference.rules)
		for (const row of rule.rows) {
			for (const [index, value] of row.finite.entries()) {
				const control = localJ2FiniteControls[index];
				finite.push([
					rule.time,
					rule.ruleId,
					row.targetId,
					row.channel,
					control.source,
					control.transport,
					value,
					row.gauss,
					row.simpson,
					row.allowance,
					value - row.gauss,
					'finite-midpoint-rule; not endpoint/aspect GPU parity',
				]);
			}
		}
	for (const [contrast, baselineId, candidateId] of [
		['placement', 'v-raw', 'i512-end'],
		['aspect', 'v-raw', 'i512-aspect'],
		['count-endpoint', 'i512-end', 'i2048-end'],
	])
		for (const target of reference.targets)
			for (const channel of reference.channels) {
				const [a, b] = [baselineId, candidateId].map((id) => {
					const source = capture(inputs.captures, id),
						diagnostic = source.diagnostics.find((item) => item.channel === channel),
						evidence = diagnostic?.value.groundDensities;
					assert.ok(evidence);
					assert.equal(evidence.units, reference.units);
					const row = evidence.rows.find((row) => row.probeId === target.id);
					assert.ok(row);
					assert.deepEqual(row.origin, target.origin);
					assertGroundDirection(row.direction, target.direction);
					return row.pureDensities[1];
				});
				const envelope = reference.envelopes.find(
					(row) => row.targetId === target.id && row.channel === channel,
				);
				assert.ok(envelope && envelope.estimate !== null);
				const result = compareMechanismReference(a, b, envelope.estimate, envelope.empiricalAllowance);
				counts[result.status]++;
				if (result.status !== 'unresolved') counts.adequate++;
				const midpoint = reference.rules
					.find((rule) => rule.time === target.time && rule.ruleId === 'i512-midpoint')
					.rows.find((row) => row.targetId === target.id && row.channel === channel);
				rows.push([
					contrast,
					baselineId,
					candidateId,
					target.id,
					target.time,
					channel,
					a,
					b,
					b - a,
					envelope.estimate,
					envelope.empiricalAllowance,
					Math.abs(a - envelope.estimate),
					Math.abs(b - envelope.estimate),
					result.reduction,
					result.status,
					baselineId === 'v-raw' ? midpoint.finite[0] : null,
					baselineId === 'v-raw' ? a - midpoint.finite[0] : null,
					null,
					'W m^-3 sr^-1 nm^-1',
				]);
			}
	return {
		table: {
			columns: [
				'contrast',
				'baseline',
				'candidate',
				'probe',
				'time',
				'channel',
				'baseline_J2_density',
				'candidate_J2_density',
				'delta_J2_density',
				'continuous_L1_angular_estimate',
				'empirical_density_allowance',
				'baseline_abs_error',
				'candidate_abs_error',
				'absolute_error_reduction',
				'local_comparison_status',
				'baseline_matched_midpoint_S80_T160_binary64',
				'baseline_GPU_minus_matched_finite',
				'candidate_matched_finite_unavailable',
				'units',
			],
			rows,
		},
		finite: {
			columns: [
				'time',
				'rule',
				'probe',
				'channel',
				'source_intervals',
				'transport_intervals',
				'finite_binary64_density',
				'continuous_L1_gauss_density',
				'continuous_L1_simpson_density',
				'propagated_L1_allowance_only',
				'finite_minus_continuous_L1_density',
				'scope',
			],
			rows: finite,
		},
		counts,
	};
}
