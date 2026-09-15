import assert from 'node:assert/strict';

/** Compare absolute numerical errors using the SAME uncertain physical reference.
 * The difference of two absolute errors is piecewise linear in that reference;
 * its extrema occur at interval endpoints or at either central field value.
 * Candidate/control allowances are then propagated by their separate Lipschitz
 * bounds. This descriptive contrast does not change the frozen 80% predicate.
 * @param {SkySecondOrderAccuracyValue} candidate - Candidate central value and field-integration allowance.
 * @param {SkySecondOrderAccuracyValue} control - Matched control and its own field allowance.
 * @param {SkySecondOrderAccuracyValue} reference - One common physical reference and complete empirical allowance.
 * @param {boolean} admitted - Explicit external reference-admission outcome.
 * @returns {SkySecondOrderSharedContrast} Conservative interval and conditional direction.
 */
export function secondOrderSharedReferenceContrast(candidate, control, reference, admitted) {
	for (const value of [candidate, control, reference])
		assert.ok(Number.isFinite(value.value) && Number.isFinite(value.allowance) && value.allowance >= 0);
	assert.equal(typeof admitted, 'boolean');
	const lower = reference.value - reference.allowance,
		upper = reference.value + reference.allowance;
	const witnesses = [
		...new Set([
			lower,
			upper,
			...[candidate.value, control.value].filter((value) => value >= lower && value <= upper),
		]),
	];
	const reductions = witnesses.map((value) => Math.abs(control.value - value) - Math.abs(candidate.value - value));
	const fieldAllowance = candidate.allowance + control.allowance;
	const minimumReductionWatts = Math.min(...reductions) - fieldAllowance;
	const maximumReductionWatts = Math.max(...reductions) + fieldAllowance;
	return {
		reductionWatts: Math.abs(control.value - reference.value) - Math.abs(candidate.value - reference.value),
		minimumReductionWatts,
		maximumReductionWatts,
		direction: !admitted
			? 'unresolved'
			: minimumReductionWatts > 0
				? 'improved'
				: maximumReductionWatts < 0
					? 'regressed'
					: 'unresolved',
		referenceWitnessesWatts: witnesses,
	};
}

/** Exhaustively sample independent uncertainty-box witnesses, including shared-reference cancellation.
 * @returns {SkySecondOrderAnalysisProof} In-memory arithmetic proof, not physical reference evidence.
 */
export function secondOrderSharedContrastProof() {
	let checks = 0;
	for (const candidateValue of [-2, -0.2, 0, 0.4, 2])
		for (const controlValue of [-1, 0, 0.7, 3]) {
			const candidate = {value: candidateValue, allowance: 0.03},
				control = {value: controlValue, allowance: 0.07},
				reference = {value: 0.1, allowance: 0.6};
			const assessed = secondOrderSharedReferenceContrast(candidate, control, reference, true);
			for (let i = 0; i <= 24; i++)
				for (const dc of [-0.03, 0, 0.03])
					for (const dh of [-0.07, 0, 0.07]) {
						const r = reference.value - reference.allowance + (2 * reference.allowance * i) / 24;
						const observed = Math.abs(controlValue + dh - r) - Math.abs(candidateValue + dc - r);
						const scale = Math.max(1, Math.abs(observed), Math.abs(controlValue), Math.abs(candidateValue));
						assert.ok(
							observed >= assessed.minimumReductionWatts - 16 * Number.EPSILON * scale &&
								observed <= assessed.maximumReductionWatts + 16 * Number.EPSILON * scale,
						);
						checks++;
					}
		}
	const sameSide = secondOrderSharedReferenceContrast(
		{value: 10, allowance: 0.01},
		{value: 10.1, allowance: 0.01},
		{value: 0, allowance: 1},
		true,
	);
	assert.equal(sameSide.direction, 'improved');
	checks++;
	assert.ok(Math.abs(sameSide.minimumReductionWatts - 0.08) < 1e-14);
	checks++;
	assert.equal(
		secondOrderSharedReferenceContrast(
			{value: 10, allowance: 0},
			{value: 10.1, allowance: 0},
			{value: 0, allowance: 1},
			false,
		).direction,
		'unresolved',
	);
	checks++;
	assert.throws(() =>
		secondOrderSharedReferenceContrast(
			{value: 1, allowance: -1},
			{value: 0, allowance: 0},
			{value: 0, allowance: 0},
			true,
		),
	);
	checks++;
	return {schemaId: 'sky-second-order-shared-reference-proof-v1', checks};
}
