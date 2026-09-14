import {gaussLegendreRule, referenceLimit} from './quadrature.mjs';

const RULE8 = gaussLegendreRule(8),
	RULE16 = gaussLegendreRule(16);

/** Integrate a finite vector using complete-partition global error allocation.
 * Every retained leaf owns its fine estimate and absolute fine/coarse difference.
 * Acceptance requires each sum of leaf errors to meet the unchanged whole-domain
 * absolute+relative tolerance. No extrapolation or rigorous-bound claim is made.
 * @param {(coordinate: number) => readonly number[]} evaluate - Finite vector integrand.
 * @param {number} start - Finite lower coordinate.
 * @param {number} end - Finite upper coordinate.
 * @param {readonly number[]} absoluteTolerances - Positive finite per-component allowances.
 * @param {number} relativeTolerance - Positive finite relative tolerance.
 * @param {SkyPhysicalReferenceMethod} method - Independent Gauss or Simpson family.
 * @param {number} maximumEvaluations - Nonnegative safe integer invocation cap.
 * @returns {SkyPhysicalQuadratureResult} Last complete partition and explicit convergence state.
 */
export function integrateVectorGlobally(
	evaluate,
	start,
	end,
	absoluteTolerances,
	relativeTolerance,
	method,
	maximumEvaluations,
) {
	if (typeof evaluate !== 'function') throw new TypeError('Global quadrature requires a vector integrand.');
	if (
		!Number.isFinite(start) ||
		!Number.isFinite(end) ||
		!(end >= start) ||
		!Number.isFinite(start + end) ||
		!Number.isFinite(end - start) ||
		!['gauss', 'simpson'].includes(method)
	)
		throw new RangeError('Invalid global physical quadrature interval or method.');
	const dimension = absoluteTolerances.length;
	if (
		!dimension ||
		absoluteTolerances.some((value) => !(value > 0) || !Number.isFinite(value)) ||
		!(relativeTolerance > 0) ||
		!Number.isFinite(relativeTolerance)
	)
		throw new RangeError('Global physical quadrature tolerances must be finite and positive.');
	if (!Number.isSafeInteger(maximumEvaluations) || maximumEvaluations < 0)
		throw new RangeError('Global physical quadrature evaluation cap must be a nonnegative safe integer.');
	let evaluations = 0;
	const zeros = () => Array(dimension).fill(0);
	/** @param {number} coordinate @returns {number[]} */
	function sample(coordinate) {
		if (evaluations >= maximumEvaluations) throw referenceLimit('Quadrature evaluation cap reached.');
		evaluations++;
		const value = evaluate(coordinate);
		if (!value || value.length !== dimension || value.some((item) => !Number.isFinite(item)))
			throw new Error('Physical reference integrand returned a nonfinite or incompatible vector.');
		return Array.from(value);
	}
	/** @param {number} a @param {number} b @param {readonly SkyQuadratureNode[]} rule @returns {number[]} */
	function gaussian(a, b, rule) {
		const center = (a + b) / 2,
			half = (b - a) / 2,
			values = zeros();
		for (const {node, weight} of rule) {
			const value = sample(center + half * node);
			for (let index = 0; index < dimension; index++) values[index] += value[index] * weight * half;
		}
		return values;
	}
	/** @param {number} a @param {number} b @param {readonly number[]} left @param {readonly number[]} middle @param {readonly number[]} right @returns {number[]} */
	function simpsonEstimate(a, b, left, middle, right) {
		return left.map((value, index) => ((b - a) * (value + 4 * middle[index] + right[index])) / 6);
	}
	/** @param {number} a @param {number} b @param {number} depth @param {readonly number[]} fine @param {readonly number[]} coarse @param {SkyPhysicalGlobalSimpsonSamples|null} simpson @returns {SkyPhysicalGlobalLeaf} */
	function leaf(a, b, depth, fine, coarse, simpson) {
		const errors = fine.map((value, index) => Math.abs(value - coarse[index]));
		if ([...fine, ...coarse, ...errors].some((value) => !Number.isFinite(value)))
			throw new Error('Global physical quadrature produced a nonfinite interval estimate.');
		return {start: a, end: b, depth, values: fine, errors, simpson};
	}
	/** @param {number} a @param {number} b @param {number} depth @returns {SkyPhysicalGlobalLeaf} */
	function gaussLeaf(a, b, depth) {
		const fine = gaussian(a, b, RULE16),
			coarse = gaussian(a, b, RULE8);
		return leaf(a, b, depth, fine, coarse, null);
	}
	/** @param {number} a @param {number} b @param {number} depth @param {readonly number[]} left @param {readonly number[]} middle @param {readonly number[]} right @param {readonly number[]} coarse @returns {SkyPhysicalGlobalLeaf} */
	function simpsonLeaf(a, b, depth, left, middle, right, coarse) {
		const center = (a + b) / 2;
		const leftMiddle = sample((a + center) / 2),
			rightMiddle = sample((center + b) / 2);
		const leftCoarse = simpsonEstimate(a, center, left, leftMiddle, middle),
			rightCoarse = simpsonEstimate(center, b, middle, rightMiddle, right);
		const fine = leftCoarse.map((value, index) => value + rightCoarse[index]);
		return leaf(a, b, depth, fine, coarse, {left, middle, right, leftMiddle, rightMiddle, leftCoarse, rightCoarse});
	}
	/** @type {SkyPhysicalGlobalLeaf[]} */ const leaves = [];
	/** Sum the last complete partition in physical interval order.
	 * @returns {SkyPhysicalIntervalEstimate} Whole-domain estimates and absolute error sums.
	 */
	function totals() {
		const values = zeros(),
			errors = zeros();
		for (const item of leaves)
			for (let index = 0; index < dimension; index++) {
				values[index] += item.values[index];
				errors[index] += item.errors[index];
			}
		if ([...values, ...errors].some((value) => !Number.isFinite(value)))
			throw new Error('Global physical quadrature produced a nonfinite partition sum.');
		return {values, errors};
	}
	if (start === end) return {values: zeros(), errors: zeros(), evaluations: 0, converged: true, reason: null};
	try {
		if (method === 'gauss') leaves.push(gaussLeaf(start, end, 0));
		else {
			const left = sample(start),
				middle = sample((start + end) / 2),
				right = sample(end);
			leaves.push(
				simpsonLeaf(start, end, 0, left, middle, right, simpsonEstimate(start, end, left, middle, right)),
			);
		}
		for (;;) {
			const result = totals();
			const tolerances = result.values.map(
				(value, index) => absoluteTolerances[index] + relativeTolerance * Math.abs(value),
			);
			if (tolerances.some((value) => !Number.isFinite(value)))
				throw new RangeError('Global physical quadrature tolerance overflowed.');
			const failing = result.errors
				.map((error, index) => index)
				.filter((index) => result.errors[index] > tolerances[index]);
			if (!failing.length) return {...result, evaluations, converged: true, reason: null};
			let selected = 0,
				maximumContribution = -1;
			for (let index = 0; index < leaves.length; index++) {
				const contribution = Math.max(
					...failing.map((component) => leaves[index].errors[component] / tolerances[component]),
				);
				if (contribution > maximumContribution) {
					maximumContribution = contribution;
					selected = index;
				}
			}
			const previous = leaves[selected],
				center = (previous.start + previous.end) / 2;
			if (previous.depth >= 24)
				return {...result, evaluations, converged: false, reason: 'Quadrature depth cap reached.'};
			if (center === previous.start || center === previous.end)
				return {...result, evaluations, converged: false, reason: 'Quadrature interval subdivision stalled.'};
			let left, right;
			if (method === 'gauss') {
				left = gaussLeaf(previous.start, center, previous.depth + 1);
				right = gaussLeaf(center, previous.end, previous.depth + 1);
			} else {
				const saved = previous.simpson;
				left = simpsonLeaf(
					previous.start,
					center,
					previous.depth + 1,
					saved.left,
					saved.leftMiddle,
					saved.middle,
					saved.leftCoarse,
				);
				right = simpsonLeaf(
					center,
					previous.end,
					previous.depth + 1,
					saved.middle,
					saved.rightMiddle,
					saved.right,
					saved.rightCoarse,
				);
			}
			// Commit only after BOTH children have complete fine/coarse estimates.
			// A tagged cap in either child leaves the entire previous partition intact.
			leaves.splice(selected, 1, left, right);
		}
	} catch (error) {
		if (!(error instanceof RangeError && error.cause === 'sky-physical-reference-limit')) throw error;
		return {
			...(leaves.length ? totals() : {values: null, errors: null}),
			evaluations,
			converged: false,
			reason: error.message,
		};
	}
}
