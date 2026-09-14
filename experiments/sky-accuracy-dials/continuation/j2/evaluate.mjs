import {medium, phase} from '../../numerics/direct.js';
import {dot, localDirection} from '../../numerics/math.js';

/** Positive phase-weight sum for both distinct reflection members.
 * @param {SkyTransportSpec} spec - Fixed physics and spectrum.
 * @param {number} channel - Spectral index.
 * @param {SkyJ2Target} target - Frozen ground/outgoing query.
 * @param {SkyJ2Incident} incident - Representative and optional mirror.
 * @returns {number} Nonnegative scattering/solid-angle coefficient in m^-1.
 */
export function phaseWeight(spec, channel, target, incident) {
	const outgoing = localDirection(target.origin, target.direction),
		coefficients = medium(spec, channel, 0);
	return (
		incident.weight *
		[incident.direction, ...(incident.mirror ? [incident.mirror] : [])].reduce((sum, direction) => {
			const phases = phase(spec, Math.max(-1, Math.min(1, dot(outgoing, direction))));
			return sum + coefficients[1] * phases[0] + coefficients[2] * phases[1];
		}, 0)
	);
}

/** Allocate accumulators for exactly the frozen target/channel Cartesian product.
 * @param {readonly SkyJ2Target[]} targets - At most two outgoing directions at one origin.
 * @param {readonly number[]} channels - Frozen four-channel selection.
 * @param {number} finiteCount - Registered finite S/T controls represented in this sum.
 * @returns {SkyJ2Accumulator[]} Zero initial sums; callers never publish incomplete sums as estimates.
 */
export function createSums(targets, channels, finiteCount) {
	return targets.flatMap((target) =>
		channels.map((channel) => ({
			targetId: target.id,
			channel,
			gauss: 0,
			simpson: 0,
			allowance: 0,
			finite: Array(finiteCount).fill(0),
		})),
	);
}

/** Accumulate a fully admitted independent node using positive phase weights.
 * @param {SkyTransportSpec} spec - Fixed model.
 * @param {readonly SkyJ2Target[]} targets - Same-origin target directions.
 * @param {readonly number[]} channels - Frozen channel order.
 * @param {SkyJ2Incident} incident - Local group and solid angle.
 * @param {SkyJ2NodeResult} node - Independently resolved incident radiance.
 * @param {SkyJ2Accumulator[]} sums - Mutated local sums.
 * @returns {void} Throws if an unresolved contribution could enter a qualified sum.
 */
export function accumulateNode(spec, targets, channels, incident, node, sums) {
	if (
		!node.resolved ||
		[node.gauss, node.simpson, node.allowances].some(
			(values) =>
				values.length !== channels.length ||
				values.some((value) => value === null || !(value >= 0) || !Number.isFinite(value)),
		)
	)
		throw new Error('Unresolved L1 cannot enter a local J2 reference.');
	for (const row of sums) {
		const target = targets.find((value) => value.id === row.targetId),
			index = channels.indexOf(row.channel);
		const weight = phaseWeight(spec, row.channel, target, incident);
		row.gauss += weight * node.gauss[index];
		row.simpson += weight * node.simpson[index];
		row.allowance += weight * node.allowances[index];
		for (let control = 0; control < row.finite.length; control++)
			row.finite[control] += weight * node.finite[control][index];
	}
}

/** Evaluate only preregistered empirical angular adequacy and envelope equations.
 * @param {readonly SkyJ2Target[]} targets - All four frozen space/direction targets.
 * @param {readonly number[]} channels - Frozen four spectral indices.
 * @param {readonly SkyJ2RuleResult[]} results - Complete or explicitly limited rule observations.
 * @returns {readonly SkyJ2Envelope[]} Every requested output, including unavailable references.
 */
export function angularEnvelopes(targets, channels, results) {
	return targets.flatMap((target) =>
		channels.map((channel) => {
			const rows = ['i512-midpoint', 'i2048-midpoint', 'i8192-midpoint', 'i8192-endpoint'].map((rule) =>
				results
					.find(
						(result) =>
							result.time === target.time && result.ruleId === rule && result.finiteAngularResolved,
					)
					?.rows?.find((row) => row.targetId === target.id && row.channel === channel),
			);
			if (rows.some((row) => !row))
				return {
					targetId: target.id,
					channel,
					estimate: null,
					empiricalAllowance: null,
					lastMidpointChange: null,
					placementDifference: null,
					densityFloor: null,
					shrinking: false,
					angularAdequate: false,
					reason: 'At least one material angular comparison or admitted incident node is unavailable.',
				};
			const [coarse, medium, fine, shifted] = rows;
			const earlier = Math.abs(medium.gauss - coarse.gauss),
				last = Math.abs(fine.gauss - medium.gauss);
			const placement = Math.abs(shifted.gauss - fine.gauss),
				floor = Math.max(1e-15, 1e-6 * Math.abs(fine.gauss));
			const allowance = 2 * Math.max(last, placement) + Math.max(...rows.map((row) => row.allowance));
			const shrinking = last < earlier || last <= floor;
			const adequate = shrinking && placement <= 2 * floor;
			return {
				targetId: target.id,
				channel,
				estimate: fine.gauss,
				empiricalAllowance: adequate ? allowance : null,
				lastMidpointChange: last,
				placementDifference: placement,
				densityFloor: floor,
				shrinking,
				angularAdequate: adequate,
				reason: adequate
					? null
					: 'Angular correction shrinkage or same-count placement agreement failed; computed sensitivities are not an accepted remaining-error allowance.',
			};
		}),
	);
}
