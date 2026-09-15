import assert from 'node:assert/strict';

/** Validate a complete scalar estimate without inferring reference quality.
 * @param {SkySecondOrderOuterValue} value - Complete value and inner allowance.
 * @returns {void} Rejects negative, nonfinite or absent values.
 */
function valid(value) {
	assert.ok(value && [value.value, value.innerAllowance].every((number) => Number.isFinite(number) && number >= 0));
}

/** Evaluate the exact outer predictions frozen before the first Simpson target.
 * @param {SkySecondOrderOuterComparison} input - Completed or explicitly missing configurations.
 * @returns {SkySecondOrderOuterCheck[]} Predictions 2/3/4; these do not close angular/reference admission.
 */
export function assessSecondOrderOuter(input) {
	const {gauss4: g4, simpson4: s4, gauss8: g8, simpson8: s8} = input;
	for (const value of [g4, s4, g8, s8]) if (value) valid(value);
	valid(g4);
	/** @type {SkySecondOrderOuterCheck[]} */ const checks = [];
	/** Preserve a missing target as unresolved, otherwise compare the frozen inequality.
	 * @param {string} id - Original predicate identity.
	 * @param {number|null} differenceWatts - Observed absolute difference.
	 * @param {number|null} thresholdWatts - Frozen allowance and response equation.
	 * @returns {void} Appends one explicit outcome.
	 */
	function append(id, differenceWatts, thresholdWatts) {
		checks.push({
			id,
			differenceWatts,
			thresholdWatts,
			state:
				differenceWatts === null || thresholdWatts === null
					? 'unresolved'
					: differenceWatts <= thresholdWatts
						? 'passed'
						: 'failed',
		});
	}
	append(
		'outer-simpson4-within-one-percent',
		s4 ? Math.abs(s4.value - g4.value) : null,
		s4 ? 0.01 * Math.abs(g4.value) + s4.innerAllowance + g4.innerAllowance : null,
	);
	append(
		'outer-gauss8-smaller-correction',
		s4 && g8 ? Math.abs(g8.value - g4.value) : null,
		s4 && g8
			? 0.5 * Math.abs(s4.value - g4.value) + g8.innerAllowance + g4.innerAllowance + s4.innerAllowance + 1e-7
			: null,
	);
	append(
		'outer-refined-independent-agreement',
		s4 && g8 && s8 ? Math.abs(s8.value - g8.value) : null,
		s4 && g8 && s8
			? 0.25 * Math.abs(s4.value - g4.value) +
					s8.innerAllowance +
					g8.innerAllowance +
					s4.innerAllowance +
					g4.innerAllowance +
					1e-7
			: null,
	);
	return checks;
}

/** Test the registered 80% numerical-error reduction after physical reference admission.
 * The caller must independently establish reference adequacy; this pure inequality
 * cannot infer it from a small value or a favorable measurement score.
 * @param {SkySecondOrderAccuracyValue} candidate - Captured effective J2 and fixed-field allowance.
 * @param {SkySecondOrderAccuracyValue} control - Matched original control and allowance.
 * @param {SkySecondOrderAccuracyValue} reference - Admitted physical P2 and its complete reference allowance.
 * @returns {SkySecondOrderDialAccuracy} Uncertainty-aware numerical comparison.
 */
export function assessSecondOrderDial(candidate, control, reference) {
	for (const value of [candidate, control, reference]) valid({value: value.value, innerAllowance: value.allowance});
	const candidateErrorWatts = candidate.value - reference.value,
		controlErrorWatts = control.value - reference.value;
	const candidateErrorUpperWatts = Math.abs(candidateErrorWatts) + candidate.allowance + reference.allowance;
	const controlErrorLowerWatts = Math.abs(controlErrorWatts) - control.allowance - reference.allowance;
	const thresholdWatts = 0.2 * controlErrorLowerWatts;
	return {
		candidateErrorWatts,
		controlErrorWatts,
		candidateErrorUpperWatts,
		controlErrorLowerWatts,
		thresholdWatts,
		state:
			controlErrorLowerWatts <= 0
				? 'unresolved'
				: candidateErrorUpperWatts <= thresholdWatts
					? 'passed'
					: 'failed',
	};
}

/** Verify the prospective equations against independent positive/negative/missing cases.
 * @returns {SkySecondOrderAnalysisProof} Focused local verification, not a scientific execution.
 */
export function secondOrderRefinementProof() {
	/** @param {number} value - Synthetic radiance. @param {number} [innerAllowance] - Synthetic uncertainty. @returns {SkySecondOrderOuterValue} Manufactured scalar. */
	const scalar = (value, innerAllowance = 0) => ({value, innerAllowance});
	/** @param {number} value - Synthetic radiance. @param {number} [allowance] - Complete synthetic uncertainty. @returns {SkySecondOrderAccuracyValue} Manufactured accuracy input. */
	const accuracy = (value, allowance = 0) => ({value, allowance});
	let checks = 0;
	const passed = assessSecondOrderOuter({
		gauss4: scalar(1),
		simpson4: scalar(1.008),
		gauss8: scalar(1.001),
		simpson8: scalar(1.0015),
	});
	assert.ok(passed.every((row) => row.state === 'passed'));
	checks++;
	assert.equal(assessSecondOrderOuter({gauss4: scalar(1), simpson4: scalar(1.03)})[0].state, 'failed');
	checks++;
	assert.equal(
		assessSecondOrderOuter({gauss4: scalar(1), simpson4: scalar(1.008), gauss8: scalar(1.009)})[1].state,
		'failed',
	);
	checks++;
	assert.equal(
		assessSecondOrderOuter({
			gauss4: scalar(1),
			simpson4: scalar(1.008),
			gauss8: scalar(1.001),
			simpson8: scalar(1.006),
		})[2].state,
		'failed',
	);
	checks++;
	assert.ok(
		assessSecondOrderOuter({gauss4: scalar(1)}).every(
			(row) => row.state === 'unresolved' && row.differenceWatts === null,
		),
	);
	checks++;
	assert.equal(assessSecondOrderDial(accuracy(1.1), accuracy(2), accuracy(1)).state, 'passed');
	checks++;
	assert.equal(assessSecondOrderDial(accuracy(0.7), accuracy(2), accuracy(1)).state, 'failed');
	checks++;
	assert.equal(assessSecondOrderDial(accuracy(1), accuracy(1.01, 0.02), accuracy(1)).state, 'unresolved');
	checks++;
	assert.equal(assessSecondOrderDial(accuracy(1.1), accuracy(2), accuracy(1, 0.1)).state, 'failed');
	checks++;
	assert.throws(() => assessSecondOrderOuter({gauss4: scalar(NaN)}));
	checks++;
	assert.throws(() => assessSecondOrderDial(accuracy(1), accuracy(2), accuracy(1, -1)));
	checks++;
	return {schemaId: 'sky-second-order-refinement-proof-v1', checks};
}
