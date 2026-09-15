import assert from 'node:assert/strict';
import {dot, unit} from '../../numerics/math.js';
import {incidentWorld} from '../j2/angular.mjs';
import {resolveVolumeGeometry} from '../volume-reference/geometry.mjs';
import {volumeJ2Groups, volumeJ2Weights, sumVolumeJ2} from './angular.mjs';

/** Verify analytic solid angle, branch boundaries, phase normalization and missing evidence.
 * Input metadata supplies a complete schema; manufactured coefficients and unit incident
 * radiance replace the physical sky. No atmospheric reference integration executes.
 * @param {SkyTransportSpec} input - Complete matched input schema.
 * @returns {SkyVolumeJ2Proof} Actual mathematical checks and largest phase-mass discrepancy.
 */
export function volumeJ2Proof(input) {
	const spec = {
		...input,
		atmosphere: {
			...input.atmosphere,
			miePhaseFunctionG: 0,
			rayleighScaleHeightMeters: 1e30,
			mieScaleHeightMeters: 1e30,
			mieSingleScatteringAlbedo: 1,
		},
		domains: {
			...input.domains,
			spectrum: {
				...input.domains.spectrum,
				channels: input.domains.spectrum.channels.map((channel, index) =>
					index === 0 ? {...channel, rayleighScatteringPerMeter: 1, mieExtinctionPerMeter: 1} : channel,
				),
			},
		},
	};
	const bottom = spec.planet.bottomRadiusMeters;
	let checks = 0,
		maximumPhaseMassError = 0;
	/** @param {boolean} condition - Required manufactured behavior. @param {string} message - Checked identity. */
	const check = (condition, message) => {
		assert.ok(condition, message);
		checks++;
	};
	for (const height of [0.001, 1, 1000, 8000]) {
		const origin = /** @type {SkyVector3} */ ([0, 0, bottom + height]);
		const groups = volumeJ2Groups(bottom, origin);
		check(groups.length === 192, 'Complete reflection representative count');
		check(
			Math.abs(groups.reduce((sum, group) => sum + 2 * group.incident.weight, 0) - 4 * Math.PI) < 1e-12,
			'Full sphere solid angle without renormalization',
		);
		for (const group of groups) {
			const {direction, mirror, weight} = group.incident;
			check(weight > 0 && Math.abs(dot(direction, direction) - 1) < 1e-14, 'Positive unit-vector quadrature');
			for (const vector of [direction, mirror]) {
				const world = incidentWorld(origin, vector);
				check(
					resolveVolumeGeometry(spec, origin, world).branch === group.branch,
					'Independently classified branch',
				);
			}
		}
		for (const direction of [
			[0, 0, 1],
			[1, 0, 0],
			[0.2, 0.7, 0.4],
		].map(unit)) {
			const target = {
				id: 'manufactured',
				probeId: 'manufactured',
				heightMeters: height,
				distanceMeters: height,
				surfaceOrigin: /** @type {SkyVector3} */ ([0, 0, bottom]),
				origin,
				direction,
			};
			let full = 0,
				inward = 0;
			for (const group of groups) {
				const [rayleigh, mie] = volumeJ2Weights(spec, target, 0, group.incident);
				check(Math.abs(rayleigh - mie) < 1e-14, 'g=0 Mie and Rayleigh analytic agreement');
				full += rayleigh;
				if (group.incident.direction[2] < 0) inward += rayleigh;
			}
			maximumPhaseMassError = Math.max(maximumPhaseMassError, Math.abs(full - 1), Math.abs(inward - 0.5));
			check(
				Math.abs(full - 1) < 1e-12 && Math.abs(inward - 0.5) < 1e-12,
				'Normalized even phase has exactly half its mass inward',
			);
			/** @param {number} value - Manufactured constant radiance. @returns {SkyVolumeComponent} Exact admitted input. */
			const component = (value) => ({
				gaussWatts: value,
				simpsonWatts: value,
				empiricalAllowanceWatts: 0,
				methodDifferenceWatts: 0,
				resolved: true,
				reasons: [],
			});
			const nodes = groups.map((group, index) => ({
				targetId: target.id,
				index,
				mirrorOf: null,
				direction: group.incident.direction,
				branch: group.branch,
				elapsedMilliseconds: 0,
				mediumEvaluations: 0,
				outerEvaluations: 0,
				channels: [{channel: 0, atmosphere: component(2), directGround: component(3), total: component(5)}],
			}));
			const row = sumVolumeJ2(spec, target, [0], groups, nodes)[0];
			check(
				row.sumIdentityPassed && Math.abs(row.combined.mean - 10) < 1e-11,
				'Independent sum and constant incident solution',
			);
			check(
				!sumVolumeJ2(spec, target, [0], groups, nodes.slice(1))[0].combined.resolved,
				'A missing positive-weight ray cannot become zero',
			);
		}
	}
	return {schemaId: 'sky-volume-j2-proof-v1', checks, maximumPhaseMassError};
}
