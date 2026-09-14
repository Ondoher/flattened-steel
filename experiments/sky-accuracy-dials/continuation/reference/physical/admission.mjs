/** Declared fine-pass absolute-plus-relative physical radiance tolerance.
 * @param {number} radiance - Complete physical radiance estimate in spectral W units.
 * @returns {number} Empirical numerical consistency tolerance in the same units.
 */
function tolerance(radiance) {
	return 1e-9 + 1e-6 * Math.abs(radiance);
}

/** Admit a channel only when local convergence, pass consistency and independent
 * method agreement all meet the declared tolerance policy. Two tolerance passes
 * establish consistency only; they do not demonstrate a shrinking error sequence.
 * @param {SkyPhysicalMethodResult} gauss - Distance-domain method and its two passes.
 * @param {SkyPhysicalMethodResult} simpson - Altitude-domain method and its two passes.
 * @param {number} index - Channel offset within both method records.
 * @returns {SkyPhysicalChannelAdmission} Explicit acceptance and unresolved reasons.
 */
export function admitPhysicalReferenceChannel(gauss, simpson, index) {
	if (gauss.method !== 'gauss' || simpson.method !== 'simpson' || !Number.isInteger(index) || index < 0)
		throw new RangeError('Physical reference admission requires ordered methods and a nonnegative channel offset.');
	/** @type {string[]} */
	const reasons = [];
	const finiteNonnegative = (/** @type {number | null | undefined} */ value) => Number.isFinite(value) && value >= 0;
	for (const method of [gauss, simpson]) {
		if (!method.converged) reasons.push(`${method.method} numerical integration is unresolved.`);
		const coarse = method.coarseValues?.[index],
			fine = method.values?.[index];
		const difference = method.refinementDifferences?.[index],
			outerError = method.outerErrors?.[index],
			inner = method.innerAllowances?.[index];
		if (![coarse, fine, difference, outerError, inner].every(finiteNonnegative)) {
			reasons.push(`${method.method} has missing, nonfinite or negative refinement evidence.`);
			continue;
		}
		const passDifference = Math.max(difference, Math.abs(fine - coarse));
		if (passDifference > 4 * tolerance(coarse) + tolerance(fine))
			reasons.push(`${method.method} coarse/fine difference exceeds the sum of its declared pass tolerances.`);
		if (outerError > tolerance(fine))
			reasons.push(`${method.method} fine outer remainder exceeds its declared radiance tolerance.`);
	}
	const a = gauss.values?.[index],
		b = simpson.values?.[index];
	const difference = finiteNonnegative(a) && finiteNonnegative(b) ? Math.abs(a - b) : null;
	if (difference !== null && difference > tolerance(a) + tolerance(b))
		reasons.push('Independent physical methods disagree beyond the sum of their declared fine-pass tolerances.');
	let allowance =
		reasons.length === 0
			? 2 *
					Math.max(
						difference,
						gauss.refinementDifferences[index],
						simpson.refinementDifferences[index],
						Math.abs(a - gauss.coarseValues[index]),
						Math.abs(b - simpson.coarseValues[index]),
						gauss.outerErrors[index],
						simpson.outerErrors[index],
					) +
				2 * Math.max(gauss.innerAllowances[index], simpson.innerAllowances[index])
			: null;
	if (allowance !== null && !Number.isFinite(allowance)) {
		reasons.push('The propagated empirical reference allowance is nonfinite.');
		allowance = null;
	}
	return {
		methodDifferenceWatts: difference,
		empiricalAllowanceWatts: allowance,
		resolved: reasons.length === 0,
		reasons,
	};
}
