import assert from 'node:assert/strict';

/** Coupled conservative bounds over the shared per-case reference intervals.
 * Bounds need not be tight; they never choose different r for candidate/control
 * within a case. The box is sensitivity analysis, not simultaneous coverage.
 * @param {any[]} entries @param {number} floor @param {number} factor @returns {any}
 */
function coupledBox(entries,floor,factor){
 const error=(v,r)=>Math.abs(v-r)/Math.max(r,floor),parts=entries.map(e=>{const lo=Math.max(0,e.ref.mean-e.ref.half95),hi=e.ref.mean+e.ref.half95,clip=x=>Math.max(lo,Math.min(hi,x)),points=[lo,hi,clip(e.a),clip(e.b),clip(floor)];return {...e,lo,hi,points,minA:Math.min(...points.map(r=>error(e.a,r))),minB:Math.min(...points.map(r=>error(e.b,r)))};});
 const thresholds=(e,v,t)=>[v/(1+t),...(t<1?[v/(1-t)]:[]),v-t*floor,v+t*floor].filter(x=>Number.isFinite(x)&&x>=e.lo&&x<=e.hi);
 let meanLow=0,meanHigh=0,worstHigh=-Infinity,worstLow=Infinity;
 for(let i=0;i<parts.length;i++){
  const e=parts[i],mean=e.points.map(r=>error(e.a,r)-factor*error(e.b,r));meanLow+=Math.min(...mean);meanHigh+=Math.max(...mean);
  const minOtherB=Math.max(0,...parts.filter((_,j)=>i!==j).map(p=>p.minB)),minOtherA=Math.max(0,...parts.filter((_,j)=>i!==j).map(p=>p.minA));
  worstHigh=Math.max(worstHigh,...[...e.points,...thresholds(e,e.b,minOtherB)].map(r=>error(e.a,r)-factor*Math.max(error(e.b,r),minOtherB)));
  worstLow=Math.min(worstLow,...[...e.points,...thresholds(e,e.a,minOtherA)].map(r=>Math.max(error(e.a,r),minOtherA)-factor*error(e.b,r)));
 }
 return {meanLow:meanLow/entries.length,meanHigh:meanHigh/entries.length,worstLow,worstHigh,definition:'Conservative bounds on mean(eA)-factor*mean(eB) and max(eA)-factor*max(eB) with shared r. Different maxima are coupled through the dominating case; no simultaneous probability claim.'};
}

/** Per-profile means and protected cases; no cross-atmosphere pooling.
 * @param {any[]} rows @param {any[]} references @param {Record<string,number>} [frozenFloors] @returns {any}
 */
export function score(rows,references,frozenFloors){
 const floors=Object.fromEntries(['paper','toronto'].map(p=>[p,frozenFloors?.[p]??Math.max(...references.filter(r=>r.profile===p).map(r=>r.mean))*1e-8]));
 const values=rows.map(row=>{const r=references.find(r=>r.profile===row.profile&&r.id===row.target&&r.channel===row.channel);assert.ok(r,`Missing reference ${row.profile} ${row.target}/${row.channel}`);const d=Math.max(r.mean,floors[row.profile]),eR=(row.rayleigh-r.rayleigh)/d,eM=(row.mie-r.mie)/d;return {...row,reference:r.mean,half95:r.half95,referenceQualified:r.qualified,ratio:row.value/r.mean,error:(row.value-r.mean)/d,rawError:(row.raw-r.mean)/d,rayleighError:eR,mieError:eM,cancellation:Math.abs(eR)+Math.abs(eM)-Math.abs(eR+eM),normalizationShift:(row.mie-row.mieRaw)/d};});
 const keys=[...new Set(values.map(r=>[r.profile,r.config,r.offset].join('|')))];
 const summary=keys.map(key=>{const selected=values.filter(r=>[r.profile,r.config,r.offset].join('|')===key);return {profile:selected[0].profile,config:selected[0].config,offset:selected[0].offset,cases:selected.length,count:selected[0].count,mean:selected.reduce((s,r)=>s+Math.abs(r.error),0)/selected.length,worst:Math.max(...selected.map(r=>Math.abs(r.error))),rawMean:selected.reduce((s,r)=>s+Math.abs(r.rawError),0)/selected.length,worstMass:Math.max(...selected.map(r=>Math.abs(r.phase.relativeMass))),maximumCancellation:Math.max(...selected.map(r=>r.cancellation)),pathMax:Math.max(...selected.map(r=>Math.abs(r.pathChange))),referenceQualified:selected.every(r=>r.referenceQualified),finalistGeometry:selected.every(r=>r.finalistGeometry),standaloneEvaluations:selected.reduce((s,r)=>s+r.evaluations,0),newMilliseconds:selected.filter(r=>!r.reused).reduce((s,r)=>s+r.milliseconds,0)};});
 return {floors,rows:values,summary};
}

