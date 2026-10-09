import {CANONICAL_ATMOSPHERE_CONSTANTS} from '../../src/algorithm32/implementation/canonical-atmosphere/consts.js';
const hr=CANONICAL_ATMOSPHERE_CONSTANTS.rayleighScaleHeight.value;

/** Exact exponential flat-medium column with a stable horizontal limit.
 * @param {number} a - Starting altitude, meters.
 * @param {number} b - Ending altitude, meters.
 * @param {number} length - Nonnegative physical segment, meters.
 * @param {number} scale - Positive density scale, meters.
 * @returns {number} - Integrated relative density, meters.
 */
export function column(a,b,length,scale) {
	const q=(b-a)/scale;
	return Math.exp(-a/scale)*length*(q===0 ? 1 : -Math.expm1(-q)/q);
}

/** Positive interval weights for linear source function in optical depth.
 * @param {number} tau - Nonnegative optical depth.
 * @returns {number[]} - Lower/upper attenuation weights.
 */
export function attenuationWeights(tau) {
	if(tau<.01) {
		const total=tau*(1-tau/2+tau*tau/6-tau*tau*tau/24);
		const upper=tau*(.5-tau/3+tau*tau/8-tau*tau*tau/30);
		return [total-upper,upper];
	}
	const total=-Math.expm1(-tau),upper=(total-tau*Math.exp(-tau))/tau;
	return [total-upper,upper];
}

/** Squared cumulative Rayleigh-column coordinate along a finite view segment.
 * @param {number} fraction - Unit interval index fraction.
 * @param {number} length - Full physical segment, meters.
 * @param {number} dz - Vertical unit direction.
 * @returns {number} - Physical distance from the segment start, meters.
 */
export function pathDistance(fraction,length,dz) {
	if(fraction===0)return 0;if(fraction===1)return length;
	const a=-dz*length/hr,q=fraction*fraction;
	return Math.abs(a)<.001 ? length*q : Math.max(0,Math.min(length,-hr/dz*Math.log1p(q*Math.expm1(a))));
}

