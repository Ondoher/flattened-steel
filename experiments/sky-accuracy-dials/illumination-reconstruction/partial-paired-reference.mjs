import assert from 'node:assert/strict';
import {identity} from '../io/files.mjs';
import {base,read,registration,verifyRun} from './common.mjs';
import {builderTarget,builderGeometry} from './builder-geometry.mjs';
import {fastModel} from './fast-model.mjs';
import {partialHistories,historyHg} from './partial-history.mjs';
import {radialTau} from './segment-transport.mjs';
import {dot,rayleighPhase,miePhase} from '../interior-illumination/physics.mjs';

/** Rebuild only the actual already-computed light interpolator. No new trace,
 * reference illumination or equal-index physical substitution is introduced.
 * @param {any} row @returns {any} */
export function ownedIncidentModel(row){
 let input;if(row.root===base+'00725-h136-source-row'){const item=read(row.root+'/summary.json').rows.find(x=>x.channel===8);input=item.input.path;}else input=row.root+'/input.json.gz';const data=read(input),r=registration(),profile=r.profiles.find(x=>x.id==='paper'),target=builderTarget(profile.control.medium.radius,row.physical.h,89.5,'paired-own-field'),config=r.configs.find(x=>x.k===.5),{union}=builderGeometry(profile,target,8,config);
 assert.deepEqual(data.directions,union.field.g.nodes);assert.deepEqual(data.physical,row.physical);assert.ok(data.levels.n256);return {evaluate:fastModel(union.field,data.levels.n256),parent:identity(input),seal:verifyRun(row.root)};
}

/** Common physical queries for a control-variate reference: the cached angular
 * field is only a variance control with separately known integral. The physical
 * value is always newly traced at each sampled actual height/direction.
 * @param {any} field @param {number} count @param {number} seed @returns {any} */
export function pairedPartialQueries(field,count,seed){
 const proposal=partialHistories(field.physical,count,seed,false),models=field.rows.map(ownedIncidentModel),queries=[],weights=[],proxies={physical:[],normalized:[]};
 for(let i=0;i<count;i++){
  const d=proposal.first.slice(i*4,i*4+3),h=proposal.first[i*4+3],ps=.5/4375+.5*Math.exp(-h/1200)/(1200*(-Math.expm1(-4375/1200))),pd=(1/(4*Math.PI)+historyHg(dot(d,field.physical.sun))+historyHg(d[2]))/3;queries.push(...d,h);weights.push(Math.exp(-radialTau(field.physical,h))/(ps*pd));let hi=1;while(hi<field.altitudes.length-1&&h>field.altitudes[hi])hi++;const lo=hi-1,t=(h-field.altitudes[lo])/(field.altitudes[hi]-field.altitudes[lo]),a=models[lo].evaluate(d),b=models[hi].evaluate(d),P=[rayleighPhase(d[2]),miePhase(null,d[2])],beta=[field.physical.br,field.physical.bm*field.physical.ssa];
  for(let s=0;s<2;s++){const H=[8000,1200][s],lightA=a[0]+a[1],lightB=b[0]+b[1];proxies.physical.push(beta[s]*P[s]*((1-t)*Math.exp(-field.altitudes[lo]/H)*lightA+t*Math.exp(-field.altitudes[hi]/H)*lightB));proxies.normalized.push(beta[s]*Math.exp(-h/H)*P[s]*((1-t)*lightA+t*lightB));}
 }
 return {count,seed,queries,weights,proxies,parents:models.flatMap(x=>[x.parent,x.seal]),scope:'Same incoming samples and physical SZA for two known-integral proxy fields. No proxy value is a physical source oracle or a candidate cache input.'};
}

/** Convert newly traced physical L1 to last-species partial-path samples.
 * @param {any} p @param {any} queries @param {number[][]} light
 * @returns {number[][]} */
export function pairedPhysicalValues(p,queries,light){return light.map((v,i)=>{const d=queries.queries.slice(i*4,i*4+3),h=queries.queries[i*4+3],sum=v[0]+v[1];return [p.br*Math.exp(-h/8000)*rayleighPhase(d[2]),p.bm*p.ssa*Math.exp(-h/1200)*miePhase(null,d[2])].map(x=>x*sum*queries.weights[i]);});}
