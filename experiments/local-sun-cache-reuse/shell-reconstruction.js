import {CANONICAL_ATMOSPHERE_CONSTANTS as atmosphere} from '../../src/algorithm32/implementation/canonical-atmosphere/consts.js';
import {CANONICAL_SPECTRAL_CHANNELS} from '../../src/algorithm32/profiles/native-15/consts.js';
import {CacheValues} from '../../src/algorithm32/gpu-cache-runtime/CacheValues.js';

const betaR=CANONICAL_SPECTRAL_CHANNELS.map(c=>atmosphere.rayleighCoefficientScale*(c.wavelength.value/1000)**-4);
const betaM=CANONICAL_SPECTRAL_CHANNELS.map(c=>atmosphere.mieAngstromBeta/atmosphere.mieScaleHeight.value*(c.wavelength.value/1000)**-atmosphere.mieAngstromAlpha);

/** Continuous positive physical factor removed only during interpolation.
 * Neither changes stored physical J fields nor supplies a fitted correction.
 * @param {LocalSunShellLayout} layout - Physical slab and source height.
 * @param {number} rho - Source-relative horizontal distance, meters.
 * @param {number} z - Physical altitude, meters.
 * @param {number} channel - Native15 wavelength index.
 * @returns {number} - Log of extinction times geometric dilution, optionally including direct-beam attenuation.
 */
export function shellLogReconstructionFactor(layout,rho,z,channel) {
	const d=layout.height-z,r=Math.hypot(rho,d),hr=atmosphere.rayleighScaleHeight.value,hm=atmosphere.mieScaleHeight.value;
	const densityR=Math.exp(-z/hr),densityM=Math.exp(-z/hm);
	const sourceR=densityR*-Math.expm1(-(layout.top-z)/hr)*hr*r/d;
	const sourceM=densityM*-Math.expm1(-(layout.top-z)/hm)*hm*r/d;
	const sourceAttenuation=layout.reconstruction==='geometric-density' ? 0 : betaR[channel]*sourceR+betaM[channel]*sourceM;
	return Math.log(betaR[channel]*densityR+betaM[channel]*densityM)-sourceAttenuation+2*Math.log(layout.height/r);
}

/** Pack node factors as immutable scalar texture inputs rather than shader registers.
 * @param {LocalSunShellLayout} layout - Owned candidate topology.
 * @returns {CacheData} - Width 15, height compact node count; row-major log factors.
 */
export function shellReconstructionData(layout) {
	return CacheValues.createData({id:`shell-node-log-factors-${layout.nodes.length}-v1`,quantity:'log-interpolation-factor',units:'1',shape:[15,layout.nodes.length],
		values:Float32Array.from(layout.nodes.flatMap(n=>Array.from({length:15},(_,c)=>n.emptyBand ? 0 : shellLogReconstructionFactor(layout,n.rho,n.z,c))))});
}

/** Pack Euclidean radius excess as an immutable physical support texture.
 * @param {LocalSunShellLayout} layout - Owned compact mesh.
 * @returns {CacheData} - Width equals compact count, one scalar row in meters.
 */
export function shellExcessData(layout) {
	return CacheValues.createData({id:`shell-radius-excess-${layout.nodes.length}-v1`,quantity:'euclidean-radius-excess',units:'meters',shape:[layout.nodes.length,1],values:Float32Array.from(layout.nodes.map(n=>n.excess))});
}

/** Emit matching analytic factor and node-specific physical interpolation weight.
 * @param {LocalSunShellLayout} layout - New candidate's independently identified reconstruction.
 * @returns {string} - Runtime/construction GLSL, neutral for the original layout.
 */
export function shellReconstructionGlsl(layout) {
	if(!layout.reconstruction)return 'float shellSpectralNodeWeight(int index,float rho,float z,int c) { return 1.0; }';
	const literal=(/** @type {number} */ n)=>Number.isInteger(n) ? `${n}.0` : n.toPrecision(17);
	return `const float SHELL_BETA_R[15]=float[15](${betaR.map(literal).join(',')});
const float SHELL_BETA_M[15]=float[15](${betaM.map(literal).join(',')});
float shellReconstructionColumn(float z,float scaleHeight,float r,float d) {
	float q=(${literal(layout.top)}-z)/scaleHeight;
	float fraction=q<0.01 ? q*(1.0-q*0.5+q*q/6.0-q*q*q/24.0) : 1.0-exp(-q);
	return exp(-z/scaleHeight)*fraction*scaleHeight*r/d;
}
float shellLogFactor(float rho,float z,int c) {
	float d=${literal(layout.height)}-z;float r=length(vec2(rho,d));
	float densityR=exp(-z/${literal(atmosphere.rayleighScaleHeight.value)});
	float densityM=exp(-z/${literal(atmosphere.mieScaleHeight.value)});
	float sourceR=shellReconstructionColumn(z,${literal(atmosphere.rayleighScaleHeight.value)},r,d);
	float sourceM=shellReconstructionColumn(z,${literal(atmosphere.mieScaleHeight.value)},r,d);
	return log(SHELL_BETA_R[c]*densityR+SHELL_BETA_M[c]*densityM)${layout.reconstruction==='geometric-density' ? '' : '-SHELL_BETA_R[c]*sourceR-SHELL_BETA_M[c]*sourceM'}+2.0*log(${literal(layout.height)}/r);
}
float shellSpectralNodeWeightFromLog(int index,float queryLog,int c) {
	float nodeLog=texelFetch(uShellNodeFactors,ivec2(c,index),0).r;
	return exp(queryLog-nodeLog);
}
float shellSpectralNodeWeight(int index,float rho,float z,int c) {
	return shellSpectralNodeWeightFromLog(index,shellLogFactor(rho,z,c),c);
}`;
}