/** Shared-reference empirical paired bootstrap for one complete measured contrast.
 * @param {any[]} rows @param {any[]} references @param {string} profile @param {string} candidate @param {string} control @param {number} [offset] @param {Record<string,number>} [frozenFloors] @returns {any}
 */
export function paired(rows,references,profile,candidate,control,offset=0,frozenFloors){
 const a=rows.filter(r=>r.profile===profile&&r.config===candidate&&r.offset===offset),b=rows.filter(r=>r.profile===profile&&r.config===control&&r.offset===offset),keys=a.map(r=>r.target+'|'+r.channel);assert.ok(a.length&&a.length===b.length&&b.every(r=>keys.includes(r.target+'|'+r.channel)),'Incomplete/unequal contrast coverage');
 const entries=a.map(r=>({a:r.value,b:b.find(x=>x.target===r.target&&x.channel===r.channel).value,ref:references.find(x=>x.profile===profile&&x.id===r.target&&x.channel===r.channel)})),floor=frozenFloors?.[profile]??Math.max(...references.filter(r=>r.profile===profile).map(r=>r.mean))*1e-8,groups=[...new Set(entries.map(e=>e.ref.id))].sort(),margins={mean20:[],worst20:[],mean10:[],worst10:[],meanRegression:[],worstRegression:[],protectedRegression:[]};let state=1013904223;
 for(let replicate=0;replicate<2000;replicate++){
  const indices=new Map();for(const group of groups){const selected=[];for(let i=0;i<32;i++){state=(Math.imul(state,1664525)+1013904223)>>>0;selected.push(state>>>27);}indices.set(group,selected);}
  const errors=entries.map(e=>{assert.equal(e.ref.batches.length,32);const r=indices.get(e.ref.id).reduce((s,i)=>s+e.ref.batches[i],0)/32,d=Math.max(r,floor);return [Math.abs(e.a-r)/d,Math.abs(e.b-r)/d];}),meanA=errors.reduce((s,e)=>s+e[0],0)/entries.length,meanB=errors.reduce((s,e)=>s+e[1],0)/entries.length,worstA=Math.max(...errors.map(e=>e[0])),worstB=Math.max(...errors.map(e=>e[1]));
  margins.mean20.push(meanA-.8*meanB);margins.worst20.push(worstA-.8*worstB);margins.mean10.push(meanA-1.1*meanB);margins.worst10.push(worstA-1.1*worstB);margins.meanRegression.push(meanA-meanB-Math.max(.2*meanB,.02));margins.worstRegression.push(worstA-worstB-Math.max(.2*worstB,.02));margins.protectedRegression.push(Math.max(...errors.map(e=>e[0]-e[1]-Math.max(.2*e[1],.02))));
 }
 const intervals=Object.fromEntries(Object.entries(margins).map(([k,v])=>{v.sort((a,b)=>a-b);return [k,{q05:v[99],q50:v[999],q95:v[1899]}];})),costA=a.reduce((s,r)=>s+r.evaluations,0),costB=b.reduce((s,r)=>s+r.evaluations,0),regression=['meanRegression','worstRegression','protectedRegression'].some(k=>intervals[k].q05>0),route1=costA===costB&&(intervals.mean20.q95<=0||intervals.worst20.q95<=0)&&!regression,route2=costA<=.75*costB&&intervals.mean10.q95<=0&&intervals.worst10.q95<=0&&!regression;
 return {profile,candidate,control,offset,cases:entries.length,intervals,coupledSensitivity20:coupledBox(entries,floor,.8),costA,costB,resolvedRegression:regression,route1,route2,method:'2000 shared-reference bootstrap means,32 reported batches per target; identical batch indices across bands sharing histories; independent target-group resampling. One-sided empirical95% is registered decision procedure; coupled interval bounds are sensitivity checks, not simultaneous coverage or a post-selection confidence guarantee.'};
}
