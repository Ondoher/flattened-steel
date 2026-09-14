/** Construct an identifiable built-in error for a predeclared numerical cap.
 * @param {string} message - Specific exhausted numerical allowance.
 * @returns {RangeError} Tagged built-in error, distinct from cancellation errors.
 */
export function referenceLimit(message) {
	return new RangeError(message, {cause: 'sky-physical-reference-limit'});
}

/** Distinguish numerical-cap errors from invalid input and cancellation errors.
 * @param {unknown} error - Caught operation failure.
 * @returns {boolean} Whether the failure denotes a numerical work cap.
 */
function isReferenceLimit(error) {
	return error instanceof RangeError && error.cause === 'sky-physical-reference-limit';
}

/** Generate a positive Gauss-Legendre rule independently of production quadrature.
 * @param {number} count - Eight or sixteen polynomial nodes.
 * @returns {readonly SkyQuadratureNode[]} Increasing nodes and positive weights.
 */
export function gaussLegendreRule(count) {
	if (count !== 8 && count !== 16) throw new RangeError('Physical reference requires Gauss 8 or 16.');
	const output = [];
	for (let index = 1; index <= count; index++) {
		let root = Math.cos((Math.PI * (index - 0.25)) / (count + 0.5)),
			derivative = 0;
		for (let iteration = 0; iteration < 32; iteration++) {
			let previous = 1,
				polynomial = root;
			for (let order = 2; order <= count; order++) {
				const next = ((2 * order - 1) * root * polynomial - (order - 1) * previous) / order;
				previous = polynomial;
				polynomial = next;
			}
			derivative = (count * (root * polynomial - previous)) / (root * root - 1);
			const delta = polynomial / derivative;
			root -= delta;
			if (Math.abs(delta) < 4 * Number.EPSILON) break;
			if (iteration === 31) throw new Error('Gauss node generation did not converge.');
		}
		output.push({node: root, weight: 2 / ((1 - root * root) * derivative * derivative)});
	}
	return output.sort((left, right) => left.node - right.node);
}

const RULE8 = gaussLegendreRule(8),
	RULE16 = gaussLegendreRule(16);

/** Integrate a finite vector with independent adaptive Gauss or Simpson trees.
 * Differences are retained without Richardson extrapolation or rigorous-bound claims.
 * @param {(coordinate: number) => readonly number[]} evaluate - Finite vector integrand.
 * @param {number} start - Lower coordinate.
 * @param {number} end - Upper coordinate.
 * @param {readonly number[]} absoluteTolerances - Per-component absolute allowances.
 * @param {number} relativeTolerance - Per-component relative tolerance.
 * @param {SkyPhysicalReferenceMethod} method - Quadrature family.
 * @param {number} maximumEvaluations - Invocation evaluation cap.
 * @returns {SkyPhysicalQuadratureResult} Best complete estimate and explicit convergence.
 */
