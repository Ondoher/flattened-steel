import {Native15BrunetonExposureEvaluator} from './Native15BrunetonExposureEvaluator.js';

const REC709_LUMINANCE = [0.2126, 0.7152, 0.0722];

function native15(values, name) {
	if (!values || values.length !== 15 || !Array.from(values).every((value) => Number.isFinite(value) && value >= 0)) {
		throw new TypeError(`${name} must contain 15 finite nonnegative values.`);
	}
	return Array.from(values);
}

/**
 * Reduce atmosphere-transmitted direct extraterrestrial irradiance at the
 * receiver to the one local luminance scalar that drives global exposure.
 */
export function deriveSourceLocalLuminance({incidentIrradiance, transmittance}) {
	const incident = native15(incidentIrradiance, 'Incident irradiance');
	const transport = native15(transmittance, 'Atmosphere transmittance');
	const transmitted = incident.map((value, channel) => value * transport[channel]);
	const linearSrgb = new Native15BrunetonExposureEvaluator().project(transmitted);
	const illuminanceLux = Math.max(0, linearSrgb.reduce((sum, value, channel) => sum + value * REC709_LUMINANCE[channel], 0));
	return {
		luminanceCdPerSquareMeter: illuminanceLux / Math.PI,
		illuminanceLux,
		incidentIrradiance: incident,
		transmittance: transport,
		transmittedIrradiance: transmitted,
	};
}

/** Uniform spherical emitter irradiance at a receiver outside the source. */
export function deriveFiniteSourceIncidentIrradiance({surfaceRadiance, radiusMeters, distanceMeters}) {
	const radiance = native15(surfaceRadiance, 'Surface radiance');
	if (!Number.isFinite(radiusMeters) || radiusMeters <= 0 || !Number.isFinite(distanceMeters) || distanceMeters <= radiusMeters) {
		throw new RangeError('Finite-source radius and receiver distance are invalid.');
	}
	const projectedSolidAngleSteradians = Math.PI * (radiusMeters / distanceMeters) ** 2;
	return {
		projectedSolidAngleSteradians,
		values: radiance.map((value) => value * projectedSolidAngleSteradians),
	};
}

export const SOURCE_DERIVED_LOCAL_LUMINANCE_CONTRACT_ID = 'atmosphere-transmitted-direct-source-local-luminance-v1';
