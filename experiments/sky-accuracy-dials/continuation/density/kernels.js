import {transportFragment} from '../../orders/kernels.js';

/** Admit only the two species-separated higher-density interventions.
 * @param {unknown} mode - External representation selector.
 * @returns {asserts mode is SkyDensityMode} Validated representation.
 */
export function requireDensityMode(mode) {
	if (mode !== 'splitraw' && mode !== 'factored') throw new RangeError('Unknown higher-density representation.');
}

/** Construct one species coefficient using the same incoming radiance field.
 * Both controls first sum lighting in the same arithmetic order. Split raw
 * multiplies by physical density at the retained knot; factored stores lighting.
 * @param {string} common - Authenticated receiver-local common shader.
 * @param {SkyDensitySpecies} species - Selected physical scattering species.
 * @param {SkyDensityMode} mode - Retained density or lighting coefficient.
 * @returns {string} Scalar species scattering fragment.
 */
export function densityScatterFragment(common, species, mode) {
	requireDensityMode(mode);
	if (species !== 'rayleigh' && species !== 'mie') throw new RangeError('Unknown density species.');
	const coefficient = species === 'rayleigh' ? 'medium.rayleighScattering' : 'medium.mieScattering';
	const phase = species === 'rayleigh' ? 'rayleighPhase' : 'miePhase';
	return `#version 300 es
precision highp float;
precision highp int;
uniform sampler2D uPreviousL;
uniform sampler2D uF68Directions;
uniform sampler2D uOutgoingDirections;
${common}
layout(location = 0) out float outputValue;
void main() {
	int outgoingIndex = int(gl_FragCoord.x);
	int row = int(gl_FragCoord.y);
	vec3 point = representativePoint(row % POSITION_COUNT, row / POSITION_COUNT);
	Medium medium = sampleMediumAtPoint(point);
	vec3 outgoing = phaseOutgoingDirection(
		point,
		texelFetch(uOutgoingDirections, ivec2(outgoingIndex, 0), 0).xyz
	);
	float lighting = 0.0;
	for (int incomingIndex = 0; incomingIndex < F68_COUNT; incomingIndex += 1) {
		vec4 incomingRecord = texelFetch(uF68Directions, ivec2(incomingIndex, 0), 0);
		vec3 incoming = phaseIncomingDirection(point, incomingRecord.xyz);
		float incomingRadiance = texelFetch(uPreviousL, ivec2(incomingIndex, row), 0).r;
		lighting += incomingRadiance * ${phase}(outgoing, incoming) * incomingRecord.w;
	}
	outputValue = ${mode === 'splitraw' ? `${coefficient} * lighting` : 'lighting'};
}`;
}

/** Replace exactly one authenticated template anchor, rejecting source drift.
 * @param {string} source - Parent generated fragment.
 * @param {string} before - Unique original executable text.
 * @param {string} after - Deliberately changed intervention text.
 * @returns {string} One exact transformed fragment.
 */
function replaceUnique(source, before, after) {
	if (source.split(before).length !== 2) throw new Error('Density transport template anchor changed.');
	return source.replace(before, after);
}

/** Transport one species with identical path, attenuation and reconstruction.
 * Rayleigh creates a temporary radiance with no ground contribution. Mie adds
 * that temporary before applying the unchanged reflected-ground term once.
 * Both scatter passes read the same previous order; the output never aliases it.
 * @param {string} common - Authenticated receiver-local common shader.
 * @param {SkyDensitySpecies} species - Physical scattering species.
 * @param {SkyDensityMode} mode - Whether density is applied at the query.
 * @returns {string} Scalar transport fragment with explicit combination order.
 */
export function densityTransportFragment(common, species, mode) {
	requireDensityMode(mode);
	if (species !== 'rayleigh' && species !== 'mie') throw new RangeError('Unknown density species.');
	let source = transportFragment(common, false);
	if (mode === 'factored') {
		const coefficient = species === 'rayleigh' ? 'medium.rayleighScattering' : 'medium.mieScattering';
		source = replaceUnique(
			source,
			'transmittance * sampleJ(uPreviousJ, point, direction) * measure',
			`transmittance * (${coefficient} * sampleJ(uPreviousJ, point, direction)) * measure`,
		);
	}
	const groundBranch = 'if (hitsGround && GROUND_ALBEDO > 0.0) {';
	if (species === 'rayleigh') source = replaceUnique(source, groundBranch, 'if (false) {');
	else {
		source = replaceUnique(
			source,
			'uniform sampler2D uPreviousJ;',
			'uniform sampler2D uPreviousJ;\nuniform sampler2D uRayleighL;',
		);
		source = replaceUnique(
			source,
			groundBranch,
			`radiance += texelFetch(uRayleighL, ivec2(directionIndex, row), 0).r;\n\t${groundBranch}`,
		);
	}
	return source;
}
