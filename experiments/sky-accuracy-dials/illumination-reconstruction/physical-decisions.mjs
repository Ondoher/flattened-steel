import assert from 'node:assert/strict';
import {reference,interval,lightBias} from '../reconstruction-mechanisms/metrics.mjs';
import {miePhase,rayleighPhase,dot,read} from './common.mjs';

/** Bound |baseline error + paired output delta|-|baseline error|, retaining
 * their common reference. Empirical rectangle, not simultaneous coverage.
 * @param {any} baseline @param {any} delta @returns {any} */
export function absoluteChange(baseline,delta){
 const points=[baseline.lo,baseline.hi,0,-delta.lo,-delta.hi].filter(x=>x>=baseline.lo&&x<=baseline.hi),changes=[];
 for(const e of points)for(const d of [delta.lo,delta.hi,0,-e].filter(x=>x>=delta.lo&&x<=delta.hi))changes.push(Math.abs(e+d)-Math.abs(e));
 assert.ok(changes.length>0);const lower=Math.min(...changes),upper=Math.max(...changes);
 return {baseline,delta,lower,upper,passed:upper<=.001,rejected:lower>.001,inconclusive:lower<=.001&&upper>.001};
}

/** A separate physical estimator: integrate cache-free direct L1 against the
 * exact local Rayleigh+Mie kernel. Estimate each reconstruction's error on the
 * same directions, avoiding subtraction of independent whole-light MC totals.
 * Retain the MC cross-check separately; no claim extends beyond black pure J2.
 * @param {any} f @param {any[]} qs @param {any} angular @param {any} row @returns {any} */
export function directPhysical(f,qs,angular,row){
 const {ref,scale}=reference(f),truthBins=Array(32).fill(0),biasBins=Array(32).fill(0),p=f.px;
 for(let i=0;i<qs.length;i++){
  const q=qs[i],w=(p.br*Math.exp(-p.h/8000)*rayleighPhase(dot(q.d,f.out))+p.bm*p.ssa*Math.exp(-p.h/1200)*miePhase(p.table,dot(q.d,f.out)))/q.pdf/scale/(qs.length/32);
  truthBins[q.batch]+=w*(angular.n256[i][0]+angular.n256[i][1]);
  biasBins[q.batch]+=w*lightBias(angular,i).reduce((a,b)=>a+b,0);
 }
 const truthBias=interval(biasBins).hi,truth=interval(truthBins,truthBias),mc=interval(ref.batches.map(x=>x/scale)),overlap=interval(truthBins.map((x,i)=>x-ref.batches[i]/scale),truthBias),parent=read(f.parent.path),sun=parent.packets.find(x=>x.geometry==='sun-4096-p1'&&x.channel===f.packet.channel);
 assert.ok(sun);const value=sun.result.fine.normalized/scale,sunBias=2*Math.abs(sun.result.sums[128].normalized-sun.result.sums[64].normalized)/scale+2e-5*Math.abs(value),sunError=interval(truthBins.map(x=>value-x),truthBias+sunBias),models={};
 for(const [name,z]of Object.entries(row.results)){
  const errors=z.bins.map(b=>b.mE+b.rE),bias=z.envelopes.m+z.envelopes.r,physical=interval(errors,bias),original=row.results.original,vsOriginal=absoluteChange(interval(original.bins.map(b=>b.mE+b.rE),original.envelopes.m+original.envelopes.r),interval(z.bins.map((b,i)=>errors[i]-original.bins[i].mE-original.bins[i].rE),bias+original.envelopes.m+original.envelopes.r)),vsSun=absoluteChange(sunError,interval(errors.map((e,i)=>e+truthBins[i]-value),bias+truthBias+sunBias));
  models[name]={physical,vsOriginal,vsSun};
 }
 return {truth,truthBins,truthBias,mc,overlap,mcAgreement:overlap.lo<=0&&overlap.hi>=0,completeSun4096:{value,bias:sunBias,error:sunError,parent:f.parent},models,scope:'Independent continuous direct-L1 physical J2 integral, black boundary. Paired reconstructed-minus-direct integrands retain covariance; finite path/column/GPU envelopes included. Retained independent path MC overlap is a separate cross-check, not an assumed exact reference.'};
}
