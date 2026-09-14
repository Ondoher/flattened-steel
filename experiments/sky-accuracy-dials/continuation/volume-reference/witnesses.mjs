import assert from 'node:assert/strict';
import {incidentWorld} from '../j2/angular.mjs';

/** Compare identical volume witnesses under two outer error-allocation strategies.
 * Admission recovery and preservation of formerly admitted values are separate.
 * @param {readonly SkyVolumePilotRow[]} current - Newly computed global-allocation results.
 * @param {readonly SkyVolumePilotRow[]} previous - Authenticated original local-allocation results.
 * @param {readonly number[]} channels - Exact common channel order.
 * @returns {SkyVolumeCheck[]} Explicit admission and agreement predicates.
 */
export function compareVolumeStrategies(current, previous, channels) {
	/** @type {SkyVolumeCheck[]} */ const checks = [];
	for (const old of previous) {
		const fresh = current.find((row) => row.id === old.id);
		if (fresh) assert.deepEqual(fresh.result.geometry, old.result.geometry);
		for (const channel of channels) {
			const before = old.result.channels.find((row) => row.channel === channel),
				after = fresh?.result.channels.find((row) => row.channel === channel);
			assert.ok(before);
			checks.push({
				id: `global-admission:${old.id}`,
				channel,
				state: after?.total.resolved ? 'passed' : 'unresolved',
				differenceWatts: null,
				allowanceWatts: after?.total.empiricalAllowanceWatts ?? null,
				description:
					'Global outer-error allocation admits the total without relaxing physical-reference thresholds; original local nonresolution remains recorded in the parent.',
			});
			for (const component of ['atmosphere', 'directGround', 'total']) {
				if (!before[component].resolved) continue;
				const resolved = after?.[component].resolved;
				const differenceWatts = resolved
					? Math.abs(
							(after[component].gaussWatts +
								after[component].simpsonWatts -
								before[component].gaussWatts -
								before[component].simpsonWatts) /
								2,
						)
					: null;
				const allowanceWatts = resolved
					? after[component].empiricalAllowanceWatts + before[component].empiricalAllowanceWatts + 1e-12
					: null;
				checks.push({
					id: `allocation-parity:${old.id}:${component}`,
					channel,
					state: !resolved ? 'unresolved' : differenceWatts <= allowanceWatts ? 'passed' : 'failed',
					differenceWatts,
					allowanceWatts,
					description:
						'Previously admitted component stays within summed local/global empirical allowances plus a 1e-12 W arithmetic floor at identical geometry and physics.',
				});
			}
		}
	}
	return checks;
}

/** Freeze the eight geometric pilot witnesses before any physical evaluation.
 * @param {DialContinuationRegistrationRead} registration - Authenticated original C0 probe geometry.
 * @param {SkyTransportSpec} spec - Matched physical radii.
 * @returns {SkyVolumeRegisteredWitness[]} Exact surface and explicitly derived volume rays.
 */
export function volumeWitnesses(registration, spec) {
	/** @type {SkyVolumeRegisteredWitness[]} */ const witnesses = [];
	for (const id of ['p-0930-4-7', 'p-1230-3-5']) {
		const index = registration.probes.findIndex((probe) => probe.probeId === id);
		assert.ok(index >= 0, `Missing registered surface witness ${id}.`);
		const ray = registration.record.probeRays[index];
		witnesses.push({
			id,
			origin: [...ray.origin],
			direction: [...ray.direction],
			parentProbeId: id,
			elevationMeters: 0,
			localCosine: null,
			derivation: 'Exact original C0 origin and unit direction, unchanged.',
		});
	}
	const base = witnesses[0].origin,
		radius = Math.hypot(...base),
		bottom = spec.planet.bottomRadiusMeters;
	/** Construct one new physical ray through the existing source-facing local frame.
	 * @param {string} id - Unique new witness name.
	 * @param {number} height - Radial elevation in metres.
	 * @param {number} mu - Local up cosine.
	 * @returns {void} Appends the exact derived selector.
	 */
	const add = (id, height, mu) => {
		/** @type {SkyVector3} */ const origin = [
			(base[0] * (bottom + height)) / radius,
			(base[1] * (bottom + height)) / radius,
			(base[2] * (bottom + height)) / radius,
		];
		const direction = incidentWorld(origin, [Math.sqrt(1 - mu * mu), 0, mu]);
		witnesses.push({
			id,
			origin,
			direction,
			parentProbeId: witnesses[0].id,
			elevationMeters: height,
			localCosine: mu,
			derivation:
				'origin = normalize(original 09:30 origin) * (bottomRadius + height); local direction = (sqrt(1 - mu^2), 0, mu), rotated through the source-facing radial frame and normalized. The local horizontal component points toward the projected +Z source.',
		});
	};
	for (const height of [0.001, 1, 100, 1000]) add(`ground-h${height}`, height, -0.5);
	add('outward-h1000', 1000, 0.5);
	add('escaping-h1000', 1000, -0.5 * Math.sqrt(1 - (bottom / (bottom + 1000)) ** 2));
	return witnesses;
}

