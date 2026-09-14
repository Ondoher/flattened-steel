import assert from 'node:assert/strict';
import {integrateVectorGlobally} from './global-quadrature.mjs';
import {integrateVector, referenceLimit} from './quadrature.mjs';

/** Exercise global vector-error admission on exact manufactured integrals and bounded failures.
 * Creates no files or evidence runs and evaluates no production physical input.
 * @returns {SkyPhysicalGlobalProof} Actual deviations, local/global contrast and explicit limitations.
 */
export function globalQuadratureProof() {
	let checks = 0,
		maximumPolynomialError = 0,
		maximumPeakError = 0;
	/** @param {boolean} condition - Required manufactured identity.
	 * @param {string} message - Scientific or boundary behavior checked.
	 */
	const check = (condition, message) => {
		assert.ok(condition, message);
		checks++;
	};
	/** @param {() => unknown} operation - Deliberately malformed external call.
	 * @param {string} message - Boundary expected to reject the call.
	 */
	const rejects = (operation, message) => {
		assert.throws(operation, undefined, message);
		checks++;
	};
	/** @type {readonly SkyPhysicalReferenceMethod[]} */
	const methods = ['gauss', 'simpson'];
	/** @type {Array<SkyPhysicalGlobalProof['tinyAuxiliary'][number]>} */
	const tinyAuxiliary = [];
	for (const method of methods) {
		const polynomialDegrees = [0, 1, 2, 3, 4, 7];
		const polynomial = integrateVectorGlobally(
			(coordinate) => polynomialDegrees.map((degree) => coordinate ** degree),
			0,
			1,
			polynomialDegrees.map(() => 1e-11),
			1e-11,
			method,
			16384,
		);
		check(
			polynomial.converged && polynomial.reason === null,
			`${method} resolves the manufactured polynomial vector.`,
		);
		check(
			polynomial.values.length === polynomialDegrees.length &&
				polynomial.errors.length === polynomialDegrees.length,
			`${method} preserves vector component order and dimension.`,
		);
		for (const [index, degree] of polynomialDegrees.entries()) {
			const error = Math.abs(polynomial.values[index] - 1 / (degree + 1));
			maximumPolynomialError = Math.max(maximumPolynomialError, error);
			check(error <= 2e-10, `${method} degree ${degree} satisfies the declared exact-integral check.`);
			check(
				polynomial.errors[index] <= 1e-11 + 1e-11 * Math.abs(polynomial.values[index]),
				`${method} polynomial component ${index} satisfies its complete-domain error budget.`,
			);
		}

		// One third is off every depth-24 dyadic boundary. The auxiliary height is tiny
		// relative to exp(x), but its discontinuity can violate a fraction-scaled leaf budget.
		const transition = 1 / 3,
			auxiliaryHeight = 1e-8,
			absoluteTolerances = [1e-10, 1e-13],
			relativeTolerance = 1e-10;
		/** @param {number} coordinate - Unit-interval integration position.
		 * @returns {readonly number[]} Smooth radiance and manufactured tiny allowance component.
		 */
		const smoothWithTinyAuxiliary = (coordinate) => [
			Math.exp(coordinate),
			coordinate < transition ? 0 : auxiliaryHeight,
		];
		const local = integrateVector(
			smoothWithTinyAuxiliary,
			0,
			1,
			absoluteTolerances,
			relativeTolerance,
			method,
			4096,
		);
		const global = integrateVectorGlobally(
			smoothWithTinyAuxiliary,
			0,
			1,
			absoluteTolerances,
			relativeTolerance,
			method,
			4096,
		);
		tinyAuxiliary.push({method, local, global});
		check(
			!local.converged && typeof local.reason === 'string' && /depth/iu.test(local.reason),
			`${method} legacy leaf admission reaches the depth cap on the tiny off-grid auxiliary.`,
		);
		check(
			local.errors !== null && local.errors[1] < absoluteTolerances[1] / 100,
			`${method} legacy auxiliary remainder is already far below its full-domain absolute allowance.`,
		);
		check(global.converged && global.reason === null, `${method} admits the same fixture by summed global error.`);
		for (let component = 0; component < absoluteTolerances.length; component++)
			check(
				global.errors[component] <=
					absoluteTolerances[component] + relativeTolerance * Math.abs(global.values[component]),
				`${method} global auxiliary fixture component ${component} stays within its declared total allowance.`,
			);
		check(
			Math.abs(global.values[0] - Math.expm1(1)) <= 2e-9 &&
				Math.abs(global.values[1] - auxiliaryHeight * (1 - transition)) <= 5e-13,
			`${method} global auxiliary fixture matches both analytic integrals within explicit empirical limits.`,
		);
		check(
			global.evaluations <= 4096 && local.evaluations <= 4096,
			`${method} local/global comparison preserves the same overall work ceiling.`,
		);

		const step = integrateVectorGlobally(
			(coordinate) => [coordinate < transition ? 0 : 1],
			0,
			1,
			[1e-8],
			1e-10,
			method,
			4096,
		);
		check(
			method === 'gauss'
				? step.converged
				: !step.converged && typeof step.reason === 'string' && /depth/iu.test(step.reason),
			`${method} material-step admission preserves its actual depth-24 limitation.`,
		);
		check(
			Math.abs(step.values[0] - (1 - transition)) <= 5e-8,
			`${method} material-step integral meets the stated empirical oracle limit.`,
		);
		for (const width of [0.02, 0.005]) {
			const center = 1 / 3;
			const peak = integrateVectorGlobally(
				(coordinate) => [width / ((coordinate - center) ** 2 + width * width)],
				0,
				1,
				[1e-8],
				1e-9,
				method,
				32768,
			);
			const exact = Math.atan((1 - center) / width) - Math.atan(-center / width);
			check(peak.converged, `${method} resolves the declared Lorentzian width ${width}.`);
			const error = Math.abs(peak.values[0] - exact);
			maximumPeakError = Math.max(maximumPeakError, error);
			check(error <= 2e-7, `${method} width ${width} matches its analytic atan integral.`);
			check(peak.evaluations <= 32768, `${method} width ${width} respects the evaluation cap.`);
		}

		let zeroCalls = 0;
		const zero = integrateVectorGlobally(
			() => {
				zeroCalls++;
				throw new Error('Zero extent must not evaluate the integrand.');
			},
			2,
			2,
			[1e-8, 1e-9],
			1e-6,
			method,
			0,
		);
		assert.deepEqual(zero, {values: [0, 0], errors: [0, 0], evaluations: 0, converged: true, reason: null});
		checks++;
		check(zeroCalls === 0, `${method} zero extent never evaluates even with a zero cap.`);

		const rootCost = method === 'gauss' ? 24 : 5,
			childCost = method === 'gauss' ? 24 : 2;
		/** @param {number} coordinate - Unit-interval integration position.
		 * @returns {readonly number[]} Deliberately unresolved material step.
		 */
		const unresolvedStep = (coordinate) => [coordinate < transition ? 0 : 1];
		for (const cap of [0, 1, rootCost - 1]) {
			let calls = 0;
			const result = integrateVectorGlobally(
				(coordinate) => {
					calls++;
					return unresolvedStep(coordinate);
				},
				0,
				1,
				[1e-30],
				1e-30,
				method,
				cap,
			);
			check(
				!result.converged &&
					result.values === null &&
					result.errors === null &&
					typeof result.reason === 'string',
				`${method} cap ${cap} cannot manufacture a complete paired estimate.`,
			);
			check(
				result.evaluations === calls && calls <= cap,
				`${method} cap ${cap} counts actual attempted evaluations without overshoot.`,
			);
		}
		for (const completedSplits of [0, 1]) {
			const partitionCost = rootCost + completedSplits * 2 * childCost;
			const complete = integrateVectorGlobally(unresolvedStep, 0, 1, [1e-30], 1e-30, method, partitionCost);
			const partial = integrateVectorGlobally(
				unresolvedStep,
				0,
				1,
				[1e-30],
				1e-30,
				method,
				partitionCost + childCost + 1,
			);
			check(
				!complete.converged && !partial.converged && complete.values !== null && partial.values !== null,
				`${method} exhausted refinement retains a complete whole-domain estimate.`,
			);
			assert.deepEqual(
				partial.values,
				complete.values,
				`${method} incomplete sibling cannot replace the complete partition.`,
			);
			assert.deepEqual(
				partial.errors,
				complete.errors,
				`${method} incomplete sibling cannot replace complete partition errors.`,
			);
			checks += 2;
			check(
				partial.evaluations <= partitionCost + childCost + 1 && typeof partial.reason === 'string',
				`${method} partial refinement remains explicitly capped.`,
			);
		}
		const depth = integrateVectorGlobally(unresolvedStep, 0, 1, [1e-30], 1e-30, method, 4096);
		check(
			!depth.converged &&
				depth.values !== null &&
				typeof depth.reason === 'string' &&
				/depth/iu.test(depth.reason),
			`${method} refuses to extrapolate an unresolved discontinuity beyond the depth cap.`,
		);
		check(
			depth.evaluations === rootCost + 24 * 2 * childCost,
			`${method} follows the one unresolved branch through exactly 24 binary subdivisions.`,
		);

		for (const signal of [
			new Error('manufactured cancellation'),
			new RangeError('untagged resource cancellation'),
		]) {
			for (const throwAt of [1, rootCost + childCost + 1]) {
				let calls = 0;
				assert.throws(
					() =>
						integrateVectorGlobally(
							(coordinate) => {
								if (++calls === throwAt) throw signal;
								return unresolvedStep(coordinate);
							},
							0,
							1,
							[1e-30],
							1e-30,
							method,
							4096,
						),
					(error) => error === signal,
					`${method} preserves cancellation identity at attempted evaluation ${throwAt}.`,
				);
				checks++;
			}
		}
		for (const throwAt of [1, rootCost + childCost + 1]) {
			let calls = 0;
			const signal = referenceLimit('Manufactured inner numerical cap.');
			const result = integrateVectorGlobally(
				(coordinate) => {
					if (++calls === throwAt) throw signal;
					return unresolvedStep(coordinate);
				},
				0,
				1,
				[1e-30],
				1e-30,
				method,
				4096,
			);
			check(
				!result.converged &&
					result.reason === signal.message &&
					result.evaluations === calls &&
					calls === throwAt,
				`${method} tagged inner cap returns explicit nonresolution and actual attempted work.`,
			);
			if (throwAt === 1) {
				check(
					result.values === null && result.errors === null,
					`${method} immediate tagged cap has no complete estimate.`,
				);
			} else {
				const complete = integrateVectorGlobally(unresolvedStep, 0, 1, [1e-30], 1e-30, method, rootCost);
				assert.deepEqual(result.values, complete.values);
				assert.deepEqual(result.errors, complete.errors);
				checks += 2;
			}
		}

		for (const value of [[], [1, 2], [NaN], [Infinity], [-Infinity], null])
			rejects(
				() => integrateVectorGlobally(() => value, 0, 1, [1e-8], 1e-6, method, 64),
				`${method} rejects nonfinite, missing and incompatible integrand vectors.`,
			);
		let changingCalls = 0;
		rejects(
			() => integrateVectorGlobally(() => (++changingCalls === 1 ? [1] : [1, 2]), 0, 1, [1e-8], 1e-6, method, 64),
			`${method} validates vector dimension at every sample.`,
		);
		rejects(
			() => integrateVectorGlobally(() => [Number.MAX_VALUE], 0, 4, [1e-8], 1e-6, method, 64),
			`${method} rejects overflowed interval estimates from otherwise finite samples.`,
		);
	}

	for (const [start, end] of [
		[1, 0],
		[NaN, 1],
		[0, Infinity],
		[-Infinity, 0],
	])
		rejects(
			() => integrateVectorGlobally(() => [1], start, end, [1e-8], 1e-6, 'gauss', 64),
			'Invalid or unbounded integration intervals are rejected.',
		);
	for (const [start, end] of [
		[null, 1],
		[false, 1],
		[0, true],
		[0, '1'],
	])
		rejects(
			() => Reflect.apply(integrateVectorGlobally, undefined, [() => [1], start, end, [1e-8], 1e-6, 'gauss', 64]),
			'Interval endpoints must be numbers rather than coercible external values.',
		);
	rejects(
		() => Reflect.apply(integrateVectorGlobally, undefined, [null, 0, 1, [1e-8], 1e-6, 'gauss', 64]),
		'An absent integrand cannot enter quadrature.',
	);
	for (const absoluteTolerances of [[], [0], [-1], [NaN], [Infinity], ['1'], null])
		rejects(
			() =>
				Reflect.apply(integrateVectorGlobally, undefined, [
					() => [1],
					0,
					1,
					absoluteTolerances,
					1e-6,
					'gauss',
					64,
				]),
			'Absolute tolerances must be a nonempty finite positive numeric vector.',
		);
	for (const relativeTolerance of [0, -1, NaN, Infinity, '1'])
		rejects(
			() =>
				Reflect.apply(integrateVectorGlobally, undefined, [
					() => [1],
					0,
					1,
					[1e-8],
					relativeTolerance,
					'gauss',
					64,
				]),
			'Relative tolerance must be a finite positive number.',
		);
	for (const maximumEvaluations of [-1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, '64'])
		rejects(
			() =>
				Reflect.apply(integrateVectorGlobally, undefined, [
					() => [1],
					0,
					1,
					[1e-8],
					1e-6,
					'gauss',
					maximumEvaluations,
				]),
			'Evaluation caps must be nonnegative safe integers.',
		);
	for (const method of ['unknown', null])
		rejects(
			() => Reflect.apply(integrateVectorGlobally, undefined, [() => [1], 0, 1, [1e-8], 1e-6, method, 64]),
			'Unknown quadrature methods are rejected.',
		);
	return {
		schemaId: 'sky-physical-global-quadrature-proof-v1',
		checks,
		maximumPolynomialError,
		maximumPeakError,
		tinyAuxiliary,
		limitations: [
			'Coarse/fine differences and the stated polynomial, step and Lorentzian oracle tolerances are empirical checks, not rigorous error bounds.',
			'The separate oracle limits are 2e-10 for polynomial components, 5e-8 for the material step, 2e-7 for Lorentzian peaks, 2e-9 for smooth radiance and 5e-13 for the tiny auxiliary. Estimated-error admission does not itself bound the oracle discrepancy.',
			'Simpson retains explicit depth-limited nonresolution on the material step at absolute tolerance 1e-8; checking its complete estimate against an oracle does not turn that result into convergence.',
			'The sampled Lorentzian centers and widths do not establish detection of arbitrary unseen narrow peaks or discontinuities.',
			'Global error admission changes allocation of an unchanged total tolerance; it does not justify Richardson extrapolation or any physical-reference convergence claim.',
		],
	};
}
