import assert from 'node:assert/strict';
import {read} from './common.mjs';
import {interval} from '../reconstruction-mechanisms/metrics.mjs';

/** Widened independent marginal physical protection with an explicit reference
 * owner. No illumination, quadrature or phase renormalization is performed.
 * @param {any} f @param {any} row @param {any} ref @returns {any} */
export function marginalSun(f,row,ref){
 const scale=row.scale,sun=read(f.parent.path).packets.find(x=>x.geometry==='sun-4096-p1'&&x.channel===f.packet.channel);assert.ok(sun);
 const value=sun.result.fine.normalized/scale,sunBias=2*Math.abs(sun.result.sums[128].normalized-sun.result.sums[64].normalized)/scale+2e-5*Math.abs(value),referenceBias=2*Math.abs(ref.quadratureChange??0)*Math.abs(ref.mean/scale),z=row.results.polarUnion;
 const widen=(xs,bias)=>{const q=interval(xs,bias),half=q.half*2.46/2.04;return {...q,half,lo:q.mean-half-bias,hi:q.mean+half+bias};};
 const control=widen(ref.batches.map(x=>value-x/scale),sunBias+referenceBias),candidate=widen(z.bins.map(x=>x.mE+x.rE),z.envelopes.m+z.envelopes.r),range=x=>[x.lo<=0&&x.hi>=0?0:Math.min(Math.abs(x.lo),Math.abs(x.hi)),Math.max(Math.abs(x.lo),Math.abs(x.hi))],a=range(control),b=range(candidate),lower=b[0]-a[1],upper=b[1]-a[0];
 return {lower,upper,passed:upper<=.001,rejected:lower>.001,inconclusive:lower<=.001&&upper>.001,control,candidate,referenceBias,scope:'Separate widened marginal errors against the explicit matched reference; empirical black-boundary pure J2 only.'};
}
