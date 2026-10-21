import assert from 'node:assert/strict';
import {edge,altitude,column,rotate,dot,rayleighPhase,miePhase} from '../interior-illumination/physics.mjs';
import {radialTau} from './segment-transport.mjs';

/** Proposal density only. The physical aerosol phase remains CS.
 * @param {number} mu @returns {number} */
export const historyHg=mu=>(1-.7*.7)/(4*Math.PI*Math.pow(1+.7*.7-1.4*Math.max(-1,Math.min(1,mu)),1.5));

/** Registered positive two-event histories, independent of cached fields and
 * angular reconstruction. Each history stores its physical proposal weight;
 * Float32 upload is explicit and reproducible. @param {any} p
 * @param {number} count @param {number} seed @param {boolean} [rounded]
 * @returns {any} */
export function partialHistories(p,count,seed,rounded=true){
 assert.equal(p.h,0);assert.equal(p.table,null);assert.equal(count%32,0);
 let state=seed>>>0;const random=()=>{state=(state+0x6D2B79F5)>>>0;let x=state;x=Math.imul(x^(x>>>15),x|1);x^=x+Math.imul(x^(x>>>7),x|61);return ((x^(x>>>14))>>>0)/4294967296;};
 const first=[],tail=[],length=4375,H=1200,normal=-Math.expm1(-length/H);
 for(let i=0;i<count;i++){
  const branch=random(),u=random(),s=branch<.5?length*u:-H*Math.log1p(-u*normal),ps=.5/length+.5*Math.exp(-s/H)/(H*normal),component=Math.floor(3*random()),a=random(),phi=2*Math.PI*random(),mu=component===0?2*a-1:(1+.7*.7-Math.pow((1-.7*.7)/(1-.7+1.4*a),2))/1.4,d=rotate(mu,phi,component===1?p.sun:[0,0,1]),pd=(1/(4*Math.PI)+historyHg(dot(d,p.sun))+historyHg(d[2]))/3,end=edge(p.radius,p.top,s,d[2]).length,span=Math.log1p(end/1000),t=1000*Math.expm1(random()*span),pt=1/((t+1000)*span),weight=1/(ps*pd*pt);
  assert.ok(end>0&&weight>0&&Number.isFinite(weight));first.push(...d,s);tail.push(t,weight,rayleighPhase(dot(d,p.sun)),miePhase(null,dot(d,p.sun)));
 }
 return {first:rounded?Array.from(Float32Array.from(first)):first,tail:rounded?Array.from(Float32Array.from(tail)):tail,count,seed,batches:32,length,proposal:'s=.5 uniform+.5 truncated exp1200; incoming=(uniform+HG.7 Sun+HG.7 view)/3; t logarithmic1000 along physical branch; all joint mixture PDFs divided out; physical phases Rayleigh/CS'};
}

/** Independent binary64 physical two-event integrand on the uploaded histories.
 * No cache, reconstruction, projection coefficient or source row is read.
 * @param {any} p @param {number[]} first @param {number[]} tail
 * @param {number} nc @returns {number[]} */
export function partialHistoryValue(p,first,tail,nc){
 const d=first.slice(0,3),s=first[3],t=tail[0],h=altitude(p.radius,s,d[2],t),sunMu=((p.radius+s)*p.sun[2]+t*dot(d,p.sun))/(p.radius+h),exit=edge(p.radius,p.top,h,sunMu);if(exit.ground)return [0,0,0,0];
 const weight=p.irradiance*tail[1]*Math.exp(-radialTau(p,s)-column(p,s,d[2],t,nc)-column(p,h,sunMu,exit.length,nc)),mu=dot(d,p.sun),origin=[p.br*Math.exp(-h/8000)*rayleighPhase(mu),p.bm*p.ssa*Math.exp(-h/1200)*miePhase(null,mu)],last=[p.br*Math.exp(-s/8000)*rayleighPhase(d[2]),p.bm*p.ssa*Math.exp(-s/1200)*miePhase(null,d[2])];
 return [last[0]*origin[0],last[0]*origin[1],last[1]*origin[0],last[1]*origin[1]].map(x=>x*weight);
}

/** Batch means and three-standard-error Monte Carlo interval. This is a
 * sampling interval, not a deterministic enclosure. @param {number[][]} batches
 * @returns {any} */
export function historyStatistics(batches){
 const vectors=batches.map(x=>[...x,x[0]+x[1],x[2]+x[3],x.reduce((a,b)=>a+b,0)]),mean=vectors[0].map((_,s)=>vectors.reduce((a,x)=>a+x[s],0)/vectors.length),se=mean.map((m,s)=>Math.sqrt(vectors.reduce((a,x)=>a+(x[s]-m)**2,0)/(vectors.length*(vectors.length-1))));return {mean,se,threeSE:se.map(x=>3*x),batches:vectors.length,channels:['lastR/originR','lastR/originM','lastM/originR','lastM/originM','lastR','lastM','total']};
}
