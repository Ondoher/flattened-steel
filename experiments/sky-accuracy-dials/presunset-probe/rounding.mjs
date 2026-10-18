import assert from 'node:assert/strict';

/** Separate Float32 totals and isolated orders can differ at the last rounding bits.
 * A gamma16 bound conservatively covers four positive additions and separately
 * rounded final attenuation products; later positive additions cannot reduce total.
 * This qualifies stored values, never changes them or relaxes sampling targets.
 * @param {number[]} means All-order, then pure N1,N2,N3,N4 batch means.
 * @returns {{all:number,sumFirstFour:number,deficit:number,relative:number,bound:number}}
 */
export function qualify(means){
 assert.ok(means.length>=5&&means.slice(0,5).every(x=>Number.isFinite(x)&&x>=0));
 const all=means[0],sumFirstFour=means.slice(1,5).reduce((s,x)=>s+x,0),deficit=sumFirstFour-all,u=2**-24,bound=16*u/(1-16*u)*Math.max(sumFirstFour,1e-30);
 assert.ok(deficit<=bound,JSON.stringify({all,sumFirstFour,deficit,bound}));
 return {all,sumFirstFour,deficit,relative:deficit/Math.max(sumFirstFour,1e-30),bound};
}
