import {NATIVE_15_SPECTRAL_BASIS} from '../../../src/algorithm32/profiles/index.js';
/** Toronto optical tables are scoped to one contained browser execution. @type {HorizonAerosolMaterial|null} */
let material = null;
/** Install authenticated optical input before compiling a wavelength. @param {HorizonAerosolMaterial} value @returns {void} */
export function setTorontoMaterial(value) {material = value;}

/** Original compiler phase, retained verbatim for unsupported wavelengths. */
export const originalPhase = `float miePhase(vec3 outgoingDirection, vec3 incomingDirection) {
	float cosine = clamp(dot(outgoingDirection, incomingDirection), -1.0, 1.0);
	float normalization = (3.0 / (8.0 * PI))
		* ((1.0 - MIE_G * MIE_G) / (2.0 + MIE_G * MIE_G));
	float denominator = max(1.0 + MIE_G * MIE_G - 2.0 * MIE_G * cosine, 1e-7);
	return normalization * (1.0 + cosine * cosine) / pow(denominator, 1.5);
}`;

/** Replace only phase evaluation with the normalized piecewise-linear Toronto table.
 * @param {number} wavelength Native channel center in nm.
 * @returns {string} GLSL phase in sr^-1; no material means the original analytic phase.
 */
export function torontoPhaseGlsl(wavelength) {
	if (!material) return originalPhase;
	const channel=NATIVE_15_SPECTRAL_BASIS.channels.findIndex(c=>Math.abs(c.center.value-wavelength)<1e-7);
	if(channel<0) throw new Error('Toronto phase requires an authenticated Native15 center.');
	const table=material.phaseTables[channel];
	if (!table) return originalPhase;
	const array=(name,values)=>`const float ${name}[${values.length}]=float[](${values.map(x=>x.toExponential(16)).join(',')});`;
	return `${array('TORONTO_MU',table.mu)}\n${array('TORONTO_PDF',table.pdf)}
float miePhase(vec3 outgoingDirection, vec3 incomingDirection) {
	float c=clamp(dot(outgoingDirection,incomingDirection),-1.0,1.0); int lo=0, hi=82;
	for(int i=0;i<7;i++){int mid=(lo+hi)/2;if(c>=TORONTO_MU[mid])lo=mid;else hi=mid;}
	lo=min(lo,81);float u=clamp((c-TORONTO_MU[lo])/(TORONTO_MU[lo+1]-TORONTO_MU[lo]),0.0,1.0);
	return mix(TORONTO_PDF[lo],TORONTO_PDF[lo+1],u)/(2.0*PI);
}`;
}
