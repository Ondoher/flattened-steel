import {medium} from '../../numerics/direct.js';

/** Check full component admission, independently evaluated mirrors and the ground Rayleigh limit.
 * @param {SkyTransportSpec} spec - Matched coefficients.
 * @param {readonly SkyVolumeJ2Target[]} targets - All prospective points.
 * @param {readonly number[]} channels - Shared spectral indices.
 * @param {readonly SkyVolumeJ2Node[]} nodes - Compact complete or interrupted incident record.
 * @param {readonly SkyVolumeGroundLimit[]} limits - Independent limits at the two original surface points.
 * @param {readonly SkyVolumeJ2Row[][]} rows - Angular sums in target order.
 * @param {readonly number[][]} [mirrorIndices] - Two declared independent mirror checks per target.
 * @returns {SkyVolumeJ2Check[]} Failed and unresolved predicates remain explicit.
 */
export function assessVolumeJ2(
	spec,
	targets,
	channels,
	nodes,
	limits,
	rows,
	mirrorIndices = targets.map(() => [0, 64]),
) {
	/** @type {SkyVolumeJ2Check[]} */ const checks = [];
	for (const [targetIndex, target] of targets.entries()) {
		const targetNodes = nodes.filter((node) => node.targetId === target.id);
		for (const row of rows[targetIndex]) {
			checks.push({
				id: `components:${target.id}`,
				channel: row.channel,
				state: row.combined.resolved ? 'passed' : 'unresolved',
				difference: null,
				allowance: row.combined.incidentAllowance,
			});
			checks.push({
				id: `sum-identity:${target.id}`,
				channel: row.channel,
				state: !row.combined.resolved ? 'unresolved' : row.sumIdentityPassed ? 'passed' : 'failed',
				difference: row.sumDifference,
				allowance: row.arithmeticAllowance,
			});
			if (target.heightMeters !== 0.001) continue;
			const limit = limits
				.find((value) => value.origin.every((coordinate, axis) => coordinate === target.surfaceOrigin[axis]))
				?.channels.find((value) => value.channel === row.channel)?.directGround;
			const factor = medium(spec, row.channel, 0)[1] / 2;
			const expected = limit?.resolved ? (factor * (limit.gaussWatts + limit.simpsonWatts)) / 2 : null;
			const resolved = limit?.resolved && row.groundRayleigh.resolved;
			const difference = resolved ? Math.abs(row.groundRayleigh.mean - expected) : null;
			const allowance = resolved
				? 0.001 * Math.abs(expected) +
					factor * limit.empiricalAllowanceWatts +
					row.groundRayleigh.incidentAllowance +
					1e-15
				: null;
			checks.push({
				id: `rayleigh-ground-limit:${target.id}`,
				channel: row.channel,
				state: !resolved ? 'unresolved' : difference <= allowance ? 'passed' : 'failed',
				difference,
				allowance,
			});
		}
		for (const index of mirrorIndices[targetIndex]) {
			const representative = targetNodes.find((node) => node.mirrorOf === null && node.index === index);
			const mirror = targetNodes.find((node) => node.mirrorOf === index);
			for (const channel of channels)
				for (const component of ['atmosphere', 'directGround', 'total']) {
					const left = representative?.channels.find((row) => row.channel === channel)?.[component];
					const right = mirror?.channels.find((row) => row.channel === channel)?.[component];
					const resolved = left?.resolved && right?.resolved;
					const difference = resolved
						? Math.abs((left.gaussWatts + left.simpsonWatts - right.gaussWatts - right.simpsonWatts) / 2)
						: null;
					const allowance = resolved
						? left.empiricalAllowanceWatts + right.empiricalAllowanceWatts + 1e-12
						: null;
					checks.push({
						id: `mirror:${target.id}:${index}:${component}`,
						channel,
						state: !resolved ? 'unresolved' : difference <= allowance ? 'passed' : 'failed',
						difference,
						allowance,
					});
				}
		}
	}
	return checks;
}
