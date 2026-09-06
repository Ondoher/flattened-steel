import { stableHash } from '../shader/stableHash.js';

/**
 * Create the geometry-owned, observer-local upper-hemisphere quadrature used
 * by the live display meter.  The midpoint rule is deliberately expressed in
 * mu = cos(theta): its equal solid-angle cells integrate a uniform sky to
 * exactly pi times its luminance, independent of the camera.
 *
 * @param {{ readonly ringCount?: number, readonly azimuthCount?: number }} [configuration]
 * @returns {{ readonly id: string, readonly samples: readonly { readonly localDirection: readonly [number, number, number], readonly solidAngleSteradians: number, readonly projectedSolidAngleSteradians: number }[], readonly uniformLuminanceIntegralSteradians: number, readonly fingerprint: string }}
 */
export function createSkyIlluminanceProbePlan(configuration = {}) {
	const ringCount = configuration.ringCount ?? 4;
	const azimuthCount = configuration.azimuthCount ?? 8;

	if (!Number.isInteger(ringCount) || ringCount < 1) {
		throw new RangeError('Sky illuminance probe ringCount must be a positive integer.');
	}
	if (!Number.isInteger(azimuthCount) || azimuthCount < 1) {
		throw new RangeError('Sky illuminance probe azimuthCount must be a positive integer.');
	}

	const solidAngleSteradians = (2 * Math.PI) / (ringCount * azimuthCount);
	const samples = [];
	let uniformLuminanceIntegralSteradians = 0;

	for (let ringIndex = 0; ringIndex < ringCount; ringIndex += 1) {
		const mu = (ringIndex + 0.5) / ringCount;
		const horizontal = Math.sqrt(Math.max(0, 1 - mu * mu));
		for (let azimuthIndex = 0; azimuthIndex < azimuthCount; azimuthIndex += 1) {
			const azimuth = (2 * Math.PI * (azimuthIndex + 0.5)) / azimuthCount;
			const projectedSolidAngleSteradians = mu * solidAngleSteradians;
			samples.push(Object.freeze({
				// Geometry maps local right/up/forward into its physical frame.
				localDirection: /** @type {const} */ ([
					horizontal * Math.cos(azimuth),
					mu,
					horizontal * Math.sin(azimuth),
				]),
				solidAngleSteradians,
				projectedSolidAngleSteradians,
			}));
			uniformLuminanceIntegralSteradians += projectedSolidAngleSteradians;
		}
	}
	if (Math.abs(uniformLuminanceIntegralSteradians - Math.PI) > 1e-12) {
		throw new Error('Sky illuminance probe must integrate a uniform sky to pi times its luminance.');
	}

	const body = {
		id: `observer-upper-hemisphere-midpoint-mu-r${ringCount}-a${azimuthCount}-v1`,
		ringCount,
		azimuthCount,
		samples,
		uniformLuminanceIntegralSteradians,
	};

	return Object.freeze({
		...body,
		fingerprint: stableHash(body),
	});
}