export function integrateVector(
	evaluate,
	start,
	end,
	absoluteTolerances,
	relativeTolerance,
	method,
	maximumEvaluations,
) {
	if (!(end >= start) || !Number.isFinite(start + end) || !['gauss', 'simpson'].includes(method))
		throw new RangeError('Invalid physical quadrature interval or method.');
	const dimension = absoluteTolerances.length;
	if (!dimension || absoluteTolerances.some((value) => !(value > 0)) || !(relativeTolerance > 0))
		throw new RangeError('Physical quadrature tolerances must be positive.');
	let evaluations = 0,
		reason = null;
	const sample = (/** @type {number} */ coordinate) => {
		if (evaluations >= maximumEvaluations) throw referenceLimit('Quadrature evaluation cap reached.');
		evaluations++;
		const value = evaluate(coordinate);
		if (value.length !== dimension || value.some((item) => !Number.isFinite(item)))
			throw new Error('Physical reference integrand returned a nonfinite or incompatible vector.');
		return value;
	};
	const zeros = () => Array(dimension).fill(0);
	const add = (/** @type {readonly number[]} */ left, /** @type {readonly number[]} */ right) =>
		left.map((value, i) => value + right[i]);
	const differences = (/** @type {readonly number[]} */ left, /** @type {readonly number[]} */ right) =>
		left.map((value, i) => Math.abs(value - right[i]));
	const passed = (
		/** @type {readonly number[]} */ values,
		/** @type {readonly number[]} */ errors,
		/** @type {number} */ fraction,
	) =>
		errors.every((error, i) => error <= absoluteTolerances[i] * fraction + relativeTolerance * Math.abs(values[i]));
	const gaussian = (
		/** @type {number} */ a,
		/** @type {number} */ b,
		/** @type {readonly SkyQuadratureNode[]} */ rule,
	) => {
		const center = (a + b) / 2,
			half = (b - a) / 2,
			values = zeros();
		for (const {node, weight} of rule) {
			const value = sample(center + half * node);
			for (let index = 0; index < dimension; index++) values[index] += value[index] * weight * half;
		}
		return values;
	};
	/** @type {(a: number, b: number, depth: number) => SkyPhysicalIntervalEstimate} */
	const gauss = (a, b, depth) => {
		const fine = gaussian(a, b, RULE16),
			coarse = gaussian(a, b, RULE8),
			errors = differences(fine, coarse);
		if (passed(fine, errors, (b - a) / (end - start))) return {values: fine, errors};
		if (depth >= 24) {
			reason = 'Quadrature depth cap reached.';
			return {values: fine, errors};
		}
		try {
			const left = gauss(a, (a + b) / 2, depth + 1),
				right = gauss((a + b) / 2, b, depth + 1);
			return {values: add(left.values, right.values), errors: add(left.errors, right.errors)};
		} catch (error) {
			if (!isReferenceLimit(error)) throw error;
			reason = error.message;
			return {values: fine, errors};
		}
	};
	const simpsonEstimate = (
		/** @type {number} */ a,
		/** @type {number} */ b,
		/** @type {readonly number[]} */ fa,
		/** @type {readonly number[]} */ fm,
		/** @type {readonly number[]} */ fb,
	) => fa.map((value, index) => ((b - a) * (value + 4 * fm[index] + fb[index])) / 6);
	/** @type {(a: number, b: number, fa: readonly number[], fm: readonly number[], fb: readonly number[], coarse: number[], depth: number) => SkyPhysicalIntervalEstimate} */
	const simpson = (a, b, fa, fm, fb, coarse, depth) => {
		let fine, errors;
		try {
			const center = (a + b) / 2,
				fl = sample((a + center) / 2),
				fr = sample((center + b) / 2);
			const left = simpsonEstimate(a, center, fa, fl, fm),
				right = simpsonEstimate(center, b, fm, fr, fb);
			fine = add(left, right);
			errors = differences(fine, coarse);
			if (passed(fine, errors, (b - a) / (end - start))) return {values: fine, errors};
			if (depth >= 24) {
				reason = 'Quadrature depth cap reached.';
				return {values: fine, errors};
			}
			const l = simpson(a, center, fa, fl, fm, left, depth + 1),
				r = simpson(center, b, fm, fr, fb, right, depth + 1);
			return {values: add(l.values, r.values), errors: add(l.errors, r.errors)};
		} catch (error) {
			if (!isReferenceLimit(error)) throw error;
			reason = error.message;
			return {values: fine ?? coarse, errors: errors ?? coarse.map(Math.abs)};
		}
	};
	if (start === end) return {values: zeros(), errors: zeros(), evaluations: 0, converged: true, reason: null};
	try {
		let result;
		if (method === 'gauss') result = gauss(start, end, 0);
		else {
			const fa = sample(start),
				fm = sample((start + end) / 2),
				fb = sample(end);
			result = simpson(start, end, fa, fm, fb, simpsonEstimate(start, end, fa, fm, fb), 0);
		}
		return {...result, evaluations, converged: reason === null, reason};
	} catch (error) {
		if (!isReferenceLimit(error)) throw error;
		return {values: null, errors: null, evaluations, converged: false, reason: error.message};
	}
}
