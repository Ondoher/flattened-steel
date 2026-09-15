import {scatterFragment} from '../../orders/kernels.js';

/** Exact original anchors and their two declared J2-only replacements.
 * @type {readonly SkyGroundBoundaryReplacement[]}
 */
export const groundBoundaryReplacements = Object.freeze([
	{
		original: '\tMedium medium = sampleMediumAtPoint(point);\n\tvec3 outgoing = phaseOutgoingDirection(',
		replacement:
			'\tMedium medium = sampleMediumAtPoint(point);\n\tfloat boundaryDirectRadiance = 0.0;\n\tif (positionIndex == 0) {\n\t\tfloat incidenceCosine = max(0.0, dot(normalize(point), SOURCE_DIRECTION));\n\t\tboundaryDirectRadiance = SOURCE_IRRADIANCE * sourceTransmittance(point)\n\t\t\t* incidenceCosine * GROUND_ALBEDO / PI;\n\t}\n\tvec3 outgoing = phaseOutgoingDirection(',
	},
	{
		original: '\t\tfloat incomingRadiance = texelFetch(uPreviousL, ivec2(incomingIndex, row), 0).r;',
		replacement:
			'\t\tfloat incomingRadiance = texelFetch(uPreviousL, ivec2(incomingIndex, row), 0).r;\n\t\tif (positionIndex == 0 && incomingRecord.z < 0.0) incomingRadiance = boundaryDirectRadiance;',
	},
]);

/** Apply only the declared source substitutions, rejecting missing/duplicate anchors.
 * @param {string} original - Original complete receiver-local scatter shader.
 * @returns {string} J2-only atmospheric-side boundary shader.
 */
export function patchGroundBoundaryScatter(original) {
	let result = original;
	for (const {original: anchor, replacement} of groundBoundaryReplacements) {
		if (result.split(anchor).length !== 2)
			throw new Error('Ground-boundary shader anchor is missing or ambiguous.');
		result = result.replace(anchor, replacement);
	}
	return result;
}

/** Build the separate J2 fragment; the caller must select it for J2 only.
 * @param {string} common - Unchanged authenticated production common shader.
 * @returns {string} Checked raw combined-density intervention.
 */
export function groundBoundaryScatterFragment(common) {
	return patchGroundBoundaryScatter(scatterFragment(common, false));
}
