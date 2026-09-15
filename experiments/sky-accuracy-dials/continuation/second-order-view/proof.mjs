import assert from 'node:assert/strict';
import {gaussLegendre} from '../../numerics/profile.js';
import {dot} from '../../numerics/math.js';
import {volumeSphereExit, resolveVolumeGeometry} from '../volume-reference/geometry.mjs';
import {incidentWorld} from '../j2/angular.mjs';
import {
	viewHeightBreaks,
	viewHeightCoordinate,
	secondOrderViewNodes,
	secondOrderAngularGroups,
	viewAngularRules,
} from './geometry.mjs';
import {integrateSecondOrderView} from './integrate.mjs';

/** Verify geometry/Jacobians, manufactured integrals, angular moments and missing data.
 * @param {DialContinuationRegistrationRead} registration - Original frozen rays.
 * @param {SkyTransportSpec} spec - Matched physical radii, no altered physical data.
 * @returns {SkySecondOrderProof} Focused in-memory mathematical evidence.
 */
export function secondOrderViewProof(registration, spec) {
	let checks = 0,
		maximumPathErrorMeters = 0,
		maximumAttenuatedErrorMeters = 0;
	const radius = spec.planet.bottomRadiusMeters;
	for (const probeId of ['p-0930-5-7', 'p-1230-3-5']) {
		const nodes = secondOrderViewNodes(registration, spec, probeId, 16),
			first = nodes[0];
		const projection = dot(first.surfaceOrigin, first.direction),
			length = volumeSphereExit(first.surfaceOrigin, first.direction, spec.planet.topRadiusMeters);
		const sum = nodes.reduce((total, node) => total + node.weightMeters, 0);
		maximumPathErrorMeters = Math.max(maximumPathErrorMeters, Math.abs(sum - length));
		assert.ok(Math.abs(sum - length) < 1e-6);
		checks++;
		assert.deepEqual(viewHeightCoordinate(radius, projection, 0), {distance: 0, jacobian: 0});
		checks++;
		for (const extinction of [1e-6, 1e-4]) {
			const integral = nodes.reduce(
				(total, node) => total + node.weightMeters * Math.exp(-extinction * node.distanceMeters),
				0,
			);
			const exact = -Math.expm1(-extinction * length) / extinction;
			maximumAttenuatedErrorMeters = Math.max(maximumAttenuatedErrorMeters, Math.abs(integral - exact));
			assert.ok(Math.abs(integral - exact) < 1e-6);
			checks++;
		}
		// An independent Simpson construction includes the true zero-Jacobian endpoint.
		let simpson = 0;
		for (let interval = 0; interval < viewHeightBreaks.length - 1; interval++) {
			const start = Math.sqrt(viewHeightBreaks[interval]),
				end = Math.sqrt(viewHeightBreaks[interval + 1]),
				step = (end - start) / 256;
			for (let index = 0; index <= 256; index++) {
				const value = viewHeightCoordinate(radius, projection, start + index * step);
				simpson += (step / 3) * (index === 0 || index === 256 ? 1 : index % 2 ? 4 : 2) * value.jacobian;
			}
		}
		assert.ok(Math.abs(simpson - length) < 1e-5);
		checks++;
		for (const node of [nodes[0], nodes[48]])
			for (const rule of viewAngularRules) {
				const groups = secondOrderAngularGroups(radius, node.origin, rule);
				assert.equal(groups.length, rule === 'ordinary-coarse' ? 192 : 768);
				checks++;
				for (let degree = 0; degree <= 4; degree++) {
					const moment = groups.reduce(
						(total, group) => total + 2 * group.incident.weight * group.incident.direction[2] ** degree,
						0,
					);
					const exact = degree % 2 ? 0 : (4 * Math.PI) / (degree + 1);
					assert.ok(Math.abs(moment - exact) < 1e-12);
					checks++;
				}
				for (const group of groups) {
					assert.ok(
						group.incident.weight > 0 && Math.abs(Math.hypot(...group.incident.direction) - 1) < 1e-14,
					);
					checks++;
					assert.equal(
						resolveVolumeGeometry(spec, node.origin, incidentWorld(node.origin, group.incident.direction))
							.branch,
						group.branch,
					);
					checks++;
				}
			}
		const missing = integrateSecondOrderView(nodes, [], [0, 8]);
		assert.ok(
			missing.every((row) => !row.complete && row.valueWatts === null && row.incidentAllowanceWatts === null),
		);
		checks++;
	}
	assert.throws(() => viewHeightCoordinate(radius, 0, 1));
	checks++;
	assert.throws(() => viewHeightCoordinate(radius, radius, -1));
	checks++;
	assert.equal(gaussLegendre(4).length, 4);
	checks++;
	return {schemaId: 'sky-second-order-view-proof-v1', checks, maximumPathErrorMeters, maximumAttenuatedErrorMeters};
}
