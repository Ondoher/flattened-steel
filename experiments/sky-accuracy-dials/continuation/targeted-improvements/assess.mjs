import assert from 'node:assert/strict';
import {targetedShaders} from './kernels.mjs';

/** Closed matrix labels, kept separate from scientific outcome selection. */
export const modeNames = [
	'raw split',
	'density',
	'phase',
	'density + phase',
	'columns',
	'density + columns',
	'phase + columns',
	'density + phase + columns',
	'separate T',
	'density + separate T',
	'phase + separate T',
	'density + phase + separate T',
	'raw combined',
];

/** Focused manufactured algebra and runtime-structure checks; no reference integration.
 * @returns {number} Number of assertions performed.
 */
export function manufacturedProof() {
	const n = [2, -3, 1],
		r = [-4, 2, 0.5];
	assert.equal(
		n.reduce((s, x, i) => s + (x + r[i]) ** 2, 0),
		n.reduce((s, x, i) => s + x * x + 2 * x * r[i] + r[i] ** 2, 0),
	);
	const factorial = [10, 12, 13, 20, 15, 19, 23, 41],
		terms = factorialTerms(factorial);
	assert.deepEqual(terms, [10, 2, 3, 5, 5, 2, 5, 9]);
	assert.equal(
		terms.reduce((s, x) => s + x, 0),
		factorial[7],
	);
	const helpers = targetedShaders.rays.split('void main()')[0];
	assert.ok(!/\b(for|while|do)\b/.test(helpers), 'Per-sample helper closure must have no loops.');
	assert.equal((targetedShaders.rays.match(/\bfor\s*\(/g) || []).length, 1);
	assert.equal(modeNames.length, 13);
	return 6;
}

/** Inclusion-exclusion in fixed mask order: intercept, D, P, DP, C, DC, PC, DPC.
 * @param {readonly number[]} values @returns {number[]}
 */
function factorialTerms(values) {
	const result = [...values];
	for (const bit of [1, 2, 4])
		for (let mask = 0; mask < 8; mask++) if (mask & bit) result[mask] -= result[mask ^ bit];
	return result;
}

/** Decode the fixed GPU matrix against authenticated prior first-order and Kider evidence.
 * @param {SkyTargetedPayload} payload @param {SkyTargetedGpuResult} gpu
 * @returns {SkyTargetedAssessment}
 */
export function assessTargeted(payload, gpu) {
	assert.equal(gpu.width, 104);
	assert.equal(gpu.height, 80);
	assert.equal(gpu.values.length, gpu.width * gpu.height * 4);
	/** @type {SkyTargetedScalar[]} */ const rows = [];
	/** @type {SkyTargetedParity[]} */ const parity = [];
	for (const ref of payload.references) {
		assert.ok(ref.physicalW !== null && ref.physicalAllowanceW !== null);
		const y8 = payload.rowLayout.findIndex((r) => r.probeId === ref.probeId && r.subdivisions === 8);
		const y16 = payload.rowLayout.findIndex((r) => r.probeId === ref.probeId && r.subdivisions === 16);
		assert.ok(y8 >= 0 && y16 >= 0);
		const channelIndex = payload.channels.indexOf(ref.channel);
		for (const source of [0, 1])
			for (let mode = 0; mode < 13; mode++) {
				const x = channelIndex * 26 + source * 13 + mode;
				const first8W = gpu.values[(y8 * gpu.width + x) * 4],
					first16W = gpu.values[(y16 * gpu.width + x) * 4];
				assert.ok(first8W >= 0 && first16W >= 0 && Number.isFinite(first8W) && Number.isFinite(first16W));
				assert.equal(gpu.values[(y16 * gpu.width + x) * 4 + 1], payload.rowLayout[y16].sampleCount);
				const higherW = ref.raw.fourthOrderW - ref.raw.firstOrderW,
					measuredW = ref.measuredW;
				const numericalW = first16W - ref.physicalW,
					remainingW = higherW + ref.physicalW - measuredW;
				const guardW =
					2 * Math.abs(first16W - first8W) +
					ref.physicalAllowanceW +
					Math.max(1e-8, 32 * 2 ** -23 * Math.abs(first16W));
				rows.push({
					probeId: ref.probeId,
					time: ref.time,
					channel: ref.channel,
					mode,
					sourceCount: source ? 160 : 80,
					first8W,
					first16W,
					physicalW: ref.physicalW,
					higherW,
					measuredW,
					guardW,
					numericalW,
					remainingW,
					residualW: numericalW + remainingW,
					residual8W: first8W + higherW - measuredW,
				});
				if (source === 0 && mode === 12)
					parity.push({
						probeId: ref.probeId,
						channel: ref.channel,
						differenceW: first16W - ref.raw.firstOrderW,
						guardW: guardW + ref.raw.firstOrderAllowanceW,
						withinGuard: Math.abs(first16W - ref.raw.firstOrderW) <= guardW + ref.raw.firstOrderAllowanceW,
					});
			}
	}
	const selectors = ['all', ...new Set(rows.map((r) => r.time))];
	/** @type {SkyTargetedGroup[]} */ const groups = [];
	for (const group of selectors)
		for (const sourceCount of [80, 160])
			for (let mode = 0; mode < 13; mode++) {
				const selected = rows.filter(
					(r) => (group === 'all' || r.time === group) && r.sourceCount === sourceCount && r.mode === mode,
				);
				const numericalSse = selected.reduce((s, r) => s + r.numericalW ** 2, 0),
					remainingSse = selected.reduce((s, r) => s + r.remainingW ** 2, 0),
					crossTerm = selected.reduce((s, r) => s + 2 * r.numericalW * r.remainingW, 0),
					sse = selected.reduce((s, r) => s + r.residualW ** 2, 0);
				assert.ok(Math.abs(sse - numericalSse - remainingSse - crossTerm) <= 1e-12 * Math.max(1, sse));
				groups.push({
					group,
					sourceCount,
					mode,
					count: selected.length,
					rmse: 1000 * Math.sqrt(sse / selected.length),
					numericalRms: 1000 * Math.sqrt(numericalSse / selected.length),
					numericalSse,
					remainingSse,
					crossTerm,
					guardNorm: Math.hypot(...selected.map((r) => r.guardW)),
				});
			}
	/** @type {SkyTargetedFactorial[]} */ const factorials = [];
	for (const sourceCount of [80, 160]) {
		const vectors = payload.references.map((ref) => {
			const selected = rows.filter(
				(r) => r.sourceCount === sourceCount && r.probeId === ref.probeId && r.channel === ref.channel,
			);
			return {
				probeId: ref.probeId,
				time: ref.time,
				channel: ref.channel,
				terms: factorialTerms(
					Array.from({length: 8}, (_, mode) => selected.find((r) => r.mode === mode).first16W),
				),
			};
		});
		const terms = Array.from({length: 8}, (_, term) => ({
			term,
			signedMeanW: vectors.reduce((s, v) => s + v.terms[term], 0) / vectors.length,
			rmsW: Math.hypot(...vectors.map((v) => v.terms[term])) / Math.sqrt(vectors.length),
		}));
		const dotProducts = Array.from({length: 8}, (_, a) =>
			Array.from({length: 8}, (_, b) => vectors.reduce((s, v) => s + v.terms[a] * v.terms[b], 0)),
		);
		factorials.push({sourceCount, vectors, terms, dotProducts});
	}
	const comparisons = groups.map((candidate) => {
		const baseline = groups.find((g) => g.group === candidate.group && g.sourceCount === 80 && g.mode === 12);
		const currentRows = rows.filter(
			(r) =>
				r.sourceCount === candidate.sourceCount &&
				r.mode === candidate.mode &&
				(candidate.group === 'all' || r.time === candidate.group),
		);
		const previousRows = rows.filter(
			(r) => r.sourceCount === 80 && r.mode === 12 && (candidate.group === 'all' || r.time === candidate.group),
		);
		const old8 = Math.hypot(...previousRows.map((r) => r.residual8W)),
			new8 = Math.hypot(...currentRows.map((r) => r.residual8W));
		const gain = baseline.rmse - candidate.rmse,
			numericalGain = baseline.numericalRms - candidate.numericalRms;
		const numericalGuardRms = (1000 * (baseline.guardNorm + candidate.guardNorm)) / Math.sqrt(candidate.count);
		return {
			group: candidate.group,
			sourceCount: candidate.sourceCount,
			mode: candidate.mode,
			proxyGainMw: gain,
			numericalGainMw: numericalGain,
			numericalGuardRmsMw: numericalGuardRms,
			viewDirectionAgrees: Math.sign(old8 - new8) === Math.sign(gain),
			usefulProxyGain: gain >= 0.01,
			numericalReductionResolved: numericalGain > numericalGuardRms,
			deltaNumericalSse: candidate.numericalSse - baseline.numericalSse,
			deltaCrossTerm: candidate.crossTerm - baseline.crossTerm,
		};
	});
	return {rows, groups, parity, factorials, comparisons};
}
