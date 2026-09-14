import {validatePhysicalSpec} from '../reference/physical/columns.mjs';
import {physicalReferencePolicy} from '../reference/physical/policy.mjs';
import {admitPhysicalReferenceChannel} from '../reference/physical/admission.mjs';
import {resolveVolumeGeometry} from './geometry.mjs';
import {evaluateVolumeMethod} from './method.mjs';

/** Evaluate cache-independent first-order incident radiance at an atmospheric point.
 * Direct source light is collimated along +Z; its unscattered delta beam is not
 * part of this diffuse incident L1. Ground reflection includes direct sunlight
 * only, matching the represented first order rather than diffuse recursion.
 * @param {SkyTransportSpec} spec - Matched exponential medium, sphere and Direct40 coefficients.
 * @param {SkyVector3} origin - Physical origin in metres, from ground through atmosphere top.
 * @param {SkyVector3} direction - Unit direction toward arriving radiance.
 * @param {readonly number[]} channels - Unique Direct40 indices in caller order.
 * @param {SkyVolumeOptions} [options={}] - Bounded work profile and cooperative execution guards.
 * @returns {SkyVolumeResult} Separated components, empirical admissions and measured work.
 */
export function evaluateVolumeFirstOrder(spec, origin, direction, channels, options = {}) {
	validatePhysicalSpec(spec);
	const numericalPolicy = physicalReferencePolicy(options.profile ?? 'standard');
	const outerStrategy = options.outerStrategy ?? 'local';
	if (!['local', 'global'].includes(outerStrategy))
		throw new RangeError('Unknown volume outer integration strategy.');
	if (
		!channels.length ||
		new Set(channels).size !== channels.length ||
		channels.some((channel) => !Number.isInteger(channel) || !spec.domains.spectrum.channels[channel])
	)
		throw new RangeError('Volume reference channels must be unique supported spectral indices.');
	for (const channel of channels) {
		const albedo = spec.domains.spectrum.channels[channel].groundAlbedo;
		if (!Number.isFinite(albedo) || albedo < 0 || albedo > 1)
			throw new RangeError('Volume reference requires explicit ground albedo in [0,1].');
	}
	if (options.guard !== undefined && typeof options.guard !== 'function')
		throw new TypeError('Volume guard must be a function.');
	options.guard?.();
	const geometry = resolveVolumeGeometry(spec, origin, direction);
	const gauss = evaluateVolumeMethod(spec, geometry, channels, 'gauss', options),
		simpson = evaluateVolumeMethod(spec, geometry, channels, 'simpson', options);
	/** @param {number} index - Component-major offset. @returns {SkyVolumeComponent} Empirical component admission. */
	const component = (index) => ({
		gaussWatts: gauss.values?.[index] ?? null,
		simpsonWatts: simpson.values?.[index] ?? null,
		...admitPhysicalReferenceChannel(gauss, simpson, index),
	});
	const rows = channels.map((channel, i) => {
		const atmosphere = component(i),
			directGround = component(i + channels.length),
			combined = component(i + 2 * channels.length);
		const resolved = atmosphere.resolved && directGround.resolved && combined.resolved;
		const total = {
			...combined,
			resolved,
			empiricalAllowanceWatts: resolved
				? Math.max(
						combined.empiricalAllowanceWatts,
						atmosphere.empiricalAllowanceWatts + directGround.empiricalAllowanceWatts,
					)
				: null,
			reasons: [
				...combined.reasons,
				...atmosphere.reasons.map((reason) => `Atmosphere: ${reason}`),
				...directGround.reasons.map((reason) => `Ground: ${reason}`),
			],
		};
		return {channel, atmosphere, directGround, total};
	});
	return {
		schemaId: 'sky-independent-volume-l1-v1',
		units: 'W m^-2 sr^-1 nm^-1',
		scope: 'Physical atmospheric first scattering plus attenuated direct Lambertian ground reflection; excludes direct solar delta beam and all diffuse ground recursion.',
		geometry,
		numericalPolicy,
		outerStrategy,
		methods: [gauss, simpson],
		channels: rows,
		resolved: rows.every((row) => row.total.resolved),
		limitations: [
			'Independent distance-Gauss and branchwise square-root-altitude Simpson outer formulations share physical coefficients, geometry termination, analytic phase functions and exponential optical-column equations. Their agreement does not bound common physical or geometry bias.',
			'Columns use each independent method in distance. Closest approach, the solar terminator and shadow-cylinder intersections split the outer path. Visibility at a split uses the open-interval side, avoiding spurious Simpson endpoint jumps.',
			'Two tolerance passes establish consistency, not asymptotic convergence. Existing physical-reference admission and empirical allowance rules apply separately to atmosphere, ground and total. The total allowance also covers the sum of component allowances. These are empirical allowances, not rigorous bounds or confidence intervals.',
			'Surface radius/projection admission tolerates 1e-6 metre roundoff. Exact-ground inward directions are rejected so callers retain their separately declared inward-zero recurrence convention. Positive-altitude inward rays include direct ground reflection when they hit illuminated ground.',
			'No cache reconstruction, incoming angular integration, second or higher atmospheric scattering, diffuse reflected-ground recursion, scattering tail or measurement uncertainty is included.',
		],
	};
}

/** Evaluate a deliberately small caller-selected pilot without filesystem writes.
 * The caller must allocate/seal evidence, snapshot provenance and enforce job
 * deadlines and cumulative storage/work limits through the guard.
 * @param {SkyTransportSpec} spec - Authenticated matched physical input.
 * @param {readonly SkyVolumeWitness[]} witnesses - One to sixteen unique physical rays.
 * @param {readonly number[]} channels - Shared admitted spectral indices.
 * @param {SkyVolumeOptions} [options={}] - Work ceilings and required caller execution guard.
 * @returns {SkyVolumePilotRow[]} Measured results in witness order, never a full J2 reference.
 */
export function evaluateVolumePilot(spec, witnesses, channels, options = {}) {
	if (
		!witnesses.length ||
		witnesses.length > 16 ||
		witnesses.some((witness) => typeof witness.id !== 'string' || !witness.id.length) ||
		new Set(witnesses.map((witness) => witness.id)).size !== witnesses.length
	)
		throw new RangeError('Volume pilot requires one to sixteen uniquely identified witnesses.');
	return witnesses.map((witness) => {
		options.guard?.();
		const started = performance.now();
		const result = evaluateVolumeFirstOrder(spec, witness.origin, witness.direction, channels, options);
		return {id: witness.id, elapsedMilliseconds: Math.max(0, performance.now() - started), result};
	});
}
