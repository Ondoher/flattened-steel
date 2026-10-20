import {reference,interval} from '../reconstruction-mechanisms/metrics.mjs';
import {read} from './common.mjs';

/** Paired absolute-error bootstrap, preserving shared physical-direct samples.
 * Threshold unchanged; the original rectangle decision remains separately saved.
 * @param {any} row @param {string} name @returns {any} */
export function pairedProtection(row,name){
 const old=row.results.original,next=row.results[name],out=[],bias=old.envelopes.m+old.envelopes.r+next.envelopes.m+next.envelopes.r;let state=3718372961;
 for(let draw=0;draw<2000;draw++){let a=0,b=0;for(let j=0;j<32;j++){state=(Math.imul(state,1664525)+1013904223)>>>0;const i=state>>>27;a+=(old.bins[i].mE+old.bins[i].rE)/32;b+=(next.bins[i].mE+next.bins[i].rE)/32;}out.push(Math.abs(b)-Math.abs(a));}
 out.sort((a,b)=>a-b);const lower=out[99]-bias,upper=out[1899]+bias;
 return {lower,upper,bias,passed:upper<=.001,rejected:lower>.001,inconclusive:lower<=.001&&upper>.001,method:'2000 paired shared-batch bootstrap of |candidate mean error|-|original mean error|, one-sided5/95quantiles plus finite envelopes; empirical, not simultaneous global coverage.'};
}

/** Independent physical-error bounds for the complete Sun control and candidate.
 * Each marginal is widened to approx98% Student; union interpretation is finite
 * empirical evidence, not a certified joint or truncation theorem.
 * @param {any} f @param {any} row @param {string} name @returns {any} */
export function sunProtection(f,row,name){
 const {ref,scale}=reference(f),parent=read(f.parent.path),sun=parent.packets.find(x=>x.geometry==='sun-4096-p1'&&x.channel===f.packet.channel),value=sun.result.fine.normalized/scale,sunBias=2*Math.abs(sun.result.sums[128].normalized-sun.result.sums[64].normalized)/scale+2e-5*Math.abs(value),referenceBias=2*Math.abs(ref.quadratureChange??0)*Math.abs(ref.mean/scale),z=row.results[name];
 const widen=(xs,bias)=>{const q=interval(xs,bias),half=q.half*2.46/2.04;return {...q,half,lo:q.mean-half-bias,hi:q.mean+half+bias};},a=widen(ref.batches.map(x=>value-x/scale),sunBias+referenceBias),b=widen(z.bins.map(x=>x.mE+x.rE),z.envelopes.m+z.envelopes.r),range=x=>[x.lo<=0&&x.hi>=0?0:Math.min(Math.abs(x.lo),Math.abs(x.hi)),Math.max(Math.abs(x.lo),Math.abs(x.hi))],u=range(a),v=range(b),lower=v[0]-u[1],upper=v[1]-u[0];
 return {baseline:a,candidate:b,lower,upper,passed:upper<=.001,rejected:lower>.001,inconclusive:lower<=.001&&upper>.001,referenceBias,source:'Control error: independent path MC00613; candidate error: independent direct-L1 continuous J2 paired-integrand oracle. Same black-boundary pure-J2 physics, distinct estimators; keep overlap diagnostics. Marginal intervals widened before the absolute-error subtraction.'};
}
