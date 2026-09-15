import {validatePhysicalSpec} from '../reference/physical/columns.mjs';
import {physicalReferencePolicy} from '../reference/physical/policy.mjs';
import {admitPhysicalReferenceChannel} from '../reference/physical/admission.mjs';
import {resolveVolumeGeometry} from '../volume-reference/geometry.mjs';
import {evaluateVolumeMethod} from '../volume-reference/method.mjs';
import {evaluateClosestVolumeMethod} from './method.mjs';

/** Assemble unchanged per-component admission for the newly identified Simpson coordinate.
 * @param {SkyVolumeGeometry} geometry - Original physical path and visibility splits.
 * @param {readonly number[]} channels - Validated channel order.
 * @param {SkyPhysicalMethodResult} gauss - Original distance-Gauss method, possibly exact retained reuse.
 * @param {SkyPhysicalMethodResult} simpson - New closest-approach-altitude method.
 * @param {SkyVolumeOptions} options - Original limits and global/local allocator identity.
 * @returns {SkyVolumeResult} Explicit new schema and coordinate limitations, with unchanged admission rules.
 */
export function assembleClosestVolumeResult(geometry, channels, gauss, simpson, options) {
	/** @param {number} index - Component-major index. @returns {SkyVolumeComponent} Same original admission. */
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
		schemaId: 'sky-independent-volume-closest-l1-v1',
		units: 'W m^-2 sr^-1 nm^-1',
		scope: 'Same physical atmospheric first scattering and direct ground reflection; Simpson outer coordinate measured from closest approach.',
		geometry,
		numericalPolicy: physicalReferencePolicy(options.profile ?? 'standard'),
		outerStrategy: options.outerStrategy ?? 'local',
		methods: [gauss, simpson],
		channels: rows,
		resolved: rows.every((row) => row.total.resolved),
		limitations: [
			'Only the Simpson outer coordinate changed to translated sqrt(radius-impactParameter). Distance Gauss, physical equations, original geometry/visibility, columns, 4/1 tolerance passes, work caps and final admission are unchanged.',
			'Empirical allowances are numerical diagnostics, not rigorous bounds, higher-order accuracy or measurement uncertainty. Original failed attempts are not retrospectively admitted.',
		],
	};
}

/** Evaluate the same complete physical ray with a differently parameterized independent Simpson method.
 * @param {SkyTransportSpec} spec - Original authenticated atmosphere/spectrum.
 * @param {SkyVector3} origin - Original physical location.
 * @param {SkyVector3} direction - Original unit direction.
 * @param {readonly number[]} channels - Unique supported spectral indices.
 * @param {SkyVolumeOptions} [options] - Unchanged work profile and guard.
 * @returns {SkyVolumeResult} New identified method pair and actual work.
 */
export function evaluateClosestVolumeFirstOrder(spec, origin, direction, channels, options = {}) {
	validatePhysicalSpec(spec);
	if (
		!channels.length ||
		new Set(channels).size !== channels.length ||
		channels.some((channel) => !Number.isInteger(channel) || !spec.domains.spectrum.channels[channel])
	)
		throw new RangeError('Unique supported channels required.');
	for (const channel of channels) {
		const albedo = spec.domains.spectrum.channels[channel].groundAlbedo;
		if (!Number.isFinite(albedo) || albedo < 0 || albedo > 1)
			throw new RangeError('Explicit ground albedo in [0,1] required.');
	}
	options.guard?.();
	const geometry = resolveVolumeGeometry(spec, origin, direction);
	const gauss = evaluateVolumeMethod(spec, geometry, channels, 'gauss', options);
	const simpson = evaluateClosestVolumeMethod(spec, geometry, channels, 'simpson', options);
	return assembleClosestVolumeResult(geometry, channels, gauss, simpson, options);
}
