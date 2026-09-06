/** Stable identity of the first low-light human-perception approximation. */
export const HUMAN_LOW_LIGHT_CHROMA_FILTER_ID = 'human-low-light-chroma-v1';
export const HUMAN_LOW_LIGHT_CHROMA_FILTER_STAGE = 'source-linear';
export const HUMAN_LOW_LIGHT_CHROMA_FILTER_TARGET = 'stellar';

/** Authenticated E8/encoded-luminance relationship retained by CR6C. */
export const HUMAN_LOW_LIGHT_LUMINANCE_WEIGHTS = Object.freeze([0.2126, 0.7152, 0.0722]);

function requireCondition(condition, message) {
	if (!condition) throw new Error(message);
}

function acceptParameters(parameters) {
	requireCondition(
		parameters?.fullColorMagnitude === 0 &&
			parameters.neutralMagnitude === 3.2 &&
			(parameters.maximumChromaRetention === 0.65 ||
				parameters.maximumChromaRetention === 0.4),
		'Human low-light chroma parameters changed.',
	);
	return parameters;
}

/** Return the smooth retained-chroma fraction for one effective V magnitude. */
export function humanLowLightChromaRetention(visualMagnitude, parameters) {
	const accepted = acceptParameters(parameters);
	requireCondition(Number.isFinite(visualMagnitude), 'Visual magnitude must be finite.');
	const denominator = accepted.neutralMagnitude - accepted.fullColorMagnitude;
	const t = Math.max(0, Math.min(1, (accepted.neutralMagnitude - visualMagnitude) / denominator));
	const smooth = t * t * (3 - 2 * t);
	return accepted.maximumChromaRetention * smooth;
}

/** Return the photopic/E8 luminance scalar used by the CR6D invariant. */
export function humanLowLightLinearLuminance(rgb) {
	requireCondition(rgb?.length === 3, 'Low-light chroma input must contain exactly three channels.');
	let luminance = 0;
	for (let channel = 0; channel < 3; channel += 1) {
		const value = Number(rgb[channel]);
		requireCondition(Number.isFinite(value), 'Low-light chroma input must be finite.');
		luminance += HUMAN_LOW_LIGHT_LUMINANCE_WEIGHTS[channel] * value;
	}
	return luminance;
}

/**
 * Compress stellar chroma toward the equal-luminance achromatic direction.
 * The interpolation is convex for the declared parameter range and therefore
 * adds no clamp or hidden gamut policy.
 */
export function applyHumanLowLightChroma(rgb, metadata, parameters) {
	const retention = humanLowLightChromaRetention(metadata?.visualMagnitude, parameters);
	const luminance = humanLowLightLinearLuminance(rgb);
	const result = /** @type {[number, number, number]} */ ([0, 0, 0]);
	for (let channel = 0; channel < 3; channel += 1) {
		result[channel] = luminance + retention * (Number(rgb[channel]) - luminance);
	}
	return result;
}

/** Registry record consumed by the general view-presentation owner. */
export const HUMAN_LOW_LIGHT_CHROMA_FILTER = Object.freeze({
	id: HUMAN_LOW_LIGHT_CHROMA_FILTER_ID,
	stage: HUMAN_LOW_LIGHT_CHROMA_FILTER_STAGE,
	target: HUMAN_LOW_LIGHT_CHROMA_FILTER_TARGET,
	apply: applyHumanLowLightChroma,
});

/** Combine colliding V-band point fluxes into one effective pixel magnitude. */
export function combinedVisualMagnitude(visualMagnitudes) {
	requireCondition(
		Array.isArray(visualMagnitudes) && visualMagnitudes.length > 0 && visualMagnitudes.every(Number.isFinite),
		'Combined visual magnitude requires finite member magnitudes.',
	);
	const relativeFlux = visualMagnitudes.reduce(
		(sum, magnitude) => sum + 10 ** (-0.4 * magnitude),
		0,
	);
	requireCondition(relativeFlux > 0 && Number.isFinite(relativeFlux), 'Combined V-band flux is invalid.');
	return -2.5 * Math.log10(relativeFlux);
}
