import assert from 'node:assert/strict';

/** Select one uniquely available local density value without a fallback.
 * @param {readonly SkyJ2RuleResult[]} results - Complete angular sums.
 * @param {string} id - Angular rule identity.
 * @param {string} targetId - Frozen outgoing target.
 * @param {number} channel - Direct40 channel ordinal.
 * @returns {SkyJ2Accumulator} Exact completed scalar row.
 */
export function angularRow(results, id, targetId, channel) {
	const matches = results
		.filter((rule) => rule.ruleId === id && rule.finiteAngularResolved)
		.flatMap((rule) => rule.rows ?? [])
		.filter((row) => row.targetId === targetId && row.channel === channel);
	assert.equal(matches.length, 1, `Missing unique ${id}/${targetId}/${channel}.`);
	return matches[0];
}

/** Freeze a qualitative target and conservative observed-change envelope, without fitting Gaussian order.
 * @param {readonly SkyJ2Target[]} targets - Unchanged four exact-ground outputs.
 * @param {readonly number[]} channels - Unchanged four channels.
 * @param {readonly SkyJ2RuleResult[]} results - Only completed development rules are consulted.
 * @returns {readonly SkyAngularPrediction[]} Sixteen prospective density predictions.
 */
export function angularPredictions(targets, channels, results) {
	return targets.flatMap((target) =>
		channels.map((channel) => {
			const coarse = angularRow(results, 'hemi8-az64-mid', target.id, channel);
			const medium = angularRow(results, 'hemi16-az64-mid', target.id, channel);
			const floor = Math.max(1e-15, 1e-6 * Math.abs(medium.gauss));
			const incidentAllowance = coarse.allowance + medium.allowance;
			return {
				targetId: target.id,
				channel,
				coarse: coarse.gauss,
				medium: medium.gauss,
				observedCorrection: medium.gauss - coarse.gauss,
				floor,
				forecastRadius: 2 * Math.abs(medium.gauss - coarse.gauss) + 2 * incidentAllowance + floor,
				incidentAllowance,
				magnitudePredictionResolved: /** @type {const} */ (false),
			};
		}),
	);
}

/** Assess held local densities with unchanged empirical adequacy gates and explicit unresolved outcomes.
 * The mapped rule changes the radial coordinate only. Same-new-radial endpoint
 * count and midpoint/endpoint placement checks independently constrain azimuth sensitivity.
 * @param {readonly SkyAngularPrediction[]} predictions - Exactly frozen before held output.
 * @param {readonly SkyJ2RuleResult[]} results - Complete inherited and newly held rules.
 * @returns {readonly SkyAngularOutcome[]} Scalar outcomes including every failed or unresolved gate.
 */
export function angularOutcomes(predictions, results) {
	return predictions.map((prediction) => {
		const {targetId, channel} = prediction;
		const fine = angularRow(results, 'hemi32-az128-end', targetId, channel);
		const mapped = angularRow(results, 'squared32-az128-end', targetId, channel);
		const az64 = angularRow(results, 'hemi32-az64-end', targetId, channel);
		const midpoint64 = angularRow(results, 'hemi32-az64-mid', targetId, channel);
		const fineCorrection = midpoint64.gauss - prediction.medium;
		const mappedDifference = mapped.gauss - fine.gauss;
		const comparisonAllowance = midpoint64.allowance + mapped.allowance + prediction.incidentAllowance;
		const coarseError = Math.abs(prediction.medium - mapped.gauss),
			fineError = Math.abs(mapped.gauss - midpoint64.gauss);
		const correctionShrinks =
			Math.abs(fineCorrection) < Math.abs(prediction.observedCorrection) ||
			Math.abs(fineCorrection) <= prediction.floor;
		const closerToMapped = fineError < coarseError;
		const azLast = Math.abs(fine.gauss - az64.gauss);
		const placement = Math.abs(midpoint64.gauss - az64.gauss);
		const azAdequate = azLast <= 2 * prediction.floor && placement <= 2 * prediction.floor;
		const comparisonResolved =
			azAdequate &&
			Math.abs(coarseError - fineError) > 2 * (comparisonAllowance + azLast + placement) + prediction.floor;
		const angularAdequate = correctionShrinks && Math.abs(mappedDifference) <= 2 * prediction.floor && azAdequate;
		const allowance =
			2 * Math.max(Math.abs(fineCorrection), Math.abs(mappedDifference), azLast, placement) +
			Math.max(
				fine.allowance,
				mapped.allowance,
				az64.allowance,
				midpoint64.allowance,
				prediction.incidentAllowance,
			);
		return {
			targetId,
			channel,
			fine: fine.gauss,
			mapped: mapped.gauss,
			fineCorrection,
			mappedDifference,
			correctionShrinks,
			closerToMapped,
			comparisonResolved,
			insideForecast: Math.abs(fineCorrection) <= prediction.forecastRadius,
			placementDifference: midpoint64.gauss - az64.gauss,
			azimuthDifference: fine.gauss - az64.gauss,
			angularAdequate,
			empiricalAllowance: angularAdequate ? allowance : null,
		};
	});
}

/** Rank older full-interval controls using a reference independent of their own differences.
 * @param {readonly SkyAngularOutcome[]} outcomes - Held reference adequacy including nulls.
 * @param {readonly SkyJ2RuleResult[]} results - Complete registered controls.
 * @returns {readonly SkyAngularRanking[]} Every old control comparison, qualified only under original gates.
 */
export function angularRankings(outcomes, results) {
	const ids = [
		'full64-az32-end',
		'full64-az64-end',
		'full64-az128-end',
		'full64-az32-mid',
		'full64-az64-mid',
		'full32-az32-mid',
	];
	return outcomes.flatMap((outcome) =>
		ids.map((ruleId) => {
			const baseline = angularRow(results, 'full16-az32-mid', outcome.targetId, outcome.channel);
			const candidate = angularRow(results, ruleId, outcome.targetId, outcome.channel);
			const discrepancy = candidate.gauss - outcome.fine;
			const errorReduction = Math.abs(baseline.gauss - outcome.fine) - Math.abs(discrepancy);
			const interventionMagnitude = Math.abs(candidate.gauss - baseline.gauss);
			const referenceAllowance = outcome.empiricalAllowance;
			const baselineAllowance = baseline.allowance,
				candidateAllowance = candidate.allowance;
			const empiricalAllowance =
				referenceAllowance === null
					? null
					: referenceAllowance + Math.max(baselineAllowance, candidateAllowance);
			return {
				targetId: outcome.targetId,
				channel: outcome.channel,
				ruleId,
				discrepancy,
				errorReduction,
				interventionMagnitude,
				referenceAllowance,
				baselineAllowance,
				candidateAllowance,
				empiricalAllowance,
				reductionQualified:
					empiricalAllowance !== null &&
					empiricalAllowance <= 0.2 * errorReduction &&
					errorReduction > 2 * empiricalAllowance,
			};
		}),
	);
}
