import assert from 'node:assert/strict';

/** Derive a conditional lower bound without substituting cached higher orders.
 * For Q>=0, physical P1+P2+Q-M >= P1+P2-M. Empirical reference allowances
 * qualify this bound; unknown measurement uncertainty is not silently set to a known zero.
 * @param {SkyOrderAttributionRow} source - Exact original physical-first attribution.
 * @param {SkySecondOrderReferenceChannel} reference - Independently admitted pure P2.
 * @returns {SkyPositiveOrderBoundRow} Includes an unresolved state rather than an invented allowance.
 */
export function positiveOrderBound(source, reference) {
	assert.equal(source.channel, reference.channel);
	assert.equal(source.cumulative.length, 4);
	assert.equal(source.contributions.length, 4);
	assert.equal(source.allowances.length, 4);
	assert.ok(reference.referenceWatts !== null && Number.isFinite(reference.referenceWatts));
	assert.ok(reference.referenceWatts >= 0);
	assert.ok(
		[source.physicalFirstResidual, source.firstNumerical, ...source.cumulative, ...source.contributions].every(
			Number.isFinite,
		),
	);
	for (const allowance of [source.allowances[0], reference.allowanceWatts])
		assert.ok(allowance === null || (Number.isFinite(allowance) && allowance >= 0));
	const physicalFirstWatts = source.cumulative[0] - source.firstNumerical;
	const recoveredMeasurementWatts = physicalFirstWatts - source.physicalFirstResidual;
	assert.ok(physicalFirstWatts >= 0 && recoveredMeasurementWatts > 0);
	const firstTwoResidualWatts = source.physicalFirstResidual + reference.referenceWatts;
	const roundoffAllowanceWatts =
		128 *
		Number.EPSILON *
		(physicalFirstWatts +
			recoveredMeasurementWatts +
			reference.referenceWatts +
			Math.abs(source.physicalFirstResidual));
	const admitted = reference.adequate && source.allowances[0] !== null && reference.allowanceWatts !== null;
	const lowerResidualWatts = admitted
		? firstTwoResidualWatts - source.allowances[0] - reference.allowanceWatts - roundoffAllowanceWatts
		: null;
	const positive = lowerResidualWatts !== null && lowerResidualWatts > 0;
	const frozenThirdFourthWatts = source.contributions[2] + source.contributions[3];
	return {
		probeId: source.probeId,
		channel: source.channel,
		physicalFirstWatts,
		physicalSecondWatts: reference.referenceWatts,
		recoveredMeasurementWatts,
		firstTwoResidualWatts,
		firstAllowanceWatts: source.allowances[0],
		secondAllowanceWatts: reference.allowanceWatts,
		roundoffAllowanceWatts,
		lowerResidualWatts,
		minimumSquaredResidual: admitted ? Math.max(0, lowerResidualWatts) ** 2 : null,
		requiredUpwardMeasurementShiftWatts: admitted ? Math.max(0, lowerResidualWatts) : null,
		requiredUpwardMeasurementShiftFraction: admitted
			? Math.max(0, lowerResidualWatts) / recoveredMeasurementWatts
			: null,
		frozenThirdFourthWatts,
		residualWithFrozenThirdFourthWatts: firstTwoResidualWatts + frozenThirdFourthWatts,
		state: !admitted ? 'unresolved' : positive ? 'positive-lower-bound' : 'no-positive-bound',
	};
}

/** Exercise positive, negative, missing-reference, negative-input and future-order cases.
 * @param {SkyOrderAttributionRow} source - A validated immutable row supplies the complete contract.
 * @param {SkySecondOrderReferenceChannel} reference - Complete admitted reference contract.
 * @returns {{checks:number}} Manufactured values do not evaluate a physical target.
 */
export function positiveOrderBoundProof(source, reference) {
	let checks = 0;
	const check = (/** @type {boolean} */ value) => {
		assert.ok(value);
		checks++;
	};
	const s = {
		...source,
		cumulative: [0.1, 0.12, 0.13, 0.14],
		firstNumerical: 0,
		physicalFirstResidual: -0.01,
		contributions: [-0.01, 0.02, 0.01, 0.01],
		allowances: [1e-7, 0, 0, 0],
	};
	const r = {...reference, referenceWatts: 0.02, allowanceWatts: 2e-7, adequate: true};
	const bound = positiveOrderBound(s, r);
	check(bound.state === 'positive-lower-bound');
	check(Math.abs(bound.firstTwoResidualWatts - 0.01) < 1e-16);
	check(bound.lowerResidualWatts < 0.01 && bound.lowerResidualWatts > 0.0099996);
	for (const later of [0, 1e-8, 0.001, 0.1, 10])
		check(s.physicalFirstResidual + r.referenceWatts - 3e-7 + later >= bound.lowerResidualWatts);
	check(positiveOrderBound({...s, physicalFirstResidual: -0.04}, r).state === 'no-positive-bound');
	check(positiveOrderBound(s, {...r, adequate: false}).state === 'unresolved');
	check(positiveOrderBound(s, {...r, allowanceWatts: null}).lowerResidualWatts === null);
	check(positiveOrderBound({...s, allowances: [null, 0, 0, 0]}, r).state === 'unresolved');
	assert.throws(() => positiveOrderBound(s, {...r, referenceWatts: -1}));
	checks++;
	assert.throws(() => positiveOrderBound(s, {...r, allowanceWatts: -1}));
	checks++;
	check(
		positiveOrderBound({...s, contributions: [-0.01, 0.02, 1, 2]}, r).lowerResidualWatts ===
			bound.lowerResidualWatts,
	);
	return {checks};
}
