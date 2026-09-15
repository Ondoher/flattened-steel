import assert from 'node:assert/strict';
import {sampleDensity} from '../../numerics/view.js';
import {
	reconstructionValue,
	reconstructionSolar,
	reconstructionSum,
	reconstructionDifference,
	reconstructSourceField,
	reconstructSourceDensity,
	sourceReconstructionImprovement,
	groupSourceReconstruction,
} from './index.mjs';

/** Manufactured numerical properties only; no atmospheric sample or new predicted
 * response is read by this proof. @returns {{checks:number,scope:string}}
 */
export function sourceReconstructionProof() {
	let checks = 0;
	/** @param {boolean} condition @returns {void} */ function check(condition) {
		assert.ok(condition, 'Manufactured check ' + (checks + 1));
		checks++;
	}
	const v = reconstructionValue;
	const patterns = [
		[1, 2, 4, 8],
		[8, 4, 2, 1],
		[1, 4, 2, 7],
		[4, 2, 4, 2],
		[2, 2, 2, 2],
		[0, 0, 0, 0],
		[1e-8, 2e-8, 1e-8, 0],
	];
	for (const values of patterns)
		for (const t of [0, 0.1, 0.3, 0.5, 0.8, 1])
			for (const first of [false, true])
				for (const last of [false, true]) {
					const u = values.map((x) => 1e-5 * Math.max(Math.abs(x), 1e-8));
					const centre = reconstructionSolar(
						values.map((x, i) => v(x, u[i] + 4 * Number.EPSILON * Math.abs(x))),
						t,
						first,
						last,
					);
					for (let mask = 0; mask < 16; mask++) {
						const perturbed = values.map((x, i) => v(x + ((mask >> i) & 1 ? 1 : -1) * u[i]));
						const changed = reconstructionSolar(perturbed, t, first, last);
						check(Math.abs(changed.value - centre.value) <= centre.allowance + changed.allowance);
					}
				}
	/** @type {SkyViewSample} */ const sample = {
		point: [0, 0, 1],
		step: 1,
		altitude: 0.3,
		altitudeWeights: [0.7, 0.3],
		directionWeights: [0.25, 0.75],
		solarFraction: 0.3,
		firstSolarInterval: false,
		lastSolarInterval: false,
		indices: Array.from({length: 16}, (_, i) => i),
	};
	const field = Float32Array.from({length: 16}, (_, i) => 0.2 + Math.sin(i) ** 2);
	const withAllowance = Array.from(field, (x) => v(x));
	check(reconstructSourceField(withAllowance, sample).value === sampleDensity(field, sample, 'monotone-cubic'));
	const constant = Array.from({length: 16}, () => v(7, 1e-8));
	const equal = reconstructSourceField(constant, sample);
	check(Math.abs(equal.value - 7) <= equal.allowance);
	const zero = Array.from({length: 16}, () => v(0));
	const fields = {raw: zero, rayleighDensity: zero, mieDensity: zero, rayleighLighting: zero, mieLighting: zero};
	for (const mode of /** @type {SkySourceReconstructionMode[]} */ (['raw', 'split', 'factored']))
		check(reconstructSourceDensity(fields, sample, mode, [1, 2, 3]).value === 0);
	const raw = Array.from({length: 16}, () => v(Math.fround(0.1 + 0.2)));
	const splitR = Array.from({length: 16}, () => v(Math.fround(0.1)));
	const splitM = Array.from({length: 16}, () => v(Math.fround(0.2)));
	const splitFields = {...fields, raw, rayleighDensity: splitR, mieDensity: splitM};
	check(
		reconstructSourceDensity(splitFields, sample, 'raw', [0, 0, 0]).value !==
			reconstructSourceDensity(splitFields, sample, 'split', [0, 0, 0]).value,
	);

	// Constant illumination gives an independent analytic density limit. At a
	// fixed query, the raw midpoint error is beta*(cosh(width/(2*H))-1).
	const queryHeight = 1000,
		br = Math.exp(-queryHeight / 8000),
		bm = 0.3 * Math.exp(-queryHeight / 1200);
	const analytic = 2 * br + 3 * bm,
		errors = [];
	const midpoint = {...sample, altitude: queryHeight, altitudeWeights: [0.5, 0.5]};
	for (const width of [1000, 500, 250]) {
		const heights = [queryHeight - width / 2, queryHeight + width / 2];
		const r = heights.map((height) => 2 * Math.exp(-height / 8000));
		const m = heights.map((height) => 0.9 * Math.exp(-height / 1200));
		const prepared = {
			raw: Array.from({length: 16}, (_, i) => v(r[Math.floor(i / 8)] + m[Math.floor(i / 8)])),
			rayleighDensity: Array.from({length: 16}, (_, i) => v(r[Math.floor(i / 8)])),
			mieDensity: Array.from({length: 16}, (_, i) => v(m[Math.floor(i / 8)])),
			rayleighLighting: Array.from({length: 16}, () => v(2)),
			mieLighting: Array.from({length: 16}, () => v(3)),
		};
		const rawValue = reconstructSourceDensity(prepared, midpoint, 'raw', [0, br, bm]).value;
		const factoredValue = reconstructSourceDensity(prepared, midpoint, 'factored', [0, br, bm]).value;
		const expected = 2 * br * (Math.cosh(width / 16000) - 1) + 3 * bm * (Math.cosh(width / 2400) - 1);
		check(rawValue > analytic);
		check(Math.abs(rawValue - analytic - expected) <= 256 * Number.EPSILON * analytic);
		check(Math.abs(factoredValue - analytic) <= 256 * Number.EPSILON * analytic);
		errors.push(rawValue - analytic);
	}
	check(errors[1] / errors[0] > 0.24 && errors[1] / errors[0] < 0.26);
	check(errors[2] / errors[1] > 0.24 && errors[2] / errors[1] < 0.26);

	const a = v(5, 0.1),
		b = v(3, 0.2),
		c = v(1, 0.3);
	const total = reconstructionDifference(a, c);
	const sum = reconstructionSum([reconstructionDifference(a, b), reconstructionDifference(b, c)], [1, 1]);
	check(total.value === sum.value);
	check(sum.allowance >= total.allowance);
	check(sourceReconstructionImprovement(v(0.1, 0.01), v(1, 0.01)) === 'passed');
	check(sourceReconstructionImprovement(v(1, 0.01), v(1, 0.01)) === 'failed');
	check(sourceReconstructionImprovement(v(0), v(0, 0.01)) === 'unresolved');
	/** @type {SkySourceReconstructionRow} */ const row = {
		probeId: 'manufactured',
		channel: 0,
		sampleIndex: 0,
		altitudeMeters: 0,
		weightMeters: 1,
		direct: {s80: v(0), s160: v(0), reference: v(0)},
		reconstructed: {},
		terms: {
			source: v(-1),
			reconstruction: v(3),
			total80: v(2),
			total160: v(2.5),
			response: v(0.5),
			split: v(3),
			factored: v(0.1),
		},
		identityResidual: 0,
	};
	check(Object.values(groupSourceReconstruction([row])[0].checks).every((state) => state === 'passed'));
	const failed = {...row, terms: {...row.terms, source: v(1), factored: v(3), response: v(0)}};
	const failure = groupSourceReconstruction([failed])[0];
	check(failure.checks.negativeSource === 'failed');
	check(failure.checks.factoredImprovement === 'failed');
	check(failure.checks.positiveRefinement === 'unresolved');
	return {
		checks,
		scope: 'Manufactured interpolation bounds, exponential-density limit, equal and zero inputs, exact arithmetic identity, storage regrouping, and retained failed/unresolved predicates.',
	};
}