/** Assess exactly the preregistered local parity, zero-ground and limit predicates.
 * No numerical nonresolution is hidden by substituting a zero estimate.
 * @param {readonly SkyVolumePilotRow[]} rows - Complete returned independent witness reports.
 * @param {SkyPhysicalReferenceReport} original - Authenticated original physical J1 reference.
 * @param {SkyVolumeGroundLimit|null} limit - Independent fixed-ground direct limit, or absent.
 * @param {readonly number[]} channels - Registered pilot spectral indices.
 * @returns {SkyVolumeCheck[]} Every declared predicate, including unavailable outcomes.
 */
export function assessVolumeWitnesses(rows, original, limit, channels) {
	/** @type {SkyVolumeCheck[]} */ const checks = [];
	/** Read one direct-ground component without defaulting missing values.
	 * @param {string} id - Witness identity.
	 * @param {number} channel - Spectral channel.
	 * @returns {SkyVolumeComponent|undefined} Existing returned component.
	 */
	const ground = (id, channel) =>
		rows.find((row) => row.id === id)?.result.channels.find((row) => row.channel === channel)?.directGround;
	for (const id of ['p-0930-4-7', 'p-1230-3-5'])
		for (const channel of channels) {
			const previous = original.rows.find((row) => row.probeId === id && row.channel === channel),
				current = rows
					.find((row) => row.id === id)
					?.result.channels.find((row) => row.channel === channel)?.atmosphere;
			const resolved = previous?.resolved && current?.resolved;
			const differenceWatts = resolved
				? Math.abs(
						(current.gaussWatts + current.simpsonWatts - previous.gaussWatts - previous.simpsonWatts) / 2,
					)
				: null;
			const allowanceWatts = resolved
				? current.empiricalAllowanceWatts + previous.empiricalAllowanceWatts + 1e-12
				: null;
			checks.push({
				id: `surface-parity:${id}`,
				channel,
				state: !resolved ? 'unresolved' : differenceWatts <= allowanceWatts ? 'passed' : 'failed',
				differenceWatts,
				allowanceWatts,
				description:
					'Mean independent atmosphere estimate matches original surface J1 within summed empirical allowances plus a 1e-12 W arithmetic floor; same geometry and physics, no higher order.',
			});
		}
	for (const id of ['p-0930-4-7', 'p-1230-3-5', 'outward-h1000', 'escaping-h1000'])
		for (const channel of channels) {
			const component = ground(id, channel),
				geometry = rows.find((row) => row.id === id)?.result.geometry;
			const resolved = component?.resolved;
			checks.push({
				id: `top-ground-zero:${id}`,
				channel,
				state: !resolved
					? 'unresolved'
					: geometry.boundary === 'top' && component.gaussWatts === 0 && component.simpsonWatts === 0
						? 'passed'
						: 'failed',
				differenceWatts: resolved
					? Math.max(Math.abs(component.gaussWatts), Math.abs(component.simpsonWatts))
					: null,
				allowanceWatts: resolved ? 0 : null,
				description:
					'An escaping/top ray terminates at atmosphere exit and has exactly zero direct-ground contribution.',
			});
		}
	for (const channel of channels) {
		const fixed = limit?.channels.find((row) => row.channel === channel)?.directGround;
		const target = fixed?.resolved ? (fixed.gaussWatts + fixed.simpsonWatts) / 2 : null;
		for (const [lower, higher] of [
			[0.001, 1],
			[1, 100],
			[100, 1000],
		]) {
			const a = ground(`ground-h${lower}`, channel),
				b = ground(`ground-h${higher}`, channel),
				resolved = fixed?.resolved && a?.resolved && b?.resolved;
			const differenceWatts = resolved
				? Math.abs((a.gaussWatts + a.simpsonWatts) / 2 - target) -
					Math.abs((b.gaussWatts + b.simpsonWatts) / 2 - target)
				: null;
			const allowanceWatts = resolved
				? a.empiricalAllowanceWatts + b.empiricalAllowanceWatts + 2 * fixed.empiricalAllowanceWatts + 1e-12
				: null;
			checks.push({
				id: `ground-limit-shrink:${lower}:${higher}`,
				channel,
				state: !resolved ? 'unresolved' : differenceWatts <= allowanceWatts ? 'passed' : 'failed',
				differenceWatts,
				allowanceWatts,
				description:
					'Lower-height direct-ground estimate is no farther from the independently integrated fixed-ground Lambertian limit, allowing both empirical errors. Does not compare exact-ground inward recurrence values.',
			});
		}
		const near = ground('ground-h0.001', channel),
			resolved = fixed?.resolved && near?.resolved;
		const differenceWatts = resolved ? Math.abs((near.gaussWatts + near.simpsonWatts) / 2 - target) : null;
		const allowanceWatts = resolved
			? 1e-5 * Math.abs(target) + 1e-12 + near.empiricalAllowanceWatts + fixed.empiricalAllowanceWatts
			: null;
		checks.push({
			id: 'ground-limit-1mm',
			channel,
			state: !resolved ? 'unresolved' : differenceWatts <= allowanceWatts ? 'passed' : 'failed',
			differenceWatts,
			allowanceWatts,
			description:
				'One-millimetre direct-ground limit agrees within 1e-5 relative plus 1e-12 W and the joint empirical allowance; this tests a local boundary limit, not Kider agreement.',
		});
	}
	return checks;
}
